from typing import Literal
from backend.app.schemas import BrandKit, Persona, RuleResult


def build_autofix_prompt(
    brand_kit: BrandKit,
    persona: Persona,
    channel: Literal["post", "email"],
    original_piece: str,
    failed_rules: list[RuleResult],
    judge_reason: str | None = None
) -> tuple[str, str]:
    """
    Constructs prompt for targeted one-time automated remediation of failing copy.
    """
    system_prompt = (
        "You are an expert copy remediation specialist and editor.\n"
        "Your task is to rewrite a draft that failed specific brand compliance or channel length checks.\n"
        "MANDATORY INSTRUCTIONS:\n"
        "1. Fix every listed rule violation directly without creating new violations.\n"
        "2. If a banned term was detected, remove or replace it with an allowed on-brand synonym.\n"
        "3. If character or word limits were exceeded, trim unnecessary fluff while preserving core meaning.\n"
        "4. Preserve the assigned persona angle and voice.\n"
        "5. Output ONLY valid JSON in the requested channel schema."
    )

    failures_formatted = "\n".join(
        f"- [FAILED RULE: {r.rule_id}]: {r.detail}" + (f" (Offending text: '{r.matched_text}')" if r.matched_text else "")
        for r in failed_rules
    )

    judge_critique = f"Judge Critique: {judge_reason}\n" if judge_reason else ""

    if channel == "post":
        import json
        min_tags = brand_kit.channel_rules.post.hashtags_min
        max_tags = brand_kit.channel_rules.post.hashtags_max
        sample_count = max(1, min_tags)
        sample_tags = json.dumps([f"CleanTag{i+1}" for i in range(sample_count)])
        tag_rule_text = (
            f"EXACTLY {min_tags} hashtag(s)"
            if min_tags == max_tags
            else f"Between {min_tags} and {max_tags} hashtags (inclusive)"
        )
        schema_format = f"""{{
  "body": "Clean rewritten body copy without any hashtags",
  "hashtags": {sample_tags}
}}
MANDATORY HASHTAG RULE: The 'hashtags' list must contain {tag_rule_text}. Do NOT put any hashtags inside the 'body' text."""
    else:
        schema_format = """{
  "subject": "Clean rewritten subject line",
  "body": "Clean rewritten body paragraphs within word count limits"
}"""

    user_prompt = f"""<brand_rules>
Brand: {brand_kit.brand_name} ({brand_kit.product_name})
Voice: {', '.join(brand_kit.voice_adjectives)} - {brand_kit.voice_summary}
Forbidden Banned Terms: {', '.join(brand_kit.banned_terms)}
</brand_rules>

<target_persona>
{persona.name} ({persona.role}) - Preferred Tone: {persona.preferred_tone}
</target_persona>

<original_copy channel="{channel}">
{original_piece}
</original_copy>

<detected_failures>
{failures_formatted}
{judge_critique}</detected_failures>

Rewrite this {channel} to completely resolve all detected failures.
Respond strictly in valid JSON:
{schema_format}"""

    return system_prompt, user_prompt
