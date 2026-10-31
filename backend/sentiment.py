"""VADER sentiment analysis for complaint descriptions.

Sentiment describes the tone of the wording. It is not a judgment about how
serious, urgent, or truthful a complaint is.
"""

from __future__ import annotations

import logging
from threading import Lock

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
except ImportError:  # pragma: no cover - only happens if dependencies are missing
    SentimentIntensityAnalyzer = None

logger = logging.getLogger(__name__)
_analyzer = None
_analyzer_lock = Lock()


def _get_analyzer():
    """Create the VADER analyzer once, on first use."""
    global _analyzer
    if SentimentIntensityAnalyzer is None:
        raise RuntimeError("vaderSentiment is not installed")
    if _analyzer is None:
        with _analyzer_lock:
            if _analyzer is None:
                _analyzer = SentimentIntensityAnalyzer()
    return _analyzer


def analyze_sentiment(text: str) -> tuple[str | None, float | None]:
    """Return (label, compound_score), or (None, None) if analysis fails."""
    try:
        compound = float(_get_analyzer().polarity_scores(text)["compound"])
        if compound >= 0.05:
            label = "positive"
        elif compound <= -0.05:
            label = "negative"
        else:
            label = "neutral"
        return label, round(compound, 4)
    except Exception:
        logger.exception("Sentiment analysis failed; storing NULL sentiment values.")
        return None, None
