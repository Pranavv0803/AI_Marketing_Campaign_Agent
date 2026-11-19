from backend.app.schemas import BrandKit, Persona


def build_judge_prompt(
    brand_kit: BrandKit,
    persona: Persona,
    channel: str,
    assembled_text: str
) -> tuple[str, str]:
    """
    Constructs the qualitative brand-fit judge prompt.
    Enforces chain-of-thought critique (reason) before final integer score (1-5).
    """
    system_prompt = (
        "You are an impartial, exacting brand compliance judge and copy editor.\n"
        "Your role is to objectively evaluate marketing copy against brand voice standards and target persona tone.\n"
        "SCORING RUBRIC:\n"
        "- 5: Unmistakably on-voice; authentic persona resonance and natural brand alignment.\n"
        "- 4: On-brand with minor slips; persuasive and clearly aligns with voice standards.\n"
        "- 3: Generic or partly off-voice; reads like standard boilerplate copy.\n"
        "- 2: Noticeably off-tone; clashes with persona preferences or brand voice.\n"
        "- 1: Clearly off-brand, tone-deaf, or contradictory to brand identity.\n\n"
        "CRITICAL REQUIREMENT:\n"
        "In your JSON output, provide the 'reason' critique FIRST to justify your assessment, followed by the integer 'score'."
    )

    example_lines = "\n".join(f'- "{line}"' for line in brand_kit.example_lines)

    user_prompt = f"""<brand_guidelines>
Brand: {brand_kit.brand_name} ({brand_kit.product_name})
Voice Adjectives: {', '.join(brand_kit.voice_adjectives)}
Voice Summary: {brand_kit.voice_summary}
Example Lines:
{example_lines}
</brand_guidelines>

<target_persona>
Persona: {persona.name} ({persona.role})
Preferred Tone: {persona.preferred_tone}
Motivations: {', '.join(persona.motivations)}
</target_persona>

<piece_to_evaluate channel="{channel}">
{assembled_text}
</piece_to_evaluate>

Evaluate the brand fit and persona alignment of this copy.
Respond ONLY with a JSON object in this format:
{{
  "reason": "Two or three sentences explaining specifically why the copy fits or fails the brand voice and persona tone.",
  "score": 4
}}"""

    return system_prompt, user_prompt
