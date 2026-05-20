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
        is_valid: bool
        category: str
        legal_keywords: str
        precedents: List[str]
        precedent_meta: List[dict]
        final_answer: str
        audit_score: float
        
    def guardrail_node(state):
        prompt = f"Is this text a valid legal scenario, question, or case? Return STRICT JSON: {{\"is_valid\": true/false}}. Text: {state['raw_text']}"
        try:
            raw_res = str(fast_llm.invoke(prompt).content)
            match = re.search(r'\{.*\}', raw_res, re.S)
            data = json.loads(match.group()) if match else {"is_valid": True}
        except: 
            data = {"is_valid": True} # Default to passing it through if it fails
        
        is_valid = data.get("is_valid", True)
        
        # If it's spam, pre-fill the final answer and skip the rest of the graph
        if not is_valid:
            return {
                "is_valid": False, 
                "category": "Irrelevant", 
                "final_answer": "This does not appear to be a valid legal scenario. Please provide a relevant legal case.",
                "audit_score": 1.0, # 100% confident it's irrelevant
                "precedents": [],
                "precedent_meta": []
            }
            
        return {"is_valid": True}    

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
                
                # Combine scores and filter out anything below 0.0
                MIN_SCORE = 0.0 
                valid_ranked = [r for r in zip(raw_docs, rr_scores_list) if float(r[1]) > MIN_SCORE]
                
                ranked = sorted(valid_ranked, key=lambda x: x[1], reverse=True)[:3]
                
                if not ranked:
                    return {
                        "precedents": ["No strictly relevant Pakistani law precedents were found for this specific query."],
                        "precedent_meta": [{"source": "System", "score": 0.0}]
                    }
                
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
        precedents = state.get("precedents", [])
        precedent_meta = state.get("precedent_meta", [])
        context_lines = []
        for i, p in enumerate(precedents):
            meta_item = precedent_meta[i] if i < len(precedent_meta) else {}
            source = meta_item.get("source", "Unknown") if isinstance(meta_item, dict) else "Unknown"
            context_lines.append(f"[{i+1}] Authority: {source}\n{p[:1500]}")
        context = "\n".join(context_lines)
        prompt = (
            f"Using ONLY precedents: {context}. Analyze Case: {state['raw_text']}. "
            f"Use [Number] citations. Keep it professional. "
            f"CRITICAL: Format your response using Markdown. Use **bolding** for key legal terms and Section numbers. "
            f"Break the analysis into structured paragraphs and use numbered lists for recommended steps."
        )
        return {"final_answer": reasoner.invoke(prompt).content}

    def auditor_node(state):
        answer = state["final_answer"]
        sentences = [s for s in re.split(r'(?<=[.!?])\s+', answer) if len(s) > 20]
        context = "\n".join([p[:500] for p in state['precedents']])
        
        # 1. Ask for 1s and 0s instead of booleans
        audit_prompt = f"Verify each sentence against the context. Return ONLY a JSON array of 1s and 0s (Length: {len(sentences)}). 1=Supported, 0=Unsupported. Example: [1, 0, 1]\nCONTEXT: {context}\nSENTENCES: {sentences}"
        
        try:
            raw_audit = str(fast_llm.invoke(audit_prompt).content)
            
            # 2. Safely find the bracketed array
            match = re.search(r'\[(.*?)\]', raw_audit, re.S)
            
            if match:
                # 3. Extract just the 1s and 0s using regex (Bypasses json.loads entirely)
                results = re.findall(r'\b[01]\b', match.group(1))
                
                if results:
                    supported = results.count('1')
                    score = supported / len(results)
                else:
                    score = 0.5
            else:
                score = 0.5
                
        except Exception as e: 
            print(f"Auditor parse error: {e}")
            score = 0.5 
            
        return {"audit_score": round(score, 2)}
    
    def route_guardrail(state):
        # If valid, go to processor. If invalid, go straight to the END.
        if state.get("is_valid", True):
            return "processor"
        return END

    builder = StateGraph(InsafState)
    builder.add_node("guardrail", guardrail_node)
    builder.add_node("processor", processor_node)
    builder.add_node("retriever", retriever_node)
    builder.add_node("reasoner", reasoner_node)
    builder.add_node("auditor", auditor_node)
    
    builder.add_edge(START, "guardrail")
    builder.add_conditional_edges("guardrail", route_guardrail)
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