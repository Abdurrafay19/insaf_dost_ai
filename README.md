# ⚖️ InsafDost AI
**Elite Multi-Case Legal Intelligence for Pakistan**

InsafDost AI is a high-performance legal analysis tool built to process complex Pakistani legal situations. Using an agentic **LangGraph** workflow, it performs automated case categorization, vector retrieval of precedents (RAG), deep reasoning, and an automated grounding audit to ensure high reliability.

## 🚀 Key Features
* **Multi-Case Batch Processing:** Input multiple legal scenarios separated by `---` and process them in a single execution.
* **Agentic LangGraph Workflow:**
    * **Processor:** Identifies legal categories (Criminal/Civil/Family) and extracts key terms.
    * **Retriever:** Hybrid search using Qdrant and BAAI Reranker for high-precision precedent matching.
    * **Reasoner:** Deep legal analysis using Llama 3.3-70B.
    * **Auditor:** A verification agent that calculates a "Grounding Accuracy" score for every response.
* **Professional UI:** A bespoke dark-themed Streamlit interface inspired by legal luxury aesthetics.
* **Source Citations:** Every analysis includes full citations and expandable views of the cited legal authorities.

## 🛠️ Tech Stack
* **Frontend:** Streamlit (Custom CSS)
* **Orchestration:** LangGraph & LangChain
* **LLMs:** Groq (Llama 3.3-70B for reasoning, Llama 3.1-8B for processing & auditing)
* **Vector Database:** Qdrant Cloud
* **Embeddings:** HuggingFace `all-MiniLM-L6-v2`
* **Reranking:** BAAI `bge-reranker-base`

## 📂 Project Structure
```text
INSAFDOSTAI/
├── .streamlit/
│   └── config.toml      # Theme and UI configurations
├── src/
│   └── streamlit_app.py # Main application logic & LangGraph definition
├── .gitignore           # Python and Environment exclusions
├── Dockerfile           # Containerization setup
├── README.md            # Project documentation
└── requirements.txt     # Dependency list
```

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/InsafDostAI.git](https://github.com/YOUR_USERNAME/InsafDostAI.git)
cd InsafDostAI
```

### 2. Configure Environment Variables
Ensure your API keys are set in your environment (or via Streamlit Secrets):
```bash
export GROQ_API_KEY="your_groq_key"
export QDRANT_URL="your_qdrant_url"
export QDRANT_API_KEY="your_qdrant_key"
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
streamlit run src/streamlit_app.py
```

## 🐳 Docker Setup
To containerize the application:
```bash
docker build -t insafdost-ai .
docker run -p 8501:8501 --env-file .env insafdost-ai
```

---
*Developed for the HEC Generative AI Hackathon.*