# Technical Research & Architecture Decisions: AI Marketing Campaign Generator

**Feature**: `001-campaign-generator`
**Date**: 2026-11-19
**Status**: Completed

## 1. Backend Framework & Stateless Architecture

### Decision
Use **Python 3.11+**, **FastAPI**, **Pydantic v2**, and **Uvicorn** with pure functional orchestration. No agent frameworks (LangChain, LangGraph, CrewAI) are permitted.

### Rationale
- **Inspectability & Debuggability**: Plain Python functions with explicit parameters provide 100% transparency, making rule enforcement, prompt construction, and step execution straightforward to trace and debug.
- **Strict Data Validation**: Pydantic v2 offers high-performance validation and serialization, guaranteeing schema integrity for LLM responses and client payloads.
- **Stateless Backend**: The server retains zero session state or database dependencies. The complete context (brand kit, personas, concept) is passed in each API request, ensuring resilience against server restarts during demos and enabling horizontal scale without session affinity.

### Alternatives Considered
- *LangChain / LangGraph*: Rejected per Constitution Principle VI (Plain, inspectable code). Heavy abstraction layers introduce brittle dependencies, hidden prompt mutations, and difficult debugging loops.
- *Flask / Django*: Rejected. FastAPI provides native asynchronous request handling, auto-generated OpenAPI documentation, and native Pydantic v2 integration with lower latency.

---

## 2. LLM Provider Integration & Fallback Routing

### Decision
Standardize on the official **OpenAI Python SDK (`openai>=1.0.0`)** for both primary and fallback providers:
- **Primary Provider**: OpenAI API using a fast, non-reasoning model (e.g., `gpt-4o-mini`).
- **Fallback Provider**: Google Gemini via its OpenAI-compatible endpoint (`https://generativelanguage.googleapis.com/v1beta/openai/`) using a Gemini Flash model (e.g., `gemini-1.5-flash` or `gemini-2.0-flash` with low/no reasoning effort).
- **Judge Step**: Same dual-provider chain configured with `JUDGE_MODEL` and low temperature (`0.1` or model minimum).

### Rationale
- **Uniform Client Code**: The official `openai` SDK seamlessly targets Gemini's OpenAI-compatible endpoint simply by switching `base_url` and `api_key`. This avoids dual-SDK dependencies (`google-generativeai` vs `openai`) and eliminates vendor-specific abstraction drift.
- **Targeted Fallback Criteria**: Fallback triggers exclusively on availability issues: HTTP 429 (rate limits after backoff), HTTP 5xx (server errors), connection timeouts (30s threshold), authentication failures, or quota exhaustion. Ordinary invalid JSON triggers a single retry on the *same* provider first before switching.
- **Auditability**: Every generated piece includes a `provider` metadata tag indicating whether OpenAI or Gemini produced the output.

### Alternatives Considered
- *Native Google GenAI SDK alongside OpenAI SDK*: Rejected to avoid maintaining two distinct client interfaces, error models, and payload structures.
- *LiteLLM proxy / router*: Rejected per Principle VI to avoid external proxy dependencies. A small ~80-line hand-written wrapper achieves dual-provider fallback cleanly.

---

## 3. Concurrency, Retries, and Resilience

### Decision
Implement an asynchronous execution pipeline using `asyncio.gather` constrained by an `asyncio.Semaphore(MAX_CONCURRENCY)` (defaulting to 3), coupled with a lightweight exponential backoff retry helper.

### Rationale
- **Rate Limit Protection**: Generating 6 pieces in parallel (3 personas × 2 channels) can quickly trigger 429 rate limits on fresh API accounts. Limiting active parallel outbound LLM requests to 3 prevents burst throttling while maintaining low wall-clock completion times (~5-8 seconds total).
- **Graceful Retries**: Retries with jitter backoff (1s, 2s, 4s) resolve transient network hiccups or temporary 429s.
- **Mock Mode (`MOCK_LLM=true`)**: Complete bypass of network requests returning instant, schema-valid canned results. Allows full offline development, deterministic testing, and failure-proof conference/hackathon demos.

### Alternatives Considered
- *Celery / Background Workers*: Rejected as over-engineered for a stateless, sub-5-minute interactive user flow.
- *Unconstrained parallelism*: Rejected because burst concurrency immediately exhausts tier-1 rate limits on free or low-tier API keys.

---

## 4. Deterministic Rule Checking Engine

### Decision
Implement a pure Python deterministic validation module (`rules.py`) executed independently of the LLM.
- **Unicode Normalization**: All text is normalized using `unicodedata.normalize('NFC', text)` prior to counting.
- **Character Limits**: Exact Unicode codepoint count; hashtags are joined to social post text and count against post limits.
- **Word Counts**: Whitespace-delimited word counts on normalized text.
- **Banned Words & Phrases**:
  - Normalize text (lowercase, convert curly quotes `’‘“”` to straight `'"`, collapse hyphens and redundant whitespace).
  - Single words: Regular expressions using word boundaries (`\b`) supporting common inflection suffixes: `\b<word>(s|es|ed|ing|ly)?\b`.
  - Phrases: Flexible matching matching whitespace, hyphens, and punctuation between phrase terms (e.g., matching "game-changer", "game changer", and "Game-Changing").
  - Evaluates subject, body, and hashtag tokens (with `#` stripped).
  - Returns exact matched offending substring and rule ID. Zero false positives inside unrelated longer words.

### Rationale
- Fully aligns with Constitution Principle I (Hard rules in code, soft judgment in LLM) and Principle VIII (Exhaustive rule testing).
- Guaranteed exactness that does not depend on model tokenization idiosyncrasies.

### Alternatives Considered
- *LLM self-validation or regex within prompts*: Rejected. LLMs cannot reliably enforce character boundaries or detect subtle banned variations.

---

## 5. Frontend Architecture & Stepper Flow

### Decision
Single-Page Application built with **React**, **Vite**, and **Tailwind CSS**, organized around a 4-step linear wizard:
1. **Setup**: Brand kit parameters (tag inputs for banned terms, example lines, features; number inputs for limits), 3 persona cards, and "Load Sample Data" action. Validates collision if two personas share a primary pain point.
2. **Concepts**: Request 3 concepts, display as comparative selection cards, allow user selection.
3. **Campaign**: 3-column side-by-side view (one column per persona). Each column contains a Social Post card and an Email card with score, reason, broken rules, "Fixed automatically" badge, and individual "Regenerate" buttons. A top-level "Regenerate All" button re-triggers all 6 pieces using current state.
4. **Export**: Instant client-side download of campaign assets in Markdown and JSON formats.

### Rationale
- Clear, visual step-by-step progress matching user expectations.
- Projector-optimized typography (high contrast, clean cards, clear badges) ensures high legibility during hackathon presentations.
- State held in React Context or local state allows the user to navigate back to Setup, tweak a rule or persona, and advance without state loss.
