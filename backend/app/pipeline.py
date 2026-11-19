from typing import Literal
from backend.app.schemas import (
    BrandKit,
    Persona,
    Concept,
    PieceResult,
    PostOutput,
    EmailOutput,
)
from backend.app.rules import (
    check_social_post_rules,
    check_email_rules,
)
from backend.app.steps import (
    write_piece_step,
    judge_piece_step,
    autofix_piece_step,
)


async def run_piece(
    brand_kit: BrandKit,
    persona: Persona,
    lead_pain_point: str,
    avoid_pain_points: list[str],
    concept: Concept,
    channel: Literal["post", "email"],
    mock_mode: bool | None = None
) -> PieceResult:
    """
    Executes the end-to-end piece lifecycle:
    1. Write draft
    2. Check deterministic rules
    3. Run qualitative judge
    4. If broken rules or score <= 2: auto-fix once -> re-check rules -> re-judge
    5. Return finalized PieceResult with audit results
    """
    # Step 1: Initial drafting
    draft_output, provider = await write_piece_step(
        brand_kit=brand_kit,
        persona=persona,
        lead_pain_point=lead_pain_point,
        avoid_pain_points=avoid_pain_points,
        concept=concept,
        channel=channel,
        mock_mode=mock_mode,
    )

    # Step 2: Deterministic Rule Checking
    if channel == "post" and isinstance(draft_output, PostOutput):
        assembled_text, rule_results = check_social_post_rules(
            post=draft_output,
            rules=brand_kit.channel_rules.post,
            banned_terms=brand_kit.banned_terms,
        )
    else:
        assert isinstance(draft_output, EmailOutput)
        assembled_text, rule_results = check_email_rules(
            email=draft_output,
            rules=brand_kit.channel_rules.email,
            banned_terms=brand_kit.banned_terms,
        )

    # Step 3: Qualitative Judge Scoring
    judge_result, _ = await judge_piece_step(
        brand_kit=brand_kit,
        persona=persona,
        channel=channel,
        assembled_text=assembled_text,
        mock_mode=mock_mode,
    )

    # Determine if remediation is triggered
    has_rule_failures = any(not r.passed for r in rule_results)
    is_low_score = judge_result.score <= 2

    if not has_rule_failures and not is_low_score:
        return PieceResult(
            persona_id=persona.id,
            channel=channel,
            assembled_text=assembled_text,
            rule_results=rule_results,
            judge=judge_result,
            status="pass",
            provider=provider,
        )

    # Step 4: One-time Automatic Remediation
    failed_rules = [r for r in rule_results if not r.passed]
    fixed_output, fix_provider = await autofix_piece_step(
        brand_kit=brand_kit,
        persona=persona,
        channel=channel,
        original_piece=assembled_text,
        failed_rules=failed_rules,
        judge_reason=judge_result.reason if is_low_score else None,
        mock_mode=mock_mode,
    )

    # Re-evaluate rules after auto-fix
    if channel == "post" and isinstance(fixed_output, PostOutput):
        # Deterministically guarantee hashtag count bounds
        max_h = brand_kit.channel_rules.post.hashtags_max
        min_h = brand_kit.channel_rules.post.hashtags_min
        if len(fixed_output.hashtags) > max_h:
            fixed_output.hashtags = fixed_output.hashtags[:max_h]
        elif len(fixed_output.hashtags) < min_h:
            pool = [brand_kit.brand_name.replace(" ", ""), "CoffeeTech", "TravelMug", "PerfectSip"]
            for tag in pool:
                if len(fixed_output.hashtags) >= min_h:
                    break
                if tag not in fixed_output.hashtags:
                    fixed_output.hashtags.append(tag)

        recheck_text, recheck_rules = check_social_post_rules(
            post=fixed_output,
            rules=brand_kit.channel_rules.post,
            banned_terms=brand_kit.banned_terms,
        )
    else:
        assert isinstance(fixed_output, EmailOutput)
        recheck_text, recheck_rules = check_email_rules(
            email=fixed_output,
            rules=brand_kit.channel_rules.email,
            banned_terms=brand_kit.banned_terms,
        )

    # Re-judge after auto-fix
    recheck_judge, _ = await judge_piece_step(
        brand_kit=brand_kit,
        persona=persona,
        channel=channel,
        assembled_text=recheck_text,
        mock_mode=mock_mode,
    )

    still_failing_rules = any(not r.passed for r in recheck_rules)
    still_low_score = recheck_judge.score <= 2
    final_status: Literal["fixed", "failing"] = (
        "failing" if (still_failing_rules or still_low_score) else "fixed"
    )

    return PieceResult(
        persona_id=persona.id,
        channel=channel,
        assembled_text=recheck_text,
        rule_results=recheck_rules,
        judge=recheck_judge,
        status=final_status,
        provider=fix_provider,
    )
