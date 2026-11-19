from typing import Literal
from backend.app.schemas import BrandKit, Persona, Concept


def build_write_piece_prompt(
    brand_kit: BrandKit,
    persona: Persona,
    lead_pain_point: str,
    avoid_pain_points: list[str],
    concept: Concept,
    channel: Literal["post", "email"]
) -> tuple[str, str]:
    """
    Constructs isolated system and user prompts for persona-tailored copy generation.
    Incorporates safety margin on channel limits.
    """
    system_prompt = (
        "You are an expert multi-channel copywriter specializing in highly personalized brand messaging.\n"
        "Your task is to craft tailored marketing copy for a specific persona and channel.\n"
        "MANDATORY INSTRUCTIONS:\n"
        "1. Ground your copy strictly in the assigned lead pain point. Do NOT reuse the angles assigned to other personas.\n"
        "2. Do NOT invent product features or claims. Only use factual claims from the provided True Product Features list.\n"
        "3. Strictly avoid all banned words, phrases, and their variants.\n"
        "4. Uphold the specified persona tone while staying authentic to the core brand voice.\n"
        "5. Stay strictly within the requested channel length constraints.\n"
        "6. Respond strictly with valid JSON conforming to the requested schema."
    )

    banned_list = ", ".join(brand_kit.banned_terms) if brand_kit.banned_terms else "None"
    features_list = "\n".join(f"- {f}" for f in brand_kit.product_features)
    example_lines = "\n".join(f'- "{line}"' for line in brand_kit.example_lines)
    all_pain_points = "\n".join(f"- {p}" for p in persona.pain_points)
    avoid_list = "\n".join(f"- {a}" for a in avoid_pain_points) if avoid_pain_points else "None"

    # Channel constraints with 10-15% safety margins
    if channel == "post":
        import json
        # Target limit: safety margin of ~15% below max_chars
        safety_max_chars = int(brand_kit.channel_rules.post.max_chars * 0.88)
        min_tags = brand_kit.channel_rules.post.hashtags_min
        max_tags = brand_kit.channel_rules.post.hashtags_max

        sample_tags_count = max(1, min_tags)
        sample_tags_json = json.dumps([f"Tag{i+1}" for i in range(sample_tags_count)])

        if min_tags == max_tags:
            hashtag_req = f"EXACTLY {min_tags} relevant hashtag(s). You MUST return an array with EXACTLY {min_tags} element(s)."
        else:
            hashtag_req = f"Between {min_tags} and {max_tags} relevant hashtags (inclusive). Do NOT provide fewer than {min_tags} or more than {max_tags}."

        channel_instruction = f"""CHANNEL CONSTRAINTS (Social Post):
- Absolute Hard Limit: {brand_kit.channel_rules.post.max_chars} characters (including hashtags and spaces).
- Safety Target: Keep total length under {safety_max_chars} characters to guarantee compliance.
- Hashtags Count Rule: {hashtag_req}
- Output JSON format:
{{
  "body": "Post body text WITHOUT any hashtags or '#' symbols inside the body",
  "hashtags": {sample_tags_json}
}}
CRITICAL RULES FOR HASHTAGS:
1. Do NOT put any '#' symbols or hashtags inside the 'body' text. All hashtags MUST be placed in the 'hashtags' array only.
2. The 'hashtags' array length must strictly obey the rule: {hashtag_req}
3. Hashtags in the array must NOT have the '#' prefix (e.g. use "CoffeeTech", not "#CoffeeTech")."""
    else:
        # Email constraints
        safety_subj_chars = int(brand_kit.channel_rules.email.subject_max_chars * 0.90)
        min_words = brand_kit.channel_rules.email.body_min_words
        max_words = brand_kit.channel_rules.email.body_max_words
        safety_max_words = int(max_words * 0.92)

        channel_instruction = f"""CHANNEL CONSTRAINTS (Marketing Email):
- Subject Line: Maximum {brand_kit.channel_rules.email.subject_max_chars} characters (safety target: <{safety_subj_chars} characters).
- Email Body Word Count: Between {min_words} and {max_words} words (safety target: {min_words + 5} to {safety_max_words} words).
- Output JSON format:
{{
  "subject": "Compelling subject line",
  "body": "Complete email body paragraphs"
}}"""

    user_prompt = f"""<brand_context>
Brand Name: {brand_kit.brand_name}
Product Name: {brand_kit.product_name}
Tagline: {brand_kit.tagline}
Brand Voice: {', '.join(brand_kit.voice_adjectives)} - {brand_kit.voice_summary}

Example On-Brand Lines:
{example_lines}

Allowed Product Features (ONLY USE CLAIMS FOUND HERE):
{features_list}

Forbidden Banned Terms (NEVER USE THESE OR ANY VARIATIONS):
{banned_list}
</brand_context>

<campaign_concept>
Concept Name: {concept.name}
Key Message: {concept.key_message}
Hook: {concept.hook}
</campaign_concept>

<target_persona>
Name: {persona.name}
Role: {persona.role}
Preferred Tone: {persona.preferred_tone}
Key Motivations: {', '.join(persona.motivations)}
All Pain Points:
{all_pain_points}
</target_persona>

<assigned_angles>
PRIMARY LEAD ANGLE (YOU MUST LEAD WITH THIS):
"{lead_pain_point}"

ANGLES ASSIGNED TO OTHER PERSONAS (DO NOT REUSE OR LEAD WITH THESE):
{avoid_list}
</assigned_angles>

{channel_instruction}

Generate the copy for this {channel} now. Output strictly valid JSON."""

    return system_prompt, user_prompt
