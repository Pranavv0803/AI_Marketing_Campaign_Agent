# AI Marketing Campaign Generator

An intelligent, multi-channel marketing campaign generator built for hackathons and production workflows. It creates personalized copy (Social Post + Marketing Email) across three distinct customer personas for a fictional smart travel mug ("SipSense ThermoPulse").

---

## Key Principles & Architecture

1. **Hard Rules in Code, Soft Judgment in LLM**: Measurable constraints (character limits, hashtag quotas, word counts, and banned-word lists) are evaluated deterministically in pure Python (`rules.py`). The LLM is restricted exclusively to qualitative voice alignment (`judge.py`).
2. **One Prompt per Step**: Generation is decomposed into modular steps:
   - Concepts (`prompts/concepts.py`)
   - Persona Copy Drafting (`prompts/write_piece.py`)
   - Brand-Fit Judging (`prompts/judge.py`)
   - Automated One-Time Remediation (`prompts/autofix.py`)
3. **High-Performance OpenAI Engine**: Powered by the official OpenAI Python SDK (`gpt-4o-mini` for fast writing and rigorous judging) with connection pooling and automated exponential backoff on rate limits.
4. **Demo-First Resilience (Zero-Spend Mock Mode)**: Built-in offline mock mode (`MOCK_LLM=true` or one-click UI toggle) simulates the entire pipeline with instant, schema-valid synthetic responses. Never fails a live demo due to Wi-Fi outages or API credit limits.
5. **No Heavyweight Frameworks**: Pure, inspectable Python functions with explicit schemas; no LangChain, LangGraph, or CrewAI abstractions.

---

## Repository Layout

```text
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, REST routes
│   │   ├── config.py            # Environment settings (.env)
│   │   ├── schemas.py           # Pydantic v2 models
│   │   ├── llm.py               # Dual-provider client, fallback routing, mock mode
│   │   ├── prompts/             # Isolated single-step prompt templates
│   │   │   ├── concepts.py      # Concepts generation prompt
│   │   │   ├── write_piece.py   # Piece writing prompt with safety margin
│   │   │   ├── judge.py         # Brand voice scoring rubric prompt
│   │   │   └── autofix.py       # Rule remediation prompt
│   │   ├── steps.py             # Step functions (concepts, write, judge, fix)
│   │   ├── rules.py             # Deterministic rule engine (boundaries, Unicode, regex)
│   │   ├── pipeline.py          # run_piece orchestrator
│   │   └── export.py            # Markdown and JSON export generators
│   └── tests/
│       ├── test_rules.py        # Boundary, Unicode, and banned-word unit tests
│       └── test_llm.py          # Wrapper, fallback, and mock mode tests
├── data/
│   └── sample.json              # SipSense smart travel mug & 3 customer personas
├── frontend/
│   ├── src/
│   │   ├── api/client.ts        # Typed fetch client
│   │   ├── components/          # Stepper, BrandKitForm, PersonaCard, PieceCard, ExportView
│   │   ├── types/index.ts       # TypeScript interfaces matching backend schemas
│   │   ├── App.tsx              # Root state manager & wizard controller
│   │   └── index.css            # Tailwind directives & projector typography
│   ├── package.json
│   └── vite.config.ts
├── .env.example                 # Sanitized environment template
├── .gitignore                   # Ignores .env, .venv, node_modules, build outputs
└── README.md
```

---

## Quickstart Guide

### 1. Prerequisites
- Python 3.11+ (or uv)
- Node.js 18+ and npm

### 2. Environment Setup
Copy the sample environment file:
```bash
cp .env.example .env
```
Configure your keys in `.env`:
```env
OPENAI_API_KEY="sk-..."
WRITER_MODEL="gpt-4o-mini"
JUDGE_MODEL="gpt-4o-mini"
MOCK_LLM="false"
MAX_CONCURRENCY=3
ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000"
```

### 3. Backend Execution
```bash
# Activate virtual environment
source .venv_app/bin/activate    # On Windows: .venv_app\Scripts\activate

# Start FastAPI server
uvicorn backend.app.main:app --port 8000 --reload
```
API docs available at: `http://localhost:8000/docs`

### 4. Frontend Execution
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 4-Step Interactive Flow

1. **Setup**: Inspect or edit the SipSense brand kit, banned words, channel limits, and 3 personas. One click "Load Sample Data" restores synthetic defaults.
2. **Concepts**: Request 3 creative concepts; verify none contains banned terms, and select your preferred concept.
3. **Persona Campaign**: View 3 comparative columns (Daily Commuter, Tech Freelancer, Weekend Adventurer) with 1 Social Post and 1 Email each. Inspect brand scores, broken rule diagnostics, and "Fixed automatically" badges. Regenerate individual pieces or all 6 at once.
4. **Export**: One-click download of the complete campaign as formatted Markdown (`.md`) or structured JSON (`.json`).
