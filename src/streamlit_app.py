import streamlit as st
import os
import json
import gc
import re
import numpy as np
from typing import TypedDict, List
from langchain_groq import ChatGroq

# ── 1. SECRETS & ENV SETUP ──────────────────────────────────────────────────
os.environ["GROQ_API_KEY"] = os.environ.get("GROQ_API_KEY", "").strip()
os.environ["QDRANT_URL"] = "https://03e73cb7-1191-4c3b-82c3-3fd2213e7ea7.sa-east-1-0.aws.cloud.qdrant.io"
os.environ["QDRANT_API_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.mpQIWe6JRaesx4OlMpiL22gIhgyIg7rBwitwzZtz8z0"

# ── 2. APP CONFIG & STYLE ─────────────────────────────────────────────────────
st.set_page_config(page_title="InsafDost AI", page_icon="⚖️", layout="wide")

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono&family=Source+Serif+4&display=swap');
html, body, [data-testid="stAppViewContainer"] { background-color: #0a0d14 !important; color: #e6dfc8 !important; }
.insaf-logo { font-family: 'Playfair Display', serif; font-size: 3.5rem; font-weight: 900; text-align: center; background: linear-gradient(135deg, #e8d5a0 0%, #b4913c 40%, #e8d5a0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.insaf-tagline { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; letter-spacing: 0.35em; color: #9cb08b; text-align: center; text-transform: uppercase; margin-bottom: 2rem; }
div.stButton > button {
    background: linear-gradient(135deg, #7a5c1a 0%, #c4a14c 45%, #e8d080 55%, #b4913c 75%, #7a5c1a 100%) !important;
    color: #08090f !important; font-weight: 900 !important; font-size: 1.2rem !important;
    border-radius: 4px !important; padding: 1rem !important; width: 100% !important; border: none !important;
}
.case-card { background: rgba(15,22,35,0.8); border: 1px solid rgba(180,145,60,0.2); padding: 2rem; border-radius: 8px; margin-bottom: 2rem; }
.badge { display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; padding: 5px 12px; border-radius: 4px; margin-right: 8px; font-weight: bold; border: 1px solid rgba(180,145,60,0.3); }
.legal-answer { font-family: 'Source Serif 4', serif; font-size: 1.15rem; line-height: 1.9; border-left: 4px solid #b4913c; padding-left: 1.5rem; margin: 1.5rem 0; color: #f2ebd9; white-space: pre-wrap; }
</style>
""", unsafe_allow_html=True)

if "results" not in st.session_state: 
    st.session_state.results = []

# ── 3. RESOURCE LOADER ────────────────────────────────────────────────────────
@st.cache_resource(show_spinner=False)
def load_resources():
    from langchain_qdrant import QdrantVectorStore
    from langchain_huggingface import HuggingFaceEmbeddings
    from qdrant_client import QdrantClient
    
    reasoner = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.0, groq_api_key=os.environ["GROQ_API_KEY"])
    fast_llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.0, groq_api_key=os.environ["GROQ_API_KEY"])
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2", model_kwargs={'device': 'cpu'})
    qdrant_client = QdrantClient(url=os.environ["QDRANT_URL"], api_key=os.environ["QDRANT_API_KEY"])
    vectorstore = QdrantVectorStore(client=qdrant_client, collection_name="pakistan_law", embedding=embeddings)
    
    try:
        from FlagEmbedding import FlagReranker
        reranker = FlagReranker("BAAI/bge-reranker-base", use_fp16=True)
    except: 
        reranker = None
    
    gc.collect()
    return reasoner, fast_llm, vectorstore, reranker

# ── 4. MULTI-CASE SPLITTER ────────────────────────────────────────────────────
def split_multiple_cases(text):
    parts = re.split(r'(?i)case\s*\d+\s*[:\-]|Case\s*#\d+\s*[:\-]|---', text)
    cleaned = [p.strip() for p in parts if len(p.strip()) > 50]
    return cleaned if cleaned else [text.strip()]

# ── 5. LANGGRAPH PIPELINE ─────────────────────────────────────────────────────
@st.cache_resource(show_spinner=False)
def load_graph(_reasoner, _fast_llm, _vectorstore, _reranker):
    from langgraph.graph import StateGraph, START, END

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
            raw_res = _fast_llm.invoke(prompt).content
            match = re.search(r'\{.*\}', raw_res, re.S)
            data = json.loads(match.group())
        except: 
            data = {"category": "Civil", "keywords": state['raw_text'][:50]}
        return {"category": data.get("category", "Civil"), "legal_keywords": data.get("keywords", "")}

    def retriever_node(state):
        raw_docs = _vectorstore.similarity_search_with_score(state["legal_keywords"], k=10)
        if _reranker and raw_docs:
            texts = [d[0].page_content[:1000] for d in raw_docs]
            rr_scores = _reranker.compute_score([[f"{state['category']} law Pakistan", t] for t in texts])
            ranked = sorted(zip(raw_docs, rr_scores), key=lambda x: x[1], reverse=True)[:4]
            final_docs, scores = [r[0] for r in ranked], [float(r[1]) for r in ranked]
        else:
            final_docs, scores = raw_docs[:4], [0.5]*len(raw_docs[:4])
        return {
            "precedents": [d[0].page_content for d in final_docs],
            "precedent_meta": [{"source": d[0].metadata.get("source", "Unknown"), "score": round(scores[i], 3)} for i, d in enumerate(final_docs)]
        }

    def reasoner_node(state):
        context = "\n".join([f"[{i+1}] Authority: {state['precedent_meta'][i]['source']}\n{p[:1500]}" for i, p in enumerate(state['precedents'])])
        prompt = f"Using ONLY precedents: {context}. Analyze Case: {state['raw_text']}. Use [Number] citations. Keep it professional."
        return {"final_answer": _reasoner.invoke(prompt).content}

    def auditor_node(state):
        answer = state["final_answer"]
        sentences = [s for s in re.split(r'(?<=[.!?])\s+', answer) if len(s) > 20]
        context = "\n".join([p[:500] for p in state['precedents']])
        audit_prompt = f"Verify claims against context. Return JSON: [{{\"id\": 0, \"v\": true/false}}].\nCONTEXT: {context}\nSENTENCES: {sentences}"
        try:
            raw_audit = _fast_llm.invoke(audit_prompt).content
            match = re.search(r'\[.*\]', raw_audit, re.S)
            audit_results = json.loads(match.group())
            supported = sum(1 for item in audit_results if item.get('v'))
            score = supported / len(sentences) if sentences else 0
        except: 
            score = 0.5 
        return {"audit_score": score}

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

# ── 6. UI FLOW ────────────────────────────────────────────────────────────────
st.markdown('<div class="insaf-logo">InsafDost</div><div class="insaf-tagline">Elite Multi-Case Intelligence · Pakistan</div>', unsafe_allow_html=True)

r_llm, f_llm, v_store, rr_eng = load_resources()
user_input = st.text_area("Input Legal Situations", height=250, placeholder="Case 1: [Description]\n---\nCase 2: [Description]...")

if st.button("Execute Analysis  ⟶", use_container_width=True):
    if user_input.strip():
        cases = split_multiple_cases(user_input)
        st.session_state.results = []
        
        with st.status("⛓️ Processing Legal Batch...") as status:
            graph = load_graph(r_llm, f_llm, v_store, rr_eng)
            for i, case_text in enumerate(cases):
                status.write(f"Analyzing Situation {i+1} of {len(cases)}...")
                res = graph.invoke({"raw_text": case_text})
                res['_case_num'] = i + 1
                st.session_state.results.append(res)
                gc.collect()
            status.update(label="✅ All Cases Analyzed", state="complete")
        st.rerun()

# ── 7. DISPLAY RESULTS (MULTI-CARD) ───────────────────────────────────────────
if st.session_state.results:
    st.markdown("### Analysis Results")
    for res in st.session_state.results:
        with st.container():
            st.markdown('<div class="case-card">', unsafe_allow_html=True)
            score = res.get('audit_score', 0)
            conf_color = "#5ed673" if score > 0.7 else "#e6bc4c" if score > 0.4 else "#e65555"
            
            st.markdown(f"""
            <h4 style="color:#b4913c; margin-top:0;">Case Record #{res['_case_num']}</h4>
            <div style="margin-bottom: 1.5rem;">
                <span class="badge" style="color:#d4b45b;">{res['category']} Law</span>
                <span class="badge" style="color:{conf_color}; border-color:{conf_color};">Grounding Accuracy: {score*100:.0f}%</span>
            </div>
            <div class="legal-answer">{res['final_answer']}</div>
            """, unsafe_allow_html=True)
            
            with st.expander("View Cited Authorities"):
                for j, p in enumerate(res['precedents']):
                    st.markdown(f"**[{j+1}] {res['precedent_meta'][j]['source']}**")
                    st.caption(p[:500] + "...")
            st.markdown('</div>', unsafe_allow_html=True)