import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.main import app
from backend.app.schemas import Campaign, PieceResult


@pytest.mark.asyncio
async def test_full_pipeline_mock_mode():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        health_resp = await client.get("/api/health")
        assert health_resp.status_code == 200
        health = health_resp.json()
        assert health["status"] in ("ok", "error", "degraded")

        # 2. Sample data load
        sample_resp = await client.get("/api/sample")
        assert sample_resp.status_code == 200
        sample_data = sample_resp.json()
        brand_kit = sample_data["brand_kit"]
        personas = sample_data["personas"]
        assert len(personas) == 3

        # 3. Generate concepts in mock mode
        concepts_resp = await client.post("/api/concepts", json={
            "brand_kit": brand_kit,
            "personas": personas,
            "mock_mode": True,
        })
        assert concepts_resp.status_code == 200
        concepts = concepts_resp.json()["concepts"]
        assert len(concepts) == 3
        selected_concept = concepts[0]

        # 4. Generate pieces (1 post + 1 email for persona 0)
        p0 = personas[0]
        avoids = [personas[1]["pain_points"][0], personas[2]["pain_points"][0]]

        post_resp = await client.post("/api/piece", json={
            "brand_kit": brand_kit,
            "persona": p0,
            "avoid_pain_points": avoids,
            "concept": selected_concept,
            "channel": "post",
            "mock_mode": True,
        })
        assert post_resp.status_code == 200
        post_data = post_resp.json()
        assert post_data["provider"] == "mock"
        assert post_data["status"] in ("pass", "fixed")
        assert post_data["channel"] == "post"

        email_resp = await client.post("/api/piece", json={
            "brand_kit": brand_kit,
            "persona": p0,
            "avoid_pain_points": avoids,
            "concept": selected_concept,
            "channel": "email",
            "mock_mode": True,
        })
        assert email_resp.status_code == 200
        email_data = email_resp.json()
        assert email_data["provider"] == "mock"
        assert email_data["status"] in ("pass", "fixed")
        assert email_data["channel"] == "email"

        # 5. Export campaign (Markdown and JSON)
        # Construct mock campaign with 6 pieces
        dummy_pieces = []
        for p in personas:
            dummy_pieces.append(PieceResult.model_validate(post_data).model_copy(update={"persona_id": p["id"]}))
            dummy_pieces.append(PieceResult.model_validate(email_data).model_copy(update={"persona_id": p["id"]}))

        campaign_dict = {
            "brand_kit": brand_kit,
            "personas": personas,
            "concept": selected_concept,
            "pieces": [dp.model_dump() for dp in dummy_pieces],
        }

        # Export MD
        md_resp = await client.post("/api/export", json={
            "campaign": campaign_dict,
            "format": "markdown",
        })
        assert md_resp.status_code == 200
        md_data = md_resp.json()
        assert md_data["filename"].endswith(".md")
        assert len(md_data["content"]) > 100

        # Export JSON
        json_resp = await client.post("/api/export", json={
            "campaign": campaign_dict,
            "format": "json",
        })
        assert json_resp.status_code == 200
        json_data = json_resp.json()
        assert json_data["filename"].endswith(".json")
        assert len(json_data["content"]) > 100
