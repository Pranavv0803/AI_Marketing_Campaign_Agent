import pytest
from backend.app.schemas import PostRules, EmailRules, PostOutput, EmailOutput, Concept
from backend.app.rules import (
    normalize_text,
    count_characters,
    count_words,
    find_banned_terms,
    assemble_social_post,
    check_social_post_rules,
    check_email_rules,
    check_concept_rules,
)


# ============================================================================
# 1. Unicode & Normalization Tests
# ============================================================================

def test_unicode_normalization_and_curly_quotes():
    raw = "Here’s a “revolutionary” cup with coffee: café & ☕!"
    norm = normalize_text(raw)
    assert "’" not in norm
    assert "'" in norm
    assert "“" not in norm
    assert '"' in norm
    assert count_characters("café") == 4
    assert count_characters("☕") == 1


# ============================================================================
# 2. Social Post Boundary Tests
# ============================================================================

def test_post_length_boundaries():
    rules = PostRules(max_chars=50, hashtags_min=1, hashtags_max=2)
    banned = ["cheap"]

    # Post with hashtag "#mug" (5 chars: space space #mug is 6 chars added to body)
    # Total chars = len(body) + len("\n\n#mug") -> len(body) + 6
    # Let's test exact boundaries:
    # 44 chars body + 6 chars = 50 chars (Exact limit)
    body_exact = "A" * 44
    post_exact = PostOutput(body=body_exact, hashtags=["mug"])
    assembled, results = check_social_post_rules(post_exact, rules, banned)
    assert count_characters(assembled) == 50
    assert any(r.rule_id == "post_max_chars" and r.passed for r in results)

    # 43 chars body + 6 chars = 49 chars (One under limit)
    body_under = "A" * 43
    post_under = PostOutput(body=body_under, hashtags=["mug"])
    _, results_under = check_social_post_rules(post_under, rules, banned)
    assert any(r.rule_id == "post_max_chars" and r.passed for r in results_under)

    # 45 chars body + 6 chars = 51 chars (One over limit)
    body_over = "A" * 45
    post_over = PostOutput(body=body_over, hashtags=["mug"])
    _, results_over = check_social_post_rules(post_over, rules, banned)
    assert any(r.rule_id == "post_max_chars" and not r.passed for r in results_over)


def test_post_hashtag_boundaries():
    rules = PostRules(max_chars=280, hashtags_min=1, hashtags_max=3)
    banned = []

    # 0 hashtags (one under min) -> fail
    _, r0 = check_social_post_rules(PostOutput(body="Test body", hashtags=[]), rules, banned)
    assert any(r.rule_id == "post_hashtag_count" and not r.passed for r in r0)

    # 1 hashtag (exact min) -> pass
    _, r1 = check_social_post_rules(PostOutput(body="Test body", hashtags=["one"]), rules, banned)
    assert any(r.rule_id == "post_hashtag_count" and r.passed for r in r1)

    # 3 hashtags (exact max) -> pass
    _, r3 = check_social_post_rules(PostOutput(body="Test body", hashtags=["one", "two", "three"]), rules, banned)
    assert any(r.rule_id == "post_hashtag_count" and r.passed for r in r3)

    # 4 hashtags (one over max) -> fail
    _, r4 = check_social_post_rules(PostOutput(body="Test body", hashtags=["1", "2", "3", "4"]), rules, banned)
    assert any(r.rule_id == "post_hashtag_count" and not r.passed for r in r4)


# ============================================================================
# 3. Email Asset Boundary Tests
# ============================================================================

def test_email_subject_boundaries():
    rules = EmailRules(subject_max_chars=60, body_min_words=10, body_max_words=20)
    banned = []
    dummy_body = "word " * 15

    # 59 chars (one under) -> pass
    s_under = "A" * 59
    _, r_under = check_email_rules(EmailOutput(subject=s_under, body=dummy_body), rules, banned)
    assert any(r.rule_id == "email_subject_max_chars" and r.passed for r in r_under)

    # 60 chars (exact) -> pass
    s_exact = "A" * 60
    _, r_exact = check_email_rules(EmailOutput(subject=s_exact, body=dummy_body), rules, banned)
    assert any(r.rule_id == "email_subject_max_chars" and r.passed for r in r_exact)

    # 61 chars (one over) -> fail
    s_over = "A" * 61
    _, r_over = check_email_rules(EmailOutput(subject=s_over, body=dummy_body), rules, banned)
    assert any(r.rule_id == "email_subject_max_chars" and not r.passed for r in r_over)


def test_email_body_word_count_boundaries():
    rules = EmailRules(subject_max_chars=60, body_min_words=75, body_max_words=150)
    banned = []
    dummy_subj = "Valid subject"

    # 74 words (one under min) -> fail
    b_under = " ".join(["word"] * 74)
    _, r_under = check_email_rules(EmailOutput(subject=dummy_subj, body=b_under), rules, banned)
    assert any(r.rule_id == "email_body_word_count" and not r.passed for r in r_under)

    # 75 words (exact min) -> pass
    b_min = " ".join(["word"] * 75)
    _, r_min = check_email_rules(EmailOutput(subject=dummy_subj, body=b_min), rules, banned)
    assert any(r.rule_id == "email_body_word_count" and r.passed for r in r_min)

    # 150 words (exact max) -> pass
    b_max = " ".join(["word"] * 150)
    _, r_max = check_email_rules(EmailOutput(subject=dummy_subj, body=b_max), rules, banned)
    assert any(r.rule_id == "email_body_word_count" and r.passed for r in r_max)

    # 151 words (one over max) -> fail
    b_over = " ".join(["word"] * 151)
    _, r_over = check_email_rules(EmailOutput(subject=dummy_subj, body=b_over), rules, banned)
    assert any(r.rule_id == "email_body_word_count" and not r.passed for r in r_over)


# ============================================================================
# 4. Banned Terms & Obfuscation Variant Tests
# ============================================================================

def test_banned_terms_variations():
    banned = ["cheap", "game-changer", "revolutionary"]

    # 1. Case variations
    assert len(find_banned_terms("This is CHEAP coffee.", banned)) == 1
    assert len(find_banned_terms("A very Cheap solution.", banned)) == 1

    # 2. Plurals and inflections
    assert len(find_banned_terms("Finding cheap deals and cheaps.", banned)) >= 1
    assert len(find_banned_terms("This is a game-changing product.", banned)) == 1
    assert len(find_banned_terms("These are game changers.", banned)) == 1

    # 3. Punctuation and spacing variations
    assert len(find_banned_terms("A real game-changer for everyone.", banned)) == 1
    assert len(find_banned_terms("A true game changer here.", banned)) == 1
    assert len(find_banned_terms("A genuine game   changer today.", banned)) == 1

    # 4. Hashtag format
    assert len(find_banned_terms("Check out our #cheap options!", banned)) >= 1
    assert len(find_banned_terms("It is #revolutionary!", banned)) >= 1

    # 5. Curly quotes around banned terms
    assert len(find_banned_terms("They called it “revolutionary”.", banned)) == 1


def test_banned_terms_no_false_positives_inside_longer_words():
    banned = ["hack", "cheap"]

    # "shack" or "thack" contains "hack", but should NOT match
    assert len(find_banned_terms("We stayed at a wooden shack by the lake.", banned)) == 0

    # "backpack" contains "pack", not "hack"
    assert len(find_banned_terms("Pack your backpack.", banned)) == 0

    # "cheapskate" is an unrelated compound word
    # Notice word boundary ensures \bcheap(s|es|ed|ing|ly)?\b does not match "cheapskate"
    assert len(find_banned_terms("He was a famous cheapskate.", banned)) == 0


def test_concept_banned_terms():
    banned = ["miracle"]
    clean_concept = Concept(name="Pure Warmth", key_message="Hot drinks on the go", hook="Sip perfection.")
    dirty_concept = Concept(name="Miracle Cup", key_message="It works like magic", hook="A miracle sip.")

    res_clean = check_concept_rules(clean_concept, banned)
    assert all(r.passed for r in res_clean)

    res_dirty = check_concept_rules(dirty_concept, banned)
    assert any(not r.passed and "miracle" in r.detail.lower() for r in res_dirty)
