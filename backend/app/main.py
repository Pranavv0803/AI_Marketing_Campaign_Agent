import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.schemas import (
    SampleDataResponse,
    ConceptsRequest,
    ConceptsResponse,
    PieceRequest,
    PieceResult,
    ExportRequest,
    ExportResponse,
    HealthResponse,
)
from backend.app.steps import generate_concepts_step
from backend.app.pipeline import run_piece
from backend.app.export import export_campaign_data
from backend.app.llm import check_provider_reachability

app = FastAPI(
    title="AI Marketing Campaign Generator API",
    version="1.0.0",
    description="Stateless marketing campaign generation API with deterministic rule checking, qualitative judging, and dual LLM fallback."
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """Returns provider connectivity and mock mode status with dynamic env reload."""
    settings.reload()
    reachability = await check_provider_reachability()
    return HealthResponse(**reachability)


@app.get("/api/sample", response_model=SampleDataResponse)
def get_sample_data() -> SampleDataResponse:
    """Loads and serves the synthetic SipSense brand kit and personas from data/sample.json."""
    root_dir = Path(__file__).resolve().parent.parent.parent
    sample_file = root_dir / "data" / "sample.json"

    if not sample_file.exists():
        raise HTTPException(status_code=404, detail="Sample data file not found at data/sample.json")

    with open(sample_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    return SampleDataResponse.model_validate(data)


@app.post("/api/concepts", response_model=ConceptsResponse)
async def generate_concepts(request: ConceptsRequest) -> ConceptsResponse:
    """Generates exactly 3 distinct concepts free of banned terms."""
    try:
        return await generate_concepts_step(
            brand_kit=request.brand_kit,
            personas=request.personas,
            mock_mode=request.mock_mode,
        )
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@app.post("/api/piece", response_model=PieceResult)
async def generate_piece(request: PieceRequest) -> PieceResult:
    """
    Executes the full generation and compliance lifecycle for a single persona piece:
    write -> deterministic rules -> judge -> conditional auto-fix -> re-check.
    """
    try:
        # Determine the primary lead pain point for this persona
        lead_pain_point = (
            request.persona.pain_points[0]
            if request.persona.pain_points
            else f"Focus area for {request.persona.name}"
        )

        return await run_piece(
            brand_kit=request.brand_kit,
            persona=request.persona,
            lead_pain_point=lead_pain_point,
            avoid_pain_points=request.avoid_pain_points,
            concept=request.concept,
            channel=request.channel,
            mock_mode=request.mock_mode,
        )
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@app.post("/api/export", response_model=ExportResponse)
def export_campaign(request: ExportRequest) -> ExportResponse:
    """Exports the completed campaign as formatted Markdown or structured JSON."""
    try:
        return export_campaign_data(request.campaign, request.format)
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))
