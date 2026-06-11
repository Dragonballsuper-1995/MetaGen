"""
Lightweight keyword extractor for SEO tag generation.

Uses term frequency analysis with stop-word filtering to produce
relevant unigrams and bigrams from video scripts.  Zero external
dependencies — runs in <10 ms on any CPU.
"""

import re
from collections import Counter
from functools import lru_cache

from backend.utils.text_processing import split_sentences

# --- Stop words (common English + YouTube/cooking/generic noise) ----------

_STOP_WORDS = frozenset({
    # Determiners / articles
    "a", "an", "the",
    # Conjunctions / connectors
    "and", "or", "but", "nor", "yet", "so", "for",
    # Prepositions
    "in", "on", "at", "to", "of", "with", "by", "from", "into",
    "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "about", "against",
    # Pronouns
    "i", "me", "my", "mine", "we", "us", "our", "ours",
    "you", "your", "yours", "he", "him", "his",
    "she", "her", "hers", "it", "its",
    "they", "them", "their", "theirs",
    "this", "that", "these", "those", "who", "whom", "which", "what",
    # Be / Have / Do
    "is", "am", "are", "was", "were", "be", "been", "being",
    "has", "have", "had", "having",
    "do", "does", "did", "doing",
    # Modals
    "will", "would", "shall", "should", "may", "might",
    "can", "could", "must", "need", "dare", "ought",
    # Adverbs / fillers
    "not", "no", "very", "really", "just", "also", "too",
    "quite", "rather", "ever", "never", "always", "often",
    "still", "already", "even", "only", "here", "there",
    "now", "then", "when", "where", "why", "how",
    "more", "most", "much", "many", "some", "any",
    "each", "every", "both", "few", "all", "own", "same",
    "such", "than", "other", "another",
    # Common verbs (too generic for SEO)
    "get", "got", "getting", "make", "made", "making",
    "go", "going", "gone", "went",
    "come", "came", "coming",
    "take", "took", "taken", "taking",
    "give", "gave", "given", "giving",
    "see", "saw", "seen", "seeing",
    "know", "knew", "known", "knowing",
    "think", "thought", "thinking",
    "say", "said", "saying",
    "tell", "told", "telling",
    "use", "used", "using",
    "find", "found", "finding",
    "put", "keep", "kept", "let",
    "begin", "began", "seem", "seemed",
    "want", "wanted", "wanting",
    "show", "showed", "shown", "showing",
    "try", "tried", "trying",
    "look", "looked", "looking",
    # YouTube script filler
    "video", "today", "guys", "hey", "okay", "alright",
    "specifically", "actually", "basically", "literally", "simply",
    "clearly", "exactly", "completely", "entirely", "fully",
    "partially", "slightly", "mostly", "usually", "often",
    "rarely", "sometimes", "always", "never", "perhaps",
    "maybe", "probably", "possibly", "definitely", "certainly",
    "individual", "distinct", "separate", "different", "similar",
    "various", "multiple", "several", "many", "few",
    "extractive", "abstractive", "numerical", "categorical",
    "specifically", "focused", "focusing", "looking", "looked",
    # Generic nouns / adjectives (not SEO-useful alone)
    "glass", "fork", "spoon", "knife", "bowl", "plate", "cup",
    "minutes", "minute", "seconds", "second", "hours", "hour",
    "degrees", "degree", "step", "steps", "part", "parts",
    "inside", "outside", "top", "bottom", "side", "sides",
    "little", "big", "small", "large", "long", "short",
    "left", "end", "start", "point", "add", "added", "adding",
    "done", "ready", "work", "works", "working", "best",
    "half", "full", "set", "place", "turn", "cover",
    "rest", "whole", "enough", "everything", "nothing",
    "super", "pretty", "nice", "amazing", "awesome", "fantastic",
    "perfect", "simple", "easy", "hard", "different",
    # Script / document artefacts
    "summary", "introduction", "conclusion", "overview", "section",
    "chapter", "note", "notes", "example", "examples",
    "description", "title", "script", "transcript",
    # Video/film production words (not SEO-useful)
    "cinematic", "montage", "close", "shot", "scene", "scenes",
    "camera", "zoom", "frame", "edit", "editing",
    "visual", "visuals", "footage", "clip", "clips",
    "cinema", "film", "movie", "production", "youtube", "video",
    # Generic process/medium words
    "workflow", "strategy", "breakdown", "guide", "tutorial",
    "tips", "tricks", "hacks", "secrets", "masterclass",
    "lesson", "lecture", "presentation", "script", "segment",
    # Generic action/process words
    "demonstrating", "demonstrates", "demonstrate",
    "highlighting", "highlights", "highlight",
    "explains", "explaining",
    "featuring", "features", "feature",
    "creating", "creates", "create",
    "preparing", "prepares", "prepare", "preparation",
    "boiling", "chopping", "cutting", "mixing", "stirring",
    "draining", "pouring", "pressing", "removing",
    # Generic adjectives/adverbs that aren't SEO terms
    "specific", "particular", "certain", "various",
    "important", "crucial", "essential", "necessary",
    "final", "main", "real", "true", "total",
    "special", "extra", "complete", "entire",
    # Common script/recipe verbs & nouns (too generic for SEO)
    "stop", "required", "maximum", "minimum",
    "temperature", "segment", "blend", "cook",
    "cooking", "listen", "watch", "learn", "teach",
    "process", "result", "results", "method",
    "technique", "level", "amount", "number",
    "layer", "layers", "base", "line", "open",
    "pull", "push", "move", "bring", "brought",
    "onto", "upon", "along", "across",
    "around", "until", "while", "since", "feel", "feels", "feeling", "room", "head",
    "hand", "hands", "flat", "heavy", "light",
    "down", "press", "gently",
    "soft", "tender", "cool", "warm", "cold", "water",
    "excess", "evaporates", "colander", "drain",
    "sheet", "preheat", "oven", "drizzle", "olive",
})


@lru_cache(maxsize=256)
def _tokenize_cached(text: str) -> tuple[str, ...]:
    return tuple(w.lower() for w in re.findall(r"[a-zA-Z]{4,}", text))


def _tokenize(text: str) -> list[str]:
    return list(_tokenize_cached(text))


@lru_cache(maxsize=128)
def _filtered_sentence_tokens_cached(text: str) -> tuple[tuple[str, ...], ...]:
    sentence_tokens: list[tuple[str, ...]] = []
    sentences = split_sentences(text, keep_punctuation=False)
    for sentence in sentences:
        sent_tokens = tuple(w for w in _tokenize_cached(sentence) if w not in _STOP_WORDS)
        if sent_tokens:
            sentence_tokens.append(sent_tokens)
    return tuple(sentence_tokens)


def extract_tags(text: str, top_n: int = 15) -> list[str]:
    if top_n <= 0:
        return []

    tokens = _tokenize(text)
    filtered = [t for t in tokens if t not in _STOP_WORDS]

    if len(filtered) < 3:
        return filtered[:top_n]

    total = len(filtered)
    uni_counts = Counter(filtered)

    # Build n-grams within sentence boundaries to avoid accidental phrase joins.
    phrase_counts: Counter[str] = Counter()
    sentence_tokens = _filtered_sentence_tokens_cached(text)
    for sent_tokens_tuple in sentence_tokens:
        if len(sent_tokens_tuple) < 2:
            continue
        sent_tokens = list(sent_tokens_tuple)
        for n in (2, 3):
            for i in range(len(sent_tokens) - n + 1):
                words = sent_tokens[i:i + n]
                if len(set(words)) == 1:
                    continue
                phrase = " ".join(words)
                phrase_counts[phrase] += 1

    def _phrase_score(phrase: str, count: int) -> float:
        words = phrase.split()
        rarity = sum(1.0 / (1.0 + uni_counts[w]) for w in words) / len(words)
        length_bonus = 0.2 * (len(words) - 1)
        return (count * 1.4) + (rarity * 2.0) + length_bonus

    phrase_scored: list[tuple[str, float]] = sorted(
        ((phrase, _phrase_score(phrase, count)) for phrase, count in phrase_counts.items()),
        key=lambda x: x[1],
        reverse=True,
    )

    uni_scored: list[tuple[str, float]] = sorted(
        ((word, count / total) for word, count in uni_counts.items()),
        key=lambda x: x[1],
        reverse=True,
    )

    result: list[str] = []
    covered_words: set[str] = set()

    max_phrases = min(len(phrase_scored), max(top_n * 3 // 4, 4))
    for phrase, _score in phrase_scored[:max_phrases]:
        if len(result) >= top_n:
            break
        result.append(phrase)
        covered_words.update(phrase.split())

    for word, _score in uni_scored:
        if len(result) >= top_n:
            break
        if word in covered_words:
            continue
        result.append(word)
        covered_words.add(word)

    return result[:top_n]
