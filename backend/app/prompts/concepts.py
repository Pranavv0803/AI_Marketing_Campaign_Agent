from backend.app.schemas import BrandKit, Persona


def build_concepts_prompt(brand_kit: BrandKit, personas: list[Persona]) -> tuple[str, str]:
    """
    Constructs isolated system and user prompts for campaign concept generation.
    Enforces that user inputs are treated strictly as data, not instructions.
    """
    system_prompt = (
        "You are an expert brand marketing strategist and creative director.\n"
        "Your task is to generate exactly three distinct, compelling campaign concepts for the specified product.\n"
        "Each concept must have: name, key_message, and hook.\n"
        "CRITICAL RULES:\n"
        "1. Never use any forbidden banned terms listed in the brand kit.\n"
        "2. Ground concepts in the true product features.\n"
        "3. Output MUST be valid JSON conforming to the ConceptsLLMOutput schema with exactly 3 concepts."
    )

    persona_summaries = "\n".join(
        f"- {p.name} ({p.role}): Primary pain point: {p.pain_points[0] if p.pain_points else 'N/A'}"
        for p in personas
    )

    banned_list = ", ".join(brand_kit.banned_terms) if brand_kit.banned_terms else "None"
    features_list = "\n".join(f"- {f}" for f in brand_kit.product_features)
    example_lines = "\n".join(f'- "{line}"' for line in brand_kit.example_lines)

    user_prompt = f"""<brand_data>
Brand Name: {brand_kit.brand_name}
Product Name: {brand_kit.product_name}
Tagline: {brand_kit.tagline}
Brand Voice Adjectives: {', '.join(brand_kit.voice_adjectives)}
Brand Voice Summary: {brand_kit.voice_summary}

Example On-Brand Lines:
{example_lines}

True Product Features (USE ONLY CLAIMS FOUND HERE):
{features_list}

Banned Words & Phrases (DO NOT USE ANY OF THESE OR THEIR VARIANTS):
{banned_list}
</brand_data>

<target_personas>
{persona_summaries}
</target_personas>

Generate exactly 3 distinct concepts that provide different creative angles for our multi-channel campaign.
Respond ONLY with a JSON object in this format:
{{
  "concepts": [
    {{
      "name": "Concept Title",
      "key_message": "One or two sentences explaining the core concept message.",
      "hook": "A punchy, attention-grabbing opening line or hook."
    }},
    ...
  ]
}}"""

    return system_prompt, user_prompt
