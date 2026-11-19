# Quickstart & Verification Guide: AI Marketing Campaign Generator

**Feature**: `001-campaign-generator`
**Date**: 2026-11-19
**Status**: Ready for Implementation

This guide provides end-to-end setup, execution, and verification workflows for the application.

---

## 1. Prerequisites & Environment Setup

### System Requirements
- **Python**: 3.11 or higher
- **Node.js**: 18.x or higher
- **Package Managers**: `pip` (Python) and `npm` or `pnpm` (Node.js)

### Environment Configuration
1. Create a local `.env` file from `.env.example` in the project root:
   ```bash
   cp .env.example .env
   ```
2. Fill in the required environment variables (keep `.env` git-ignored):
   ```env
   # Primary Provider (OpenAI)
   OPENAI_API_KEY="sk-..."
   WRITER_MODEL="gpt-4o-mini"
   JUDGE_MODEL="gpt-4o-mini"

   # Fallback Provider (Google Gemini OpenAI-compatible)
   FALLBACK_API_KEY="AIzaSy..."
   FALLBACK_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai/"
   FALLBACK_MODEL="gemini-1.5-flash"

   # Operational Settings
   MOCK_LLM="false"
   MAX_CONCURRENCY="3"
   ALLOWED_ORIGINS="http://localhost:5173"
   ```

---

## 2. Installation & Running

### Backend (FastAPI)
```bash
# In repository root:
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

# Start backend server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (React + Vite)
```bash
# In frontend directory:
cd frontend
npm install
npm run dev
# Accessible at http://localhost:5173
```

### Zero-API Mock Mode (Recommended for Demos & Offline Dev)
Set `MOCK_LLM=true` in `.env` (or pass as an environment flag):
```bash
MOCK_LLM=true uvicorn backend.app.main:app --port 8000 --reload
```
In mock mode, all LLM calls return instantaneous, schema-compliant synthetic mock responses, allowing 100% functionality without external API spend or network connectivity.

---

## 3. Automated Test Execution

Run the complete test suite using `pytest`:
```bash
# Run all backend unit & integration tests
pytest backend/tests/ -v

# Run rule engine boundary & Unicode tests specifically
pytest backend/tests/test_rules.py -v

# Run LLM wrapper & fallback routing tests
pytest backend/tests/test_llm.py -v

# Run end-to-end mock pipeline test
pytest backend/tests/test_e2e_mock.py -v
```

---

## 4. End-to-End Verification Scenarios

### Scenario 1: Load Brand Kit & Edit In Real-Time
1. Open the UI at `http://localhost:5173`.
2. Click **"Load Sample Data"**.
3. Verify that the "SipSense" brand kit, channel boundaries, and 3 personas (Daily Commuter, Tech Freelancer, Weekend Adventurer) are populated.
4. Add a custom banned term (e.g., `"cheap"`) into the Banned Terms tag list.
5. Click **"Next: Concepts"**.

### Scenario 2: Generate & Select Concept
1. Click **"Generate Concepts"**.
2. Verify that exactly 3 distinct concepts appear, each with a Name, Key Message, and Hook.
3. Confirm that no banned terms appear in any concept.
4. Click **"Pick this Concept"** on Concept 1 to advance to the Campaign phase.

### Scenario 3: Persona Asset Generation & Pain Point Differentiation
1. The app automatically dispatches 6 parallel `/api/piece` calls (bounded by `MAX_CONCURRENCY=3`).
2. Verify that 3 columns render side by side.
3. Verify that the three personas lead with three distinct pain points:
   - **Daily Commuter**: Leads with lukewarm coffee in rush hour traffic.
   - **Tech Freelancer**: Leads with cold drinks during long programming sprints.
   - **Weekend Adventurer**: Leads with heat loss and spills on rugged trails.
4. Each column must display exactly 1 Social Post and 1 Email card.

### Scenario 4: Deterministic Brand Checks & Automatic Remediation
1. Inspect each card's **Brand Check** section:
   - Displays brand-fit score (1–5) and qualitative rationale.
   - Displays itemized deterministic check results (character length, hashtag count, word count, banned words).
2. If an asset originally contained a banned word or breached length limits, verify:
   - A single automatic fix attempt was executed.
   - If resolved, the card displays a **"Fixed automatically"** badge with passing rules.
   - If unresolvable, the card is styled as failing, with the exact violated rule and measured value explicitly visible.

### Scenario 5: Single vs. Full Campaign Regeneration
1. Click **"Regenerate"** on Persona 1's Social Post card. Verify that only that card shows a loading state and updates, leaving all other 5 pieces unchanged.
2. Navigate back to **Setup**, edit the Tagline or tighten the Post Character Limit to 200, return to **Campaign**, and click **"Regenerate All"**.
3. Verify that all 6 pieces re-run and re-evaluate under the new 200-character limit.

### Scenario 6: Campaign Export
1. Advance to **Export** step.
2. Click **"Export as Markdown"** → Verify download of `sipsense-campaign.md` containing full brand kit, personas, concept, copy, and audit results.
3. Click **"Export as JSON"** → Verify download of `sipsense-campaign.json` containing complete structured payload.
