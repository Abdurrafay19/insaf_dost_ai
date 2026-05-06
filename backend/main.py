import os
import json
import gc
import re
import numpy as np # Added for robust score handling
from typing import TypedDict, List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

from langchain_groq import ChatGroq
from langchain_qdrant import QdrantVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from qdrant_client import QdrantClient
from langgraph.graph import StateGraph, START, END
from dotenv import load_dotenv

load_dotenv()

# ── 1. ENVIRONMENT SETUP ──────────────────────────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip()
QDRANT_URL = os.environ.get("QDRANT_URL", "")
QDRANT_API_KEY = os.environ.get("QDRANT_API_KEY", "")

insaf_graph = None

# ── 2. DATA MODELS (PYDANTIC) ─────────────────────────────────────────────────
class CaseRequest(BaseModel):
    cases: List[str]

class CaseResponse(BaseModel):
    status: str
    data: List[Dict[str, Any]]

# ── 3. RESOURCE INITIALIZATION ────────────────────────────────────────────────
def build_and_compile_graph():
    print("Initializing AI Models and Vector Store...")
    reasoner = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.0, api_key=GROQ_API_KEY) # type: ignore
    fast_llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.0, api_key=GROQ_API_KEY) # type: ignore
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2", model_kwargs={'device': 'cpu'})
    
    qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    vectorstore = QdrantVectorStore(client=qdrant_client, collection_name="pakistan_law", embedding=embeddings)
    
    try:
        from sentence_transformers import CrossEncoder
        reranker = CrossEncoder("BAAI/bge-reranker-base", max_length=512, device="cpu")
        print("Reranker loaded successfully.")
    except Exception as e: 
        print(f"Reranker failed to load: {e}")
        reranker = None
    
    gc.collect()

    class InsafState(TypedDict):
        raw_text: str
        category: str
        legal_keywords: str
        precedents: List[str]
        precedent_meta: List[dict]
        final_answer: str
        audit_score: float

    def processor_node(state):
        prompt = f"Return STRICT JSON: {{\"category\":\"Criminal|Civil|Family\", \"keywords\":\"5 keywords\"}}. Case: {state['raw_text']}"
        try:
            raw_res = str(fast_llm.invoke(prompt).content)
            match = re.search(r'\{.*\}', raw_res, re.S)
            data = json.loads(match.group()) if match else {"category": "Civil", "keywords": state['raw_text'][:50]}
        except: 
            data = {"category": "Civil", "keywords": state['raw_text'][:50]}
        return {"category": data.get("category", "Civil"), "legal_keywords": data.get("keywords", "")}

    def retriever_node(state):
        query = state["legal_keywords"]
        # raw_docs is a list of (Document, score)
        raw_docs = vectorstore.similarity_search_with_score(query, k=10) 
        
        if reranker and raw_docs:
            full_query = f"Law of Pakistan regarding {state['category']}: {state['legal_keywords']}"
            pairs = [[full_query, d[0].page_content[:1200]] for d in raw_docs]
            
            try:
                rr_scores = reranker.predict(pairs)
                # Ensure scores are a list of floats
                if isinstance(rr_scores, (list, tuple, np.ndarray)):
                    rr_scores_list = [float(x) for x in rr_scores]
                else:
                    rr_scores_list = [float(rr_scores)]
                
                # Each r is ((Document, qdrant_score), reranker_score)
                ranked = sorted(zip(raw_docs, rr_scores_list), key=lambda x: x[1], reverse=True)[:3]
                
                # UNPACK: Extract Doc from the inner tuple
                final_docs = [r[0][0] for r in ranked]
                final_scores = [float(r[1]) for r in ranked]
            except Exception as e:
                print(f"⚠️ Reranking failed, falling back: {e}")
                final_docs = [d[0] for d in raw_docs[:3]]
                final_scores = [d[1] for d in raw_docs[:3]]
        else:
            # Fallback if reranker is off - UNPACK Doc from (Doc, Score)
            final_docs = [d[0] for d in raw_docs[:3]]
            final_scores = [d[1] for d in raw_docs[:3]]
        
        return {
            "precedents": [doc.page_content for doc in final_docs],
            "precedent_meta": [
                {"source": doc.metadata.get("source", "Unknown"), "score": round(final_scores[i], 3)} 
                for i, doc in enumerate(final_docs)
            ]
        }

    def reasoner_node(state):
        context = "\n".join([f"[{i+1}] Authority: {state['precedent_meta'][i]['source']}\n{p[:1500]}" for i, p in enumerate(state['precedents'])])
        prompt = f"Using ONLY precedents: {context}. Analyze Case: {state['raw_text']}. Use [Number] citations. Keep it professional."
        return {"final_answer": reasoner.invoke(prompt).content}

    def auditor_node(state):
        answer = state["final_answer"]
        sentences = [s for s in re.split(r'(?<=[.!?])\s+', answer) if len(s) > 20]
        context = "\n".join([p[:500] for p in state['precedents']])
        
        # 1. Much stricter prompt forcing a simple boolean array
        audit_prompt = f"Verify claims. Return strictly a JSON array of booleans of length {len(sentences)}. Example: [true, false].\nCONTEXT: {context}\nSENTENCES: {sentences}"
        
        try:
            raw_audit = str(fast_llm.invoke(audit_prompt).content)
            match = re.search(r'\[.*\]', raw_audit, re.S)
            audit_results = json.loads(match.group()) if match else []
            
            # 2. Safely count trues whether it returned dicts or raw booleans
            supported = sum(1 for item in audit_results if item is True or (isinstance(item, dict) and item.get('v') is True))
            
            # 3. Clamp the score so it absolutely cannot exceed 1.0 (100%)
            raw_score = supported / len(sentences) if sentences else 0.0
            score = min(1.0, raw_score)
        except Exception as e: 
            print(f"Auditor parse error: {e}")
            score = 0.5 
            
        return {"audit_score": round(score, 2)} # Rounds nicely to e.g., 0.85
    
    builder = StateGraph(InsafState)
    builder.add_node("processor", processor_node)
    builder.add_node("retriever", retriever_node)
    builder.add_node("reasoner", reasoner_node)
    builder.add_node("auditor", auditor_node)
    
    builder.add_edge(START, "processor")
    builder.add_edge("processor", "retriever")
    builder.add_edge("retriever", "reasoner")
    builder.add_edge("reasoner", "auditor")
    builder.add_edge("auditor", END)

    return builder.compile()

# ── 4. FASTAPI APP LIFESPAN & SETUP ───────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global insaf_graph
    try:
        insaf_graph = build_and_compile_graph()
        print("✅ Graph compiled successfully and ready to serve requests.")
    except Exception as e:
        print(f"❌ Failed to initialize AI models: {e}")
    yield
    insaf_graph = None
    gc.collect()

app = FastAPI(title="InsafDost AI API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 5. API ENDPOINTS ──────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    if insaf_graph is None:
        raise HTTPException(status_code=503, detail="AI Models are still loading.")
    return {"status": "healthy", "message": "InsafDost API is running."}

@app.post("/analyze", response_model=CaseResponse)
async def analyze_cases(request: CaseRequest):
    if not insaf_graph:
        raise HTTPException(status_code=503, detail="AI Graph not initialized.")
    if not request.cases:
        raise HTTPException(status_code=400, detail="No cases provided.")

    try:
        results = []
        for i, case_text in enumerate(request.cases):
            res = dict(insaf_graph.invoke({"raw_text": case_text})) # type: ignore
            res['_case_num'] = i + 1
            results.append(res)
            gc.collect()
        return {"status": "success", "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")