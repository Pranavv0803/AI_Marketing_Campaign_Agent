# Implementation Plan: AI Marketing Campaign Generator

**Branch**: `001-campaign-generator` | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-campaign-generator/spec.md`

## Summary

Build an interactive web application that generates personalized multi-channel marketing campaigns (Social Post + Marketing Email) for a fictional smart travel mug across three distinct customer personas. The architecture comprises a stateless Python 3.11+ FastAPI backend utilizing plain functional orchestration (no agent frameworks), the official OpenAI Python SDK targeting both OpenAI and Google Gemini's OpenAI-compatible endpoint as fallback, a deterministic rule-checking engine for character/hashtag/banned-word compliance, a qualitative LLM judge for voice fit, and a single-attempt automatic remediation cycle. The frontend is a React + Vite + Tailwind SPA organized as a 4-step stepper with side-by-side comparative persona columns and instant Markdown/JSON export.

## Technical Context

**Language/Version**: Python 3.11+ (Backend), TypeScript / React 18+ (Frontend)

**Primary Dependencies**:
- *Backend*: `fastapi>=0.110.0`, `uvicorn>=0.28.0`, `pydantic>=2.6.0`, `openai>=1.14.0`, `python-dotenv>=1.0.0`
- *Frontend*: `react>=18.2.0`, `react-dom>=18.2.0`, `vite>=5.1.0`, `tailwindcss>=3.4.0`

**Storage**: In-memory runtime state passed per API request. `/data/sample.json` provides the static baseline brand kit ("SipSense") and 3 personas. No database.

**Testing**: `pytest>=8.0.0`, `pytest-asyncio>=0.23.0` for unit, boundary, Unicode, provider fallback, and end-to-end mock tests.

**Target Platform**: Cross-platform web application (Local Uvicorn server on port 8000 + Vite dev server on port 5173).

**Project Type**: Web application (FastAPI REST service + React SPA frontend).

**Performance Goals**:
- Full campaign generation (6 pieces in parallel with semaphore cap 3): < 8 seconds total wall-clock time on live APIs.
- Instantaneous (< 200ms) execution in Offline Mock Mode (`MOCK_LLM=true`).
- End-to-end demo flow (Sample Load → Concept Pick → Generation → Export) executable in under 5 minutes.

**Constraints**:
- Strictly plain, inspectable Python functions; zero heavy agent frameworks (no LangChain, LangGraph, CrewAI).
- Dual-provider LLM integration using only the official `openai` SDK (`openai` primary, Google Gemini OpenAI-compatible endpoint fallback).
- Concurrency bounded by `asyncio.Semaphore(3)` with exponential backoff on HTTP 429 and 5xx.
- Zero committed secrets: `.env.example` committed with dummy keys; `.env` strictly git-ignored.
- Deterministic boundary checking (Unicode codepoints, whitespace tokenization, regex inflection & obfuscation matching).

**Scale/Scope**: Single product ("SipSense Smart Travel Mug"), exactly 3 personas, 2 marketing channels (Social Post, Marketing Email), 4 UI wizard steps.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **1. Hard Rules in Code**: Deterministic limits (lengths, hashtags, banned words) are validated in pure Python (`rules.py`), not delegated to the LLM.
- [x] **2. One Prompt per Step**: Generation pipeline steps are split into separate, single-purpose, independently testable prompt templates (`prompts/concepts.py`, `prompts/write_piece.py`, `prompts/judge.py`, `prompts/autofix.py`).
- [x] **3. Runtime Brand Content**: Brand names, banned words, personas, and limits are externalized in `/data/sample.json` and passed dynamically from the frontend state; no values hardcoded in logic.
- [x] **4. Synthetic Data Only**: All sample datasets (SipSense smart travel mug, Daily Commuter, Tech Freelancer, Weekend Adventurer) are 100% fictional.
- [x] **5. Strict Secret Isolation**: API keys reside exclusively in git-ignored `.env`; `.env.example` contains only sanitized placeholders.
- [x] **6. Plain, Inspectable Code**: Simple functions only; LangChain, LangGraph, and other agent orchestration frameworks are strictly excluded.
- [x] **7. Demo-First Resilience**: An offline mock mode (`MOCK_LLM=true`) is implemented in `llm.py` to guarantee 100% demo continuity without API spend or internet dependencies.
- [x] **8. Exhaustive Rule Testing**: Dedicated test suite in `backend/tests/test_rules.py` tests boundary conditions (exact, limit - 1, limit + 1), Unicode/emojis, and banned word variations.
- [x] **9. Continuous Shippability**: Work is structured into small, independently testable, green commits with the core pipeline prioritized.
- [x] **10. Honest Outputs**: Validation failures are surfaced directly with exact broken rule IDs, measured metrics, and thresholds; failures are never silently concealed.

## Project Structure

### Documentation (this feature)

```text
specs/001-campaign-generator/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Phase 0 architectural decisions
├── data-model.md        # Phase 1 Pydantic schema specifications
├── quickstart.md        # Phase 1 runnable verification guide
└── contracts/
    └── api-contracts.json # Phase 1 OpenAPI REST endpoint definitions
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application, CORS middleware, routes
│   ├── config.py            # Environment configuration & Pydantic settings
│   ├── schemas.py           # Pydantic v2 domain, request, and response models
│   ├── llm.py               # OpenAI client, fallback router, mock fixtures, retry helper
│   ├── prompts/             # Isolated single-step prompt templates
│   │   ├── __init__.py
│   │   ├── concepts.py      # Concept generation prompt template
│   │   ├── write_piece.py   # Persona piece writing prompt template
│   │   ├── judge.py         # Brand voice scoring rubric prompt template
│   │   └── autofix.py       # Rule remediation prompt template
│   ├── steps.py             # Step execution functions (generate_concepts, write_piece, judge_piece, autofix_piece)
│   ├── rules.py             # Pure deterministic rule engine (Unicode length, hashtags, banned terms)
│   ├── pipeline.py          # Orchestrator: run_piece() (write -> rules -> judge -> fix -> re-check)
│   └── export.py            # Markdown and JSON export formatters
├── tests/
│   ├── __init__.py
│   ├── test_rules.py        # Boundary tests, Unicode, casing, plurals, hyphens, hashtags
│   ├── test_llm.py          # Primary failure -> fallback tests, invalid JSON retry tests
│   └── test_e2e_mock.py     # Full mock pipeline end-to-end execution tests
└── requirements.txt         # Backend Python dependencies

data/
└── sample.json              # SipSense smart travel mug brand kit and 3 personas (Appendix A)

frontend/
├── src/
│   ├── api/
│   │   └── client.ts        # Typed fetch client for backend endpoints
│   ├── components/
│   │   ├── Stepper.tsx      # 4-step wizard navigation header
│   │   ├── BrandKitForm.tsx # Editable brand kit, channel limits, and tag inputs
│   │   ├── PersonaCard.tsx  # Editable persona card with pain points & warning indicator
│   │   ├── ConceptCard.tsx  # Concept selection card with hook & key message
│   │   ├── PieceCard.tsx    # Asset card with text, score, broken rules, fix badge, regenerate
│   │   └── ExportView.tsx   # Markdown and JSON download buttons
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces matching backend schemas
│   ├── App.tsx              # Root state manager and step coordinator
│   ├── index.css            # Tailwind directives and projector font styling
│   └── main.tsx             # React entry point
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── index.html

.env.example                 # Sanitized environment variable template
.gitignore                   # Strict isolation for .env, .venv, node_modules, build artifacts
README.md                    # Project overview, architecture, and quickstart documentation
```

**Structure Decision**: Web application layout separating `/backend` (FastAPI services and unit tests) and `/frontend` (React + Vite SPA), sharing `/data/sample.json` at repository root.

## Complexity Tracking

*No constitutional violations. All 10 principles strictly upheld.*

| Item | Status | Justification |
| :--- | :---: | :--- |
| **Agent Frameworks** | Omitted | Plain functions chosen over LangChain/LangGraph per Principle VI. |
| **Database** | Omitted | Stateless request architecture with client state preservation per Spec Assumptions. |
| **Dual Provider SDKs** | Consolidated | Standardized on official `openai` SDK for both OpenAI and Gemini per Research Decision 2. |
