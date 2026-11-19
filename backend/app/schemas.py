from typing import Literal
from pydantic import BaseModel, Field


# ==========================================
# 1. Domain & Configuration Entities
# ==========================================

class PostRules(BaseModel):
    max_chars: int = Field(default=280, ge=10, description="Maximum characters allowed in a social post, including hashtags")
    hashtags_min: int = Field(default=1, ge=0, description="Minimum number of hashtags required")
    hashtags_max: int = Field(default=3, ge=0, description="Maximum number of hashtags allowed")


class EmailRules(BaseModel):
    subject_max_chars: int = Field(default=60, ge=5, description="Maximum characters allowed in email subject line")
    body_min_words: int = Field(default=75, ge=1, description="Minimum words required in email body")
    body_max_words: int = Field(default=150, ge=10, description="Maximum words allowed in email body")


class ChannelRules(BaseModel):
    post: PostRules = Field(default_factory=PostRules)
    email: EmailRules = Field(default_factory=EmailRules)


class BrandKit(BaseModel):
    brand_name: str = Field(..., min_length=1, description="Brand name (e.g., 'SipSense')")
    product_name: str = Field(..., min_length=1, description="Product name (e.g., 'ThermoPulse Smart Mug')")
    tagline: str = Field(..., min_length=1, description="Short brand slogan")
    voice_adjectives: list[str] = Field(..., min_length=1, description="List of tone descriptors")
    voice_summary: str = Field(..., min_length=1, description="One-line narrative voice summary")
    example_lines: list[str] = Field(default_factory=list, description="Curated sample on-brand lines")
    product_features: list[str] = Field(..., min_length=1, description="Exhaustive list of true, verified product claims")
    banned_terms: list[str] = Field(default_factory=list, description="Terms and phrases forbidden across all marketing copy")
    channel_rules: ChannelRules = Field(default_factory=ChannelRules)


class Persona(BaseModel):
    id: str = Field(..., description="Unique persona identifier (e.g., 'commuter')")
    name: str = Field(..., min_length=1, description="Descriptive persona name")
    role: str = Field(..., min_length=1, description="Professional or lifestyle role")
    pain_points: list[str] = Field(..., min_length=1, description="Ordered list of specific user pain points")
    motivations: list[str] = Field(..., min_length=1, description="Key buying motivations and priorities")
    preferred_tone: str = Field(..., min_length=1, description="Persona-specific communication style")


# ==========================================
# 2. LLM Step Input / Output Schemas
# ==========================================

class Concept(BaseModel):
    name: str = Field(..., min_length=1, description="Concise creative title for the campaign concept")
    key_message: str = Field(..., min_length=1, description="Core marketing message of the concept")
    hook: str = Field(..., min_length=1, description="Attention-grabbing headline or opening hook")


class ConceptsLLMOutput(BaseModel):
    concepts: list[Concept] = Field(..., min_length=3, max_length=3, description="Exactly 3 distinct creative concepts")


class PostOutput(BaseModel):
    body: str = Field(..., min_length=1, description="Main social post body copy, excluding joined hashtags")
    hashtags: list[str] = Field(default_factory=list, description="List of individual hashtags without '#' prefix")


class EmailOutput(BaseModel):
    subject: str = Field(..., min_length=1, description="Email subject line")
    body: str = Field(..., min_length=1, description="Full marketing email body copy")


class JudgeResult(BaseModel):
    reason: str = Field(..., min_length=1, description="Qualitative critique ordered strictly before score")
    score: int = Field(..., ge=1, le=5, description="Brand alignment score (1 to 5)")


# ==========================================
# 3. Evaluation & Verification Entities
# ==========================================

class RuleResult(BaseModel):
    rule_id: str = Field(..., description="Machine-readable rule identifier")
    passed: bool = Field(..., description="True if rule passed, False if violated")
    detail: str = Field(..., description="Human-readable explanation of the check and boundary thresholds")
    matched_text: str | None = Field(default=None, description="Exact substring triggering the violation")


class PieceResult(BaseModel):
    persona_id: str = Field(..., description="Target persona identifier")
    channel: Literal["post", "email"] = Field(..., description="Target marketing channel")
    assembled_text: str = Field(..., description="Final combined output text")
    rule_results: list[RuleResult] = Field(default_factory=list, description="Itemized list of deterministic rule checks")
    judge: JudgeResult = Field(..., description="Qualitative brand-fit score and reason")
    status: Literal["pass", "fixed", "failing"] = Field(..., description="'pass', 'fixed', or 'failing'")
    provider: str = Field(..., description="Provider that produced the piece ('openai', 'fallback:gemini', 'mock')")


# ==========================================
# 4. API Request & Response Contracts
# ==========================================

class SampleDataResponse(BaseModel):
    brand_kit: BrandKit
    personas: list[Persona] = Field(..., min_length=1, max_length=6)


class ConceptsRequest(BaseModel):
    brand_kit: BrandKit
    personas: list[Persona] = Field(..., min_length=1, max_length=6)
    mock_mode: bool | None = Field(default=None, description="Explicitly force mock or live OpenAI mode")


class ConceptsResponse(BaseModel):
    concepts: list[Concept] = Field(..., min_length=1, max_length=5)


class PieceRequest(BaseModel):
    brand_kit: BrandKit
    persona: Persona
    avoid_pain_points: list[str] = Field(default_factory=list, description="Leading pain points used by others")
    concept: Concept
    channel: Literal["post", "email"]
    mode: Literal["write", "fix"] = Field(default="write")
    original_piece: str | None = Field(default=None)
    failures: list[RuleResult] | None = Field(default=None)
    mock_mode: bool | None = Field(default=None, description="Explicitly force mock or live OpenAI mode")


class Campaign(BaseModel):
    brand_kit: BrandKit
    personas: list[Persona]
    concept: Concept
    pieces: list[PieceResult] = Field(..., description="Collection of all 6 generated pieces")


class ExportRequest(BaseModel):
    campaign: Campaign
    format: Literal["markdown", "json"]


class ExportResponse(BaseModel):
    filename: str
    content: str
    mime_type: str


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded", "error"]
    primary_provider: str
    primary_reachable: bool
    fallback_provider: str
    fallback_reachable: bool
    mock_mode: bool
