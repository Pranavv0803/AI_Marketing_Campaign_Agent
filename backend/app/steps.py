from typing import Literal
from backend.app.schemas import (
    BrandKit,
    Persona,
    Concept,
    ConceptsLLMOutput,
    ConceptsResponse,
    PostOutput,
    EmailOutput,
    JudgeResult,
    RuleResult,
)
from backend.app.llm import complete_structured
from backend.app.rules import check_concept_rules
from backend.app.prompts.concepts import build_concepts_prompt
from backend.app.prompts.write_piece import build_write_piece_prompt
from backend.app.prompts.judge import build_judge_prompt
from backend.app.prompts.autofix import build_autofix_prompt


def resolve_persona_angles(personas: list[Persona]) -> dict[str, tuple[str, list[str]]]:
    """
    Assigns each persona a distinct primary pain point and computes the other personas'
    lead pain points to avoid. Resolves collisions if two personas list the same first pain point.
    Returns: { persona_id: (lead_pain_point, avoid_pain_points_list) }
    """
    assigned_leads: dict[str, str] = {}
    used_leads: set[str] = set()

    for p in personas:
        chosen_lead = None
        for pain in p.pain_points:
            cleaned = pain.strip()
            if cleaned and cleaned not in used_leads:
                chosen_lead = cleaned
                used_leads.add(cleaned)
                break
        if not chosen_lead:
            chosen_lead = p.pain_points[0].strip() if p.pain_points else f"Focus area for {p.name}"
        assigned_leads[p.id] = chosen_lead

    # Compute avoid lists
    result_map: dict[str, tuple[str, list[str]]] = {}
    all_assigned = list(assigned_leads.values())
    for p in personas:
        lead = assigned_leads[p.id]
        avoids = [a for a in all_assigned if a != lead]
        result_map[p.id] = (lead, avoids)

    return result_map


async def generate_concepts_step(
    brand_kit: BrandKit,
    personas: list[Persona],
    mock_mode: bool | None = None
) -> ConceptsResponse:
    """
    Generates 3 campaign concepts, verifying zero banned terms deterministically.
    Retries once if a banned term is detected.
    """
    sys_prompt, user_prompt = build_concepts_prompt(brand_kit, personas)

    for attempt in range(2):
        llm_out, provider = await complete_structured(
            system_prompt=sys_prompt,
            user_prompt=user_prompt,
            schema_cls=ConceptsLLMOutput,
            temperature=0.9,
            role="writer",
            mock_mode=mock_mode,
        )
        concepts = llm_out.concepts[:3]

        # Deterministic check for banned terms in concepts
        has_banned = False
        for c in concepts:
            results = check_concept_rules(c, brand_kit.banned_terms)
            if any(not r.passed for r in results):
                has_banned = True
                break

        if not has_banned or attempt == 1:
            return ConceptsResponse(concepts=concepts)

    return ConceptsResponse(concepts=concepts)


async def write_piece_step(
    brand_kit: BrandKit,
    persona: Persona,
    lead_pain_point: str,
    avoid_pain_points: list[str],
    concept: Concept,
    channel: Literal["post", "email"],
    mock_mode: bool | None = None
) -> tuple[PostOutput | EmailOutput, str]:
    """Generates initial draft copy for a specific persona and channel."""
    sys_prompt, user_prompt = build_write_piece_prompt(
        brand_kit=brand_kit,
        persona=persona,
        lead_pain_point=lead_pain_point,
        avoid_pain_points=avoid_pain_points,
        concept=concept,
        channel=channel,
    )
    target_schema = PostOutput if channel == "post" else EmailOutput
    output, provider = await complete_structured(
        system_prompt=sys_prompt,
        user_prompt=user_prompt,
        schema_cls=target_schema,
        temperature=0.8,
        role="writer",
        mock_mode=mock_mode,
    )
    return output, provider


async def judge_piece_step(
    brand_kit: BrandKit,
    persona: Persona,
    channel: str,
    assembled_text: str,
    mock_mode: bool | None = None
) -> tuple[JudgeResult, str]:
    """Evaluates qualitative brand voice and tone fit."""
    sys_prompt, user_prompt = build_judge_prompt(
        brand_kit=brand_kit,
        persona=persona,
        channel=channel,
        assembled_text=assembled_text,
    )
    result, provider = await complete_structured(
        system_prompt=sys_prompt,
        user_prompt=user_prompt,
        schema_cls=JudgeResult,
        temperature=0.1,
        role="judge",
        mock_mode=mock_mode,
    )
    return result, provider


async def autofix_piece_step(
    brand_kit: BrandKit,
    persona: Persona,
    channel: Literal["post", "email"],
    original_piece: str,
    failed_rules: list[RuleResult],
    judge_reason: str | None = None,
    mock_mode: bool | None = None
) -> tuple[PostOutput | EmailOutput, str]:
    """Applies one automated remediation attempt on failing copy."""
    sys_prompt, user_prompt = build_autofix_prompt(
        brand_kit=brand_kit,
        persona=persona,
        channel=channel,
        original_piece=original_piece,
        failed_rules=failed_rules,
        judge_reason=judge_reason,
    )
    target_schema = PostOutput if channel == "post" else EmailOutput
    output, provider = await complete_structured(
        system_prompt=sys_prompt,
        user_prompt=user_prompt,
        schema_cls=target_schema,
        temperature=0.5,
        role="writer",
        mock_mode=mock_mode,
    )
    return output, provider
