import re
import unicodedata
from backend.app.schemas import (
    BrandKit,
    PostRules,
    EmailRules,
    RuleResult,
    PostOutput,
    EmailOutput,
    Concept,
)


def normalize_text(text: str) -> str:
    """Normalize Unicode to NFC and convert curly quotes to straight quotes."""
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text)
    # Convert curly quotes to straight quotes
    text = text.replace("’", "'").replace("‘", "'")
    text = text.replace("“", '"').replace("”", '"')
    return text


def get_stem_pattern(word: str) -> str:
    """Generates a regex pattern covering root inflections for a word."""
    word = word.lower()
    if word.endswith("er") and len(word) > 3:
        stem = word[:-2]
        return rf"{re.escape(stem)}(?:e|er|ers|ed|ing|ings|es|s)?"
    elif word.endswith("e") and len(word) > 2:
        stem = word[:-1]
        return rf"{re.escape(stem)}(?:e|er|ers|ed|ing|ings|es|s)?"
    elif word.endswith("y") and len(word) > 2:
        stem = word[:-1]
        return rf"(?:{re.escape(word)}|{re.escape(stem)}(?:ies|ied|ying|ily))"
    else:
        return rf"{re.escape(word)}(?:es|s|ed|ing|ly)?"


def build_banned_term_pattern(term: str) -> re.Pattern:
    """
    Constructs a regex pattern for a banned term that supports:
    - Case insensitivity
    - Single word inflection endings (s, es, ed, ing, ly)
    - Flexible phrase separators (hyphens, spaces, punctuation)
    - Word boundary constraints so unrelated words don't trigger false positives
    """
    term = normalize_text(term).strip().lower()
    # Strip any leading hashtag if user entered #term
    term = term.lstrip("#")

    # Split on whitespace or hyphens
    parts = re.split(r"[\s\-_]+", term)
    parts = [p for p in parts if p]

    if not parts:
        return re.compile(r"$^")

    if len(parts) == 1:
        pattern_str = rf"\b{get_stem_pattern(parts[0])}\b"
    else:
        # Phrase: match parts joined by flexible separators (spaces, hyphens, punctuation)
        patterns = [get_stem_pattern(p) for p in parts]
        separator = r"[\s\-_,.:;!?'\"]+"
        pattern_str = r"\b" + separator.join(patterns) + r"\b"

    return re.compile(pattern_str, re.IGNORECASE)


def find_banned_terms(text: str, banned_terms: list[str]) -> list[tuple[str, str]]:
    """
    Scans text for any banned term violations.
    Returns list of tuples: (banned_term_rule_name, matched_substring).
    Also checks hashtags specifically by removing the leading #.
    """
    if not text or not banned_terms:
        return []

    norm = normalize_text(text)
    violations: list[tuple[str, str]] = []

    # First check raw normalized text
    for term in banned_terms:
        if not term.strip():
            continue
        pattern = build_banned_term_pattern(term)
        for match in pattern.finditer(norm):
            violations.append((term, match.group(0)))

    # Also check hashtag-separated tokens specifically (e.g. #cheap -> check 'cheap')
    hashtag_pattern = re.compile(r"#([a-zA-Z0-9_\-]+)")
    for match in hashtag_pattern.finditer(norm):
        tag_content = match.group(1)
        for term in banned_terms:
            if not term.strip():
                continue
            pattern = build_banned_term_pattern(term)
            sub_match = pattern.search(tag_content)
            if sub_match:
                matched = match.group(0)  # include the full #tag in violation
                if not any(v[1] == matched for v in violations):
                    violations.append((term, matched))

    return violations


def count_words(text: str) -> int:
    """Returns exact whitespace-delimited word count on normalized text."""
    if not text:
        return 0
    norm = normalize_text(text)
    words = norm.strip().split()
    return len(words)


def count_characters(text: str) -> int:
    """Returns exact Unicode character count on NFC normalized text."""
    if not text:
        return 0
    return len(normalize_text(text))


def strip_hashtags_from_body(body: str) -> str:
    """Removes trailing and inline hashtag tokens from the post body to prevent duplicate/excess tags."""
    if not body:
        return ""
    lines = body.rstrip().split("\n")
    while lines and re.match(r"^(?:\s*#[a-zA-Z0-9_\-]+\s*)+$", lines[-1]):
        lines.pop()
    cleaned = "\n".join(lines).strip()
    # Strip any dangling trailing hashtags at the end of text
    cleaned = re.sub(r"(?:\s+#[a-zA-Z0-9_\-]+)+$", "", cleaned).strip()
    return cleaned


def assemble_social_post(body: str, hashtags: list[str]) -> str:
    """Joins clean post body and hashtags deterministically."""
    clean_body = strip_hashtags_from_body(body)
    formatted_tags = [
        f"#{tag.strip().lstrip('#')}"
        for tag in hashtags
        if tag.strip().lstrip("#")
    ]
    if formatted_tags:
        return f"{clean_body}\n\n{' '.join(formatted_tags)}"
    return clean_body


def check_social_post_rules(
    post: PostOutput,
    rules: PostRules,
    banned_terms: list[str]
) -> tuple[str, list[RuleResult]]:
    """
    Validates a social post against channel rules and banned terms.
    Returns (assembled_text, list_of_rule_results).
    """
    assembled = assemble_social_post(post.body, post.hashtags)
    results: list[RuleResult] = []

    # 1. Post Length Check (including joined hashtags)
    char_count = count_characters(assembled)
    length_passed = char_count <= rules.max_chars
    results.append(
        RuleResult(
            rule_id="post_max_chars",
            passed=length_passed,
            detail=f"Post length is {char_count} chars (limit: max {rules.max_chars})",
            matched_text=None if length_passed else f"{char_count} > {rules.max_chars}"
        )
    )

    # 2. Hashtag Count Check
    hashtag_count = len([t for t in post.hashtags if t.strip().lstrip("#")])
    tags_passed = rules.hashtags_min <= hashtag_count <= rules.hashtags_max
    results.append(
        RuleResult(
            rule_id="post_hashtag_count",
            passed=tags_passed,
            detail=f"Hashtag count is {hashtag_count} (allowed range: {rules.hashtags_min}-{rules.hashtags_max})",
            matched_text=None if tags_passed else f"{hashtag_count} hashtags"
        )
    )

    # 3. Banned Terms Check
    banned_violations = find_banned_terms(assembled, banned_terms)
    if banned_violations:
        for term, matched_str in banned_violations:
            results.append(
                RuleResult(
                    rule_id="banned_term",
                    passed=False,
                    detail=f"Found banned term '{term}' in copy",
                    matched_text=matched_str
                )
            )
    else:
        results.append(
            RuleResult(
                rule_id="banned_term",
                passed=True,
                detail="No banned terms found",
                matched_text=None
            )
        )

    return assembled, results


def check_email_rules(
    email: EmailOutput,
    rules: EmailRules,
    banned_terms: list[str]
) -> tuple[str, list[RuleResult]]:
    """
    Validates an email asset against channel rules and banned terms.
    Returns (assembled_text, list_of_rule_results).
    """
    subject = email.subject.strip()
    body = email.body.strip()
    assembled = f"Subject: {subject}\n\n{body}"
    results: list[RuleResult] = []

    # 1. Email Subject Length
    subj_chars = count_characters(subject)
    subj_passed = subj_chars <= rules.subject_max_chars
    results.append(
        RuleResult(
            rule_id="email_subject_max_chars",
            passed=subj_passed,
            detail=f"Subject length is {subj_chars} chars (limit: max {rules.subject_max_chars})",
            matched_text=None if subj_passed else f"{subj_chars} > {rules.subject_max_chars}"
        )
    )

    # 2. Email Body Word Count
    body_words = count_words(body)
    words_passed = rules.body_min_words <= body_words <= rules.body_max_words
    results.append(
        RuleResult(
            rule_id="email_body_word_count",
            passed=words_passed,
            detail=f"Body word count is {body_words} words (allowed range: {rules.body_min_words}-{rules.body_max_words})",
            matched_text=None if words_passed else f"{body_words} words"
        )
    )

    # 3. Banned Terms Check across Subject & Body
    banned_violations = find_banned_terms(assembled, banned_terms)
    if banned_violations:
        for term, matched_str in banned_violations:
            results.append(
                RuleResult(
                    rule_id="banned_term",
                    passed=False,
                    detail=f"Found banned term '{term}' in email",
                    matched_text=matched_str
                )
            )
    else:
        results.append(
            RuleResult(
                rule_id="banned_term",
                passed=True,
                detail="No banned terms found",
                matched_text=None
            )
        )

    return assembled, results


def check_concept_rules(concept: Concept, banned_terms: list[str]) -> list[RuleResult]:
    """Validates that a concept contains no banned terms."""
    full_text = f"{concept.name} {concept.key_message} {concept.hook}"
    violations = find_banned_terms(full_text, banned_terms)
    if violations:
        return [
            RuleResult(
                rule_id="banned_term",
                passed=False,
                detail=f"Concept contains banned term '{term}'",
                matched_text=matched
            )
            for term, matched in violations
        ]
    return [
        RuleResult(
            rule_id="banned_term",
            passed=True,
            detail="No banned terms in concept",
            matched_text=None
        )
    ]
