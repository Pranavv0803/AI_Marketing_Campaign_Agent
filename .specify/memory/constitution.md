<!--
SYNC IMPACT REPORT
==================
Version Change: None (initial template) → 1.0.0
Ratification Date: 2026-11-19
Last Amended: 2026-11-19

Principles Established:
- Principle I: Hard Rules in Code, Soft Judgment in LLM (Initial)
- Principle II: One Prompt per Step (Initial)
- Principle III: Runtime-Configurable Brand Content (Initial)
- Principle IV: Synthetic Data Only (Initial)
- Principle V: Strict Secret Isolation (Initial)
- Principle VI: Plain, Inspectable Code (Initial)
- Principle VII: Demo-First Resilience (Initial)
- Principle VIII: Exhaustive Rule Testing (Initial)
- Principle IX: Continuous Shippability & Scope Discipline (Initial)
- Principle X: Honest and Transparent Outputs (Initial)

Sections Added:
- Architectural & Operational Constraints
- Development Workflow & Quality Gates
- Governance

Templates Requiring Updates:
- .specify/templates/plan-template.md: ✅ Updated Constitution Check gates to map directly to the 10 principles.
- .specify/templates/tasks-template.md: ✅ Updated to mandate deterministic rule tests per Principle VIII.

Follow-up / Deferred Items:
- None.
-->

# AI Marketing Campaign Generator Constitution

## Core Principles

### I. Hard Rules in Code, Soft Judgment in LLM
Anything exactly measurable MUST be checked and enforced by deterministic code.
- Character limits, word counts, hashtag quotas, banned-word lists, and mandatory structural elements MUST be evaluated by deterministic functions, regex, or specialized algorithms.
- The LLM MUST be reserved solely for subjective, qualitative evaluations (e.g., brand voice alignment, emotional resonance, copy creativity, and tone suitability).
- Code MUST NEVER trust an LLM to accurately count characters, words, items, or reliably self-enforce exact numeric bounds.

*Rationale*: LLMs operate over sub-word tokens and inherently struggle with exact character and word arithmetic. Entrusting structural and compliance boundaries to the model creates nondeterministic, brittle outputs. Deterministic validation guarantees 100% boundary compliance.

### II. One Prompt per Step
The campaign generation pipeline MUST consist of separate, single-purpose, independently executable steps.
- Each generation stage (e.g., angle/hook generation, copy drafting, asset prompting, and compliance validation) MUST be executed as an isolated prompt or deterministic operation.
- Monolithic prompts combining multiple generation or review steps into a single call are strictly forbidden.
- Each step MUST produce an inspectable, schema-validated intermediate artifact that feeds the subsequent step.

*Rationale*: Multi-task monolithic prompts dilute model attention, degrade output quality, obstruct fine-grained error attribution, and prevent granular debugging and step-level caching.

### III. Runtime-Configurable Brand Content
All brand definitions and marketing rules MUST be loaded from editable runtime configuration and data sources.
- Brand names, banned terms, audience personas, value propositions, facts, platform length thresholds, and tone descriptors MUST be stored in editable runtime data files (e.g., JSON/YAML) or dynamically passed via user inputs.
- Modifying brand guidelines, adding banned words, or altering target limits MUST NEVER require application code changes, compilation, or service restarts.
- Hardcoding brand-specific copy or limits directly inside source code is strictly prohibited.

*Rationale*: Marketing requirements and compliance rules evolve continuously. Decoupling brand data from application logic allows marketing operators and developers to tune parameters on the fly without touching code.

### IV. Synthetic Data Only
All data utilized for development, automated testing, benchmarking, and demonstrations MUST be entirely synthetic.
- Mock customer personas, audience feedback, employee profiles, and sample performance metrics MUST be fictional and generated or curated specifically for development.
- Real customer PII (Personally Identifiable Information), actual employee records, private internal documents, and real-world company proprietary data MUST NEVER be ingested, processed, or committed to the repository.

*Rationale*: Using exclusively synthetic data completely mitigates legal, privacy, and regulatory liabilities, making the codebase safe for public presentation, hackathon demonstrations, and open evaluation.

### V. Strict Secret Isolation
API keys, credentials, and sensitive tokens MUST NEVER enter the version control repository.
- Model provider API keys and environment secrets MUST be stored exclusively in a local `.env` file that is strictly ignored by version control via `.gitignore`.
- Only a sanitized `.env.example` file containing blank or placeholder values may be committed.
- Automated pre-commit checks or validation scripts MUST fail if any live credential is detected in source trees or committed files.

*Rationale*: Secret leakage leads to security breaches, account compromise, and service cutoffs during development and presentations.

### VI. Plain, Inspectable Code
The codebase MUST favor simple, plain functions and native language constructs over complex agent frameworks.
- Complex orchestration libraries—including LangChain, LangGraph, CrewAI, AutoGen, and similar heavy abstractions—MUST NOT be introduced.
- Pipeline control flow MUST be expressed through explicit, inspectable functions with transparent state passing and standard error handling.

*Rationale*: Complex agent frameworks introduce opaque execution abstractions, brittle dependency graphs, and challenging debugging surfaces. Plain functions provide complete observability, rapid iteration, and maintainability.

### VII. Demo-First Resilience
The application MUST remain demonstration-ready at all times, regardless of external network or API availability.
- The system MUST provide an offline mock mode that simulates all generation steps using deterministic synthetic responses.
- The system MUST maintain a cached, known-good campaign package ready to be surfaced instantly if live APIs face rate limits, network timeouts, or service disruptions.
- A live demonstration MUST NEVER fail due to an unreachable third-party API.

*Rationale*: Live demos and hackathon pitches are subject to unpredictable Wi-Fi quality, rate quotas, and provider downtime. A hardened offline mock mode guarantees uninterrupted presentation.

### VIII. Exhaustive Rule Testing
All deterministic validation and rule-checking logic MUST be rigorously tested with automated unit tests.
- Unit tests MUST explicitly cover boundary conditions (exact limit, limit - 1, limit + 1).
- Unit tests MUST validate multi-byte Unicode strings, emoji counts, whitespace handling, and capitalization variations.
- Unit tests MUST verify banned-word filtering against obfuscation techniques (e.g., punctuation separation, spacing, and case insensitivity).

*Rationale*: A deterministic validation engine is only as good as its test suite. Boundary gaps or Unicode mishandling lead to silent compliance failures in production marketing assets.

### IX. Continuous Shippability & Scope Discipline
The `main` branch of the repository MUST be deployable and runnable at all times.
- Development MUST proceed via small, frequent, and fully functional commits.
- If hackathon deadlines or technical constraints compress available time, project scope MUST be reduced by pruning secondary features rather than compromising the quality, test coverage, or stability of the core campaign generation flow.

*Rationale*: A functional, reliable core flow with a polished demo always outperforms an ambitious but broken, half-implemented feature set.

### X. Honest and Transparent Outputs
The application MUST transparently communicate validation outcomes and never conceal rule failures.
- If an automatic correction or regeneration step fails to satisfy a deterministic rule, the output artifact MUST be explicitly flagged as failed.
- The failure output MUST state the exact violated rule, the measured value, and the expected threshold.
- The system MUST NEVER silently discard errors, fabricate compliance badges, or present failing content as passing.

*Rationale*: Marketing compliance requires unwavering trustworthiness. Transparent feedback empowers human reviewers to make informed editorial decisions rather than deploying non-compliant copy.

## Architectural & Operational Constraints

- **Execution Model**: The application core runs as lightweight, modular Python or TypeScript services utilizing standard library primitives and explicit schemas.
- **Pipeline Interface**: Each pipeline step consumes a strictly typed input contract and produces a validated output contract.
- **Secret Management**: Runtime configuration loads secrets from system environment variables or local `.env` files. Missing credentials in live mode MUST prompt a clear error indicating the missing variable and suggesting fallback to offline mock mode.
- **Fallback Architecture**: An explicit runtime flag (e.g., `--mock` or `MOCK_MODE=true`) MUST switch the entire pipeline to offline mode without changing code or logic flow.

## Development Workflow & Quality Gates

1. **Gate 1: Rule Engine Integrity**: All deterministic validation rules must pass 100% of unit tests covering boundary values, Unicode, and banned words before integration.
2. **Gate 2: Pipeline Modularity**: Every prompt addition must be isolated in its own function/module with clear input/output schemas.
3. **Gate 3: Secret Hygiene**: Pre-commit reviews MUST verify that `.env` is uncommitted and `.gitignore` remains active.
4. **Gate 4: Offline Verification**: Every pipeline increment MUST be validated in offline mock mode to ensure demo continuity.
5. **Gate 5: Visibility of Failures**: Failure paths must have integration tests proving that failing rules surface exact diagnostics in the UI or CLI output.

## Governance

- **Supremacy**: This Constitution supersedes all informal agreements, rapid prototyping shortcuts, or divergent documentation. All specifications (`spec.md`), implementation plans (`plan.md`), and task lists (`tasks.md`) MUST conform to these principles.
- **Compliance Audits**: Every feature plan generated via `/speckit-plan` MUST include an active Constitution Check verifying that all architectural gates are satisfied.
- **Amendment Procedure**: Amendments to this Constitution require:
  1. A formal proposal articulating the rationale and impact.
  2. A Semantic Version increment:
     - **MAJOR**: Altering, removing, or weakening any Core Principle.
     - **MINOR**: Adding new principles or operational constraints.
     - **PATCH**: Non-semantic clarifications, typographical corrections, or formatting updates.
  3. Synchronization of all downstream templates (`plan-template.md`, `tasks-template.md`, etc.).

**Version**: 1.0.0 | **Ratified**: 2026-11-19 | **Last Amended**: 2026-11-19
