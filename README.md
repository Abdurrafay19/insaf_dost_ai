# InsafDost AI
Elite multi-case legal intelligence for Pakistan.

InsafDost AI combines a FastAPI backend with a Next.js frontend to analyze Pakistani legal scenarios. A LangGraph pipeline categorizes cases, retrieves precedents from Qdrant, produces a cited analysis, and audits grounding for reliability.

## Key Features
- Multi-case batch processing using numbered cases (for example, "1. ... 2. ...")
- LangGraph pipeline for categorization, retrieval, reasoning, and auditing
- Source citations with grounding scores
- Modern Next.js UI backed by a FastAPI JSON API

## Tech Stack
- Frontend: Next.js (App Router) and Tailwind CSS
- Backend: FastAPI, LangGraph, LangChain
- LLMs: Groq (Llama 3.3-70B for reasoning, Llama 3.1-8B for routing/auditing)
- Vector database: Qdrant Cloud
- Embeddings: sentence-transformers (all-MiniLM-L6-v2)
- Reranking: BAAI bge-reranker-base

## Project Structure
```text
InsafDostAI/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
└── README.md
```

## Environment Variables
Backend:
- GROQ_API_KEY
- QDRANT_URL
- QDRANT_API_KEY

Frontend:
- NEXT_PUBLIC_API_BASE_URL (defaults to http://127.0.0.1:8000)

## Local Setup

### Backend
```bash
python -m venv backend/venv
backend/venv/Scripts/activate
pip install -r backend/requirements.txt
uvicorn main:app --app-dir backend --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

If your API runs on a different host or port, set NEXT_PUBLIC_API_BASE_URL in frontend/.env.local.

## API
- GET /health
- POST /analyze
    - Body: {"cases": ["case one", "case two"]}

## Docker (Backend)
```bash
docker build -t insafdost-api ./backend
docker run -p 7860:7860 --env-file .env insafdost-api
```