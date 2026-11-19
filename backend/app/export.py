import re
import json
from backend.app.schemas import Campaign, ExportResponse


def sanitize_filename(name: str) -> str:
    """Removes filesystem-unsafe characters from generated file names."""
    slug = re.sub(r"[^a-zA-Z0-9_\-]+", "-", name.strip().lower()).strip("-")
    return slug or "marketing-campaign"


def generate_markdown_export(campaign: Campaign) -> str:
    """Formats the full campaign hierarchy into clean, professional Markdown."""
    kit = campaign.brand_kit
    concept = campaign.concept

    md_lines = [
        f"# Marketing Campaign: {kit.brand_name} - {kit.product_name}",
        f"**Tagline**: *{kit.tagline}*",
        f"**Voice Profile**: {', '.join(kit.voice_adjectives)} — {kit.voice_summary}",
        "",
        "---",
        "",
        "## Selected Campaign Concept",
        f"### {concept.name}",
        f"**Key Message**: {concept.key_message}",
        f"**Hook**: \"{concept.hook}\"",
        "",
        "---",
        "",
        "## Tailored Persona Assets",
        "",
    ]

    # Map pieces by (persona_id, channel)
    pieces_map = {(p.persona_id, p.channel): p for p in campaign.pieces}

    for persona in campaign.personas:
        md_lines.extend([
            f"### Persona: {persona.name} ({persona.role})",
            f"- **Preferred Tone**: {persona.preferred_tone}",
            f"- **Primary Motivations**: {', '.join(persona.motivations)}",
            f"- **Key Pain Points**: {', '.join(persona.pain_points)}",
            "",
        ])

        # 1. Social Post
        post = pieces_map.get((persona.id, "post"))
        if post:
            badge = f" [{post.status.upper()}]" if post.status != "pass" else ""
            md_lines.extend([
                f"#### Social Post{badge}",
                "```text",
                post.assembled_text,
                "```",
                f"- **Brand-Fit Score**: {post.judge.score}/5",
                f"- **Judge Rationale**: {post.judge.reason}",
                f"- **Provider**: `{post.provider}`",
                "- **Rule Validations**:",
            ])
            for rule in post.rule_results:
                icon = "✅" if rule.passed else "❌"
                md_lines.append(f"  - {icon} **{rule.rule_id}**: {rule.detail}")
            md_lines.append("")

        # 2. Email
        email = pieces_map.get((persona.id, "email"))
        if email:
            badge = f" [{email.status.upper()}]" if email.status != "pass" else ""
            md_lines.extend([
                f"#### Marketing Email{badge}",
                "```text",
                email.assembled_text,
                "```",
                f"- **Brand-Fit Score**: {email.judge.score}/5",
                f"- **Judge Rationale**: {email.judge.reason}",
                f"- **Provider**: `{email.provider}`",
                "- **Rule Validations**:",
            ])
            for rule in email.rule_results:
                icon = "✅" if rule.passed else "❌"
                md_lines.append(f"  - {icon} **{rule.rule_id}**: {rule.detail}")
            md_lines.append("")

        md_lines.append("---")
        md_lines.append("")

    return "\n".join(md_lines)


def export_campaign_data(campaign: Campaign, format_type: str) -> ExportResponse:
    """Exports the campaign as Markdown or JSON."""
    brand_slug = sanitize_filename(campaign.brand_kit.brand_name)

    if format_type.lower() == "json":
        data = campaign.model_dump(mode="json")
        json_content = json.dumps(data, indent=2)
        return ExportResponse(
            filename=f"{brand_slug}-campaign.json",
            content=json_content,
            mime_type="application/json"
        )

    # Markdown export default
    md_content = generate_markdown_export(campaign)
    return ExportResponse(
        filename=f"{brand_slug}-campaign.md",
        content=md_content,
        mime_type="text/markdown"
    )
