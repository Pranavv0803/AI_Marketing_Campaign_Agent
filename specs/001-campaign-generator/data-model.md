# Data Models & Schemas: AI Marketing Campaign Generator

**Feature**: `001-campaign-generator`
**Date**: 2026-11-19
**Target Module**: `/backend/app/schemas.py`

This document defines all Pydantic v2 schemas for the application's domain entities, API requests/responses, and LLM output structures.

## 1. Domain & Configuration Entities

### 1.1 Channel Rules
```python
class PostRules(BaseModel):
    max_chars: int = Field(default=280, ge=10, description="Maximum characters allowed in a social post, including hashtags")
    hashtags_min: int = Field(default=1, ge=0, description="Minimum number of hashtags required")
    hashtags_max: int = Field(default=3, ge=1, description="Maximum number of hashtags allowed")

class EmailRules(BaseModel):
    subject_max_chars: int = Field(default=60, ge=5, description="Maximum characters allowed in email subject line")
    body_min_words: int = Field(default=75, ge=1, description="Minimum words required in email body")
    body_max_words: int = Field(default=150, ge=10, description="Maximum words allowed in email body")

class ChannelRules(BaseModel):
    post: PostRules = Field(default_factory=PostRules)
    email: EmailRules = Field(default_factory=EmailRules)
```

### 1.2 Brand Kit
```python
class BrandKit(BaseModel):
    brand_name: str = Field(..., min_length=1, description="Brand name (e.g., 'SipSense')")
    product_name: str = Field(..., min_length=1, description="Product name (e.g., 'ThermoPulse Smart Mug')")
    tagline: str = Field(..., min_length=1, description="Short brand slogan")
    voice_adjectives: list[str] = Field(..., min_length=1, description="List of tone descriptors (e.g., ['precise', 'warm'])")
    voice_summary: str = Field(..., min_length=1, description="One-line narrative voice summary")
    example_lines: list[str] = Field(default_factory=list, description="Curated sample on-brand lines")
    product_features: list[str] = Field(..., min_length=1, description="Exhaustive list of true, verified product claims")
    banned_terms: list[str] = Field(default_factory=list, description="Terms and phrases forbidden across all marketing copy")
    channel_rules: ChannelRules = Field(default_factory=ChannelRules)
```

### 1.3 Persona
```python
class Persona(BaseModel):
    id: str = Field(..., description="Unique persona identifier (e.g., 'commuter', 'tech_worker', 'adventurer')")
    name: str = Field(..., min_length=1, description="Descriptive persona name (e.g., 'Daily Commuter')")
    role: str = Field(..., min_length=1, description="Professional or lifestyle role")
    pain_points: list[str] = Field(..., min_length=1, description="Ordered list of specific user pain points")
    motivations: list[str] = Field(..., min_length=1, description="Key buying motivations and priorities")
    preferred_tone: str = Field(..., min_length=1, description="Persona-specific communication style")
```

---

## 2. LLM Step Input / Output Schemas

### 2.1 Campaign Concepts
```python
class Concept(BaseModel):
    name: str = Field(..., min_length=1, description="Concise creative title for the campaign concept")
    key_message: str = Field(..., min_length=1, description="Core marketing message of the concept")
    hook: str = Field(..., min_length=1, description="Attention-grabbing headline or opening hook")

class ConceptsLLMOutput(BaseModel):
    concepts: list[Concept] = Field(..., min_length=3, max_length=3, description="Exactly 3 distinct creative concepts")
```

### 2.2 Piece Generation Outputs
```python
class PostOutput(BaseModel):
    body: str = Field(..., min_length=1, description="Main social post body copy, excluding joined hashtags")
    hashtags: list[str] = Field(default_factory=list, description="List of individual hashtags without '#' prefix")

class EmailOutput(BaseModel):
    subject: str = Field(..., min_length=1, description="Email subject line")
    body: str = Field(..., min_length=1, description="Full marketing email body copy")
```

### 2.3 Judge Evaluation Output
```python
class JudgeResult(BaseModel):
    reason: str = Field(..., min_length=1, description="Qualitative critique ordered strictly before score to enforce chain-of-thought justification")
    score: int = Field(..., ge=1, le=5, description="Brand alignment score (1=Off-brand, 2=Noticeably off, 3=Generic, 4=On-brand, 5=Unmistakable)")
```

---

## 3. Evaluation & Verification Entities

### 3.1 Rule Result
```python
class RuleResult(BaseModel):
    rule_id: str = Field(..., description="Machine-readable rule identifier (e.g., 'banned_term', 'max_chars', 'hashtag_count', 'word_count')")
    passed: bool = Field(..., description="True if rule passed, False if violated")
    detail: str = Field(..., description="Human-readable explanation of the check and boundary thresholds")
    matched_text: str | None = Field(default=None, description="Exact substring triggering the violation (e.g., the matched banned word)")
```

### 3.2 Piece Result
```python
class PieceResult(BaseModel):
    persona_id: str = Field(..., description="Target persona identifier")
    channel: Literal["post", "email"] = Field(..., description="Target marketing channel")
    assembled_text: str = Field(..., description="Final combined output text (for social: body + hashtags; for email: subject + body)")
    rule_results: list[RuleResult] = Field(..., description="Complete itemized list of all deterministic rule checks")
    judge: JudgeResult = Field(..., description="Qualitative brand-fit score and reason")
    status: Literal["pass", "fixed", "failing"] = Field(..., description="pass: clean on first try; fixed: resolved after 1 auto-fix; failing: broken rules or score <= 2 after fix attempt")
    provider: str = Field(..., description="Name of the provider that produced the piece (e.g., 'openai', 'fallback:gemini', 'mock')")
```

---

## 4. API Request & Response Contracts

### 4.1 Sample Data
```python
class SampleDataResponse(BaseModel):
    brand_kit: BrandKit
    personas: list[Persona] = Field(..., min_length=3, max_length=3)
```

### 4.2 Concept Generation
```python
class ConceptsRequest(BaseModel):
    brand_kit: BrandKit
    personas: list[Persona] = Field(..., min_length=3, max_length=3)

class ConceptsResponse(BaseModel):
    concepts: list[Concept] = Field(..., min_length=3, max_length=3)
```

### 4.3 Piece Generation & Remediation
```python
class PieceRequest(BaseModel):
    brand_kit: BrandKit
    persona: Persona
    avoid_pain_points: list[str] = Field(default_factory=list, description="Leading pain points used by other personas that must be avoided")
    concept: Concept
    channel: Literal["post", "email"]
    mode: Literal["write", "fix"] = Field(default="write", description="'write' for initial generation; 'fix' for targeted auto-fix")
    original_piece: str | None = Field(default=None, description="Original copy text if running in fix mode")
    failures: list[RuleResult] | None = Field(default=None, description="List of failed rules from previous run if running in fix mode")
```

### 4.4 Campaign Export
```python
class Campaign(BaseModel):
    brand_kit: BrandKit
    personas: list[Persona]
    concept: Concept
    pieces: list[PieceResult] = Field(..., description="Collection of all 6 generated pieces (3 personas x 2 channels)")

class ExportRequest(BaseModel):
    campaign: Campaign
    format: Literal["markdown", "json"]

class ExportResponse(BaseModel):
    filename: str
    content: str
    mime_type: str
```

### 4.5 Health & Readiness
```python
class HealthResponse(BaseModel):
    status: Literal["ok", "degraded", "error"]
    primary_provider: str
    primary_reachable: bool
    fallback_provider: str
    fallback_reachable: bool
    mock_mode: bool
```
