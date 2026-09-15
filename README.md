# RepoLens

**Understand where code lives, how it works, and what could break.**

RepoLens is an AI codebase intelligence engine and change impact explorer. It transforms unfamiliar repositories into interactive, evidence-backed maps of their implementation, dependencies, and architecture.

## Features

- **Ask:** Query the repository in natural language. Answers are backed by precise code evidence (file, line numbers, and exact code snippet).
- **Trace:** Generate a functional flow diagram of any request or process using React Flow.
- **Impact:** Analyze the blast radius of modifying a specific function or symbol before you touch the code.
- **Onboard:** Instantly generate an onboarding guide detailing the architecture, core modules, and a suggested reading path for new hires.

## Architecture

1. **Ingestion & Parsing:** GitPython for cloning; Tree-sitter for robust multi-language AST parsing (extracts functions and classes).
2. **Code Intelligence:** FAISS vector store mapped to code coordinates and raw text.
3. **Retrieval & LLM:** Google Gemini embeddings (`models/gemini-embedding-2`) and generation (`gemini-2.5-flash`).
4. **UI:** Next.js, Tailwind CSS, Lucide Icons, and React Flow.

## Running Locally

1. Set `GEMINI_API_KEY` in `backend/.env`.
2. Start the FastAPI backend:
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --port 8000
   ```
3. Start the Next.js frontend:
   ```bash
   cd frontend
   npm run dev
   ```
4. Open `http://localhost:3000`

## Demo Mode
Click "Try Demo Repository" on the landing page to instantly index a pre-packaged backend mock repository and experience all 4 intelligence modes instantly.
