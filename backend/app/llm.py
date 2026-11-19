import re
import json
import asyncio
from typing import Type, TypeVar, Any, Literal
from pydantic import BaseModel, ValidationError
from openai import AsyncOpenAI, APIError, APITimeoutError, RateLimitError, AuthenticationError
from backend.app.config import settings
from backend.app.schemas import (
    ConceptsLLMOutput,
    Concept,
    PostOutput,
    EmailOutput,
    JudgeResult,
)

T = TypeVar("T", bound=BaseModel)

# Global concurrency limiter across all provider calls
_semaphore: asyncio.Semaphore | None = None
_client: AsyncOpenAI | None = None


def get_semaphore() -> asyncio.Semaphore:
    """Returns a process-wide semaphore bounded to the current event loop."""
    global _semaphore
    if _semaphore is None:
        _semaphore = asyncio.Semaphore(settings.MAX_CONCURRENCY)
    return _semaphore


def get_openai_client() -> AsyncOpenAI:
    """Returns a reused AsyncOpenAI client instance for connection pooling."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY or "dummy-key",
            timeout=30.0,
            max_retries=2,
        )
    return _client


def strip_code_fences(content: str) -> str:
    """Removes markdown code fences like ```json ... ``` or ``` ... ```"""
    content = content.strip()
    match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return content


# ============================================================================
# Canned Mock Generator (Mock Mode / Offline Demo)
# ============================================================================

def generate_mock_response(schema_cls: Type[T], system_prompt: str, user_prompt: str) -> T:
    """Produces schema-valid, deterministic mock responses for each pipeline step."""
    if schema_cls == ConceptsLLMOutput:
        return ConceptsLLMOutput(
            concepts=[
                Concept(
                    name="Peak Precision",
                    key_message="Precision temperature control engineered for demanding workdays and morning commutes.",
                    hook="Stop settling for lukewarm coffee halfway through your day."
                ),
                Concept(
                    name="All-Day Warmth",
                    key_message="A 12-hour thermal battery that keeps your signature brew piping hot from dawn to desk.",
                    hook="Your morning roast stays at 135 degrees until your last sip."
                ),
                Concept(
                    name="Trail to Table",
                    key_message="Rugged, spill-free magnetic lid protection designed for city transit and weekend peaks.",
                    hook="Engineered to never leak a drop inside your backpack."
                )
            ]
        )  # type: ignore

    if schema_cls == PostOutput:
        if "commuter" in user_prompt.lower():
            body = "Tired of coffee turning lukewarm in 45-minute stop-and-go morning traffic? The ThermoPulse Smart Mug keeps your brew at the exact temperature you dialed in—zero leaks, pure ceramic taste, and 12 hours of reliable warmth."
        elif "adventurer" in user_prompt.lower():
            body = "From mountain trails to cold mornings, fragile mugs that dent and spill shouldn't ruin your hike. ThermoPulse delivers 12 hours of precision warmth with a 360 magnetic leak-proof lid."
        else:
            body = "Say goodbye to forgotten stone-cold coffee during deep work sprints. ThermoPulse maintains your ideal drinking temperature at your desk without microwave trips."

        # Dynamically determine hashtag count matching the user's selection in prompt
        tag_pool = ["SmartTravelMug", "PerfectSip", "CoffeeTech", "ThermalPulse", "HotCoffeeAlways", "TravelGear", "DailyCommute"]
        target_tags = 2
        exact_m = re.search(r"EXACTLY\s+(\d+)", user_prompt, re.IGNORECASE)
        range_m = re.search(r"Between\s+(\d+)\s+and\s+(\d+)", user_prompt, re.IGNORECASE)
        if exact_m:
            target_tags = int(exact_m.group(1))
        elif range_m:
            min_c, max_c = int(range_m.group(1)), int(range_m.group(2))
            target_tags = min(max_c, max(min_c, 1))

        target_tags = max(0, min(target_tags, len(tag_pool)))
        return PostOutput(
            body=body,
            hashtags=tag_pool[:target_tags]
        )  # type: ignore

    if schema_cls == EmailOutput:
        if "commuter" in user_prompt.lower():
            subject = "Never drink lukewarm coffee in rush hour traffic again"
            body = (
                "Morning commutes are demanding enough without discovering your coffee has gone cold "
                "before you even clear highway traffic. The ThermoPulse Smart Travel Mug was engineered "
                "specifically to solve the lukewarm coffee dilemma.\n\n"
                "With built-in app-controlled precision temperature between 120°F and 145°F, your brew stays "
                "at the exact warmth you prefer throughout your entire commute. Its 100% leak-proof 360-degree "
                "magnetic sip lid guarantees zero spills on your work clothes or laptop bag, while our "
                "scratch-resistant ceramic interior preserves true coffee flavor.\n\n"
                "Upgrade your daily morning ritual with 12 hours of dependable thermal battery life. "
                "Enjoy hot coffee when you arrive at your desk, exactly the way you brewed it."
            )
        elif "adventurer" in user_prompt.lower():
            subject = "Hot tea at the mountain summit after hours on the trail"
            body = (
                "Standard mugs lose their heat within the first hour of a brisk morning hike. "
                "When you reach the mountain peak after a four-hour climb, you deserve piping hot tea "
                "or soup that warms you to your core.\n\n"
                "The ThermoPulse Smart Travel Mug features an integrated 12-hour rechargeable battery and "
                "an IPX7 waterproof submersible design built to handle rugged outdoor elements. Its "
                "leak-proof magnetic sip lid ensures your backpack stays completely dry on rocky trails.\n\n"
                "Ditch fragile tumblers and experience uncompromised outdoor warmth on every summit. "
                "Pack dependable gear that keeps up with your longest trail adventures."
            )
        else:
            subject = "Keep your coffee hot through four hours of deep work"
            body = (
                "You dive into a high-focus coding sprint, solve a challenging bug, and reach for your mug—only "
                "to find your beverage stone cold once again. Microwave reheats ruin roast acidity, while desk "
                "clutter distracts your focus.\n\n"
                "The ThermoPulse Smart Travel Mug eliminates the cold beverage interruption entirely. "
                "Featuring ceramic interior lining that prevents metallic aftertastes and app-controlled "
                "precision heating from 120°F to 145°F, your drink stays in its sweet spot from first sip to last.\n\n"
                "Bring elevated minimalism and uninterrupted flow to your desk setup today. "
                "Stay locked in focus with 12 hours of continuous temperature perfection."
            )
        return EmailOutput(
            subject=subject,
            body=body
        )  # type: ignore

    if schema_cls == JudgeResult:
        return JudgeResult(
            reason="Unmistakably on-brand. The copy leads authentically with the specified persona pain point, avoids unsupported claims, and maintains an encouraging, minimalist voice.",
            score=5
        )  # type: ignore

    raise ValueError(f"No mock response configured for schema: {schema_cls}")


# ============================================================================
# Core LLM Call with Retries
# ============================================================================

async def _call_openai_with_retry(
    client: AsyncOpenAI,
    model: str,
    system_prompt: str,
    user_prompt: str,
    temperature: float,
    schema_cls: Type[T],
) -> T:
    """
    Executes a structured completion against OpenAI with:
    - Concurrency semaphore throttling
    - Automatic exponential backoff on 429 and 5xx
    - Single automatic schema recovery retry if invalid JSON is returned
    """
    semaphore = get_semaphore()
    max_network_retries = 3
    base_delay = 1.0

    async with semaphore:
        for attempt in range(max_network_retries):
            try:
                response = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                system_prompt
                                + "\n\nCRITICAL: Respond ONLY with valid, unescaped JSON matching the requested schema. "
                                "No markdown preamble, surrounding commentary, or conversational filler."
                            ),
                        },
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=temperature,
                    response_format={"type": "json_object"},
                )
                raw_content = response.choices[0].message.content or "{}"
                clean_json = strip_code_fences(raw_content)

                try:
                    data = json.loads(clean_json)
                    return schema_cls.model_validate(data)
                except (json.JSONDecodeError, ValidationError):
                    # Schema retry once
                    if attempt == 0:
                        retry_resp = await client.chat.completions.create(
                            model=model,
                            messages=[
                                {
                                    "role": "system",
                                    "content": (
                                        system_prompt
                                        + "\n\nCRITICAL: Respond ONLY with valid, unescaped JSON matching the requested schema."
                                    ),
                                },
                                {"role": "user", "content": user_prompt},
                                {"role": "assistant", "content": raw_content},
                                {
                                    "role": "user",
                                    "content": "Your previous response was not valid JSON for the required schema. Output strictly valid JSON now.",
                                },
                            ],
                            temperature=temperature,
                            response_format={"type": "json_object"},
                        )
                        retry_raw = strip_code_fences(retry_resp.choices[0].message.content or "{}")
                        retry_data = json.loads(retry_raw)
                        return schema_cls.model_validate(retry_data)
                    raise

            except (RateLimitError, APITimeoutError) as err:
                if attempt < max_network_retries - 1:
                    await asyncio.sleep(base_delay * (2 ** attempt))
                    continue
                raise
            except APIError as err:
                # Retry on 5xx server errors
                if hasattr(err, "status_code") and err.status_code and err.status_code >= 500:
                    if attempt < max_network_retries - 1:
                        await asyncio.sleep(base_delay * (2 ** attempt))
                        continue
                raise


async def complete_structured(
    system_prompt: str,
    user_prompt: str,
    schema_cls: Type[T],
    temperature: float = 0.7,
    role: Literal["writer", "judge"] = "writer",
    mock_mode: bool | None = None,
) -> tuple[T, str]:
    """
    Main LLM invocation entrypoint.
    - If mock_mode is True (or settings.MOCK_LLM is True and mock_mode is not explicitly False),
      returns synthetic mock data immediately.
    - Otherwise executes live structured generation via OpenAI.
    - Returns (validated_instance, provider_tag).
    """
    use_mock = settings.MOCK_LLM if mock_mode is None else mock_mode
    if use_mock:
        mock_result = generate_mock_response(schema_cls, system_prompt, user_prompt)
        return mock_result, "mock"

    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured. Please add your key in .env or switch to Mock Mode.")

    model = settings.JUDGE_MODEL if role == "judge" else settings.WRITER_MODEL
    client = get_openai_client()

    try:
        validated = await _call_openai_with_retry(
            client=client,
            model=model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
            schema_cls=schema_cls,
        )
        return validated, "openai"
    except AuthenticationError as auth_err:
        raise RuntimeError(f"OpenAI Authentication Failed: {auth_err}. Check your OPENAI_API_KEY in .env.") from auth_err
    except RateLimitError as rl_err:
        raise RuntimeError(f"OpenAI Rate Limit / Quota Exceeded: {rl_err}. Check your OpenAI account credits.") from rl_err
    except Exception as err:
        raise RuntimeError(f"OpenAI Generation Failed: {err}") from err


async def check_provider_reachability() -> dict[str, Any]:
    """Checks OpenAI reachability and reports live system status."""
    if settings.MOCK_LLM:
        return {
            "status": "ok",
            "primary_provider": "openai",
            "primary_reachable": True,
            "fallback_provider": "none",
            "fallback_reachable": True,
            "mock_mode": True,
        }

    if not settings.OPENAI_API_KEY:
        return {
            "status": "error",
            "primary_provider": "openai",
            "primary_reachable": False,
            "fallback_provider": "none",
            "fallback_reachable": False,
            "mock_mode": False,
        }

    try:
        client = get_openai_client()
        await client.models.list()
        reachable = True
    except Exception:
        reachable = False

    return {
        "status": "ok" if reachable else "error",
        "primary_provider": "openai",
        "primary_reachable": reachable,
        "fallback_provider": "none",
        "fallback_reachable": True,
        "mock_mode": False,
    }
