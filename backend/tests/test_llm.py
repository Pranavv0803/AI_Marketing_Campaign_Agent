import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from pydantic import BaseModel
from openai import RateLimitError
from backend.app.config import settings
from backend.app.schemas import ConceptsLLMOutput, PostOutput, EmailOutput, JudgeResult
from backend.app.llm import (
    strip_code_fences,
    generate_mock_response,
    complete_structured,
    check_provider_reachability,
)


class DummySchema(BaseModel):
    message: str


def test_strip_code_fences():
    # Plain text
    assert strip_code_fences('{"test": 1}') == '{"test": 1}'
    # ```json code fence
    assert strip_code_fences('```json\n{"test": 1}\n```') == '{"test": 1}'
    # ``` raw code fence
    assert strip_code_fences('```\n{"test": 1}\n```') == '{"test": 1}'
    # Whitespace surrounding
    assert strip_code_fences('  ```json\n{"test": 1}\n```  ') == '{"test": 1}'


def test_generate_mock_response():
    # Concepts
    concepts = generate_mock_response(ConceptsLLMOutput, "", "")
    assert len(concepts.concepts) == 3
    assert concepts.concepts[0].name
    assert concepts.concepts[0].key_message
    assert concepts.concepts[0].hook

    # Post
    post = generate_mock_response(PostOutput, "", "persona: commuter")
    assert post.body
    assert len(post.hashtags) >= 1

    # Email
    email = generate_mock_response(EmailOutput, "", "persona: commuter")
    assert email.subject
    assert email.body

    # Judge
    judge = generate_mock_response(JudgeResult, "", "")
    assert judge.score >= 4
    assert judge.reason


@pytest.mark.asyncio
async def test_complete_structured_in_mock_mode():
    with patch.object(settings, "MOCK_LLM", True):
        result, provider = await complete_structured(
            system_prompt="Test system",
            user_prompt="Test user for commuter",
            schema_cls=PostOutput,
        )
        assert provider == "mock"
        assert isinstance(result, PostOutput)
        assert len(result.body) > 10


@pytest.mark.asyncio
async def test_check_provider_reachability_mock():
    with patch.object(settings, "MOCK_LLM", True):
        health = await check_provider_reachability()
        assert health["status"] == "ok"
        assert health["mock_mode"] is True
        assert health["primary_reachable"] is True
        assert health["fallback_reachable"] is True
