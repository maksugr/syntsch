import pytest

from models import EventCandidate, ResearchContext
from agents.author import _build_user_message, _build_critic_message, LANGUAGE_NOTES


@pytest.fixture
def event():
    return EventCandidate(
        name="Ryoji Ikeda: data-verse",
        start_date="2026-03-01",
        end_date="2026-03-15",
        venue="Martin-Gropius-Bau",
        city="Berlin",
        category="exhibition",
        description="Audiovisual installation exploring data aesthetics",
    )


@pytest.fixture
def context():
    return ResearchContext(
        artist_background="Ryoji Ikeda is a Japanese artist known for data-driven work.",
        venue_context="Martin-Gropius-Bau is a major exhibition hall in Berlin.",
        cultural_context="Data art has been growing since the 2010s.",
        related_works="Previous show at Centre Pompidou.",
    )


class TestBuildUserMessage:
    def test_contains_event_details(self, event):
        msg = _build_user_message(event, ResearchContext())
        assert "Ryoji Ikeda" in msg
        assert "Martin-Gropius-Bau" in msg
        assert "2026-03-01" in msg
        assert "exhibition" in msg

    def test_contains_end_date_when_different(self, event):
        msg = _build_user_message(event, ResearchContext())
        assert "2026-03-15" in msg

    def test_no_end_date_when_same(self):
        event = EventCandidate(
            name="Concert",
            start_date="2026-03-01",
            end_date="2026-03-01",
            venue="V",
            category="music",
            description="D",
        )
        msg = _build_user_message(event, ResearchContext())
        assert msg.count("2026-03-01") == 1

    def test_contains_research_context(self, event, context):
        msg = _build_user_message(event, context)
        assert "Artist/creator background" in msg or "artist_background" in msg.lower()
        assert "Ryoji Ikeda is a Japanese artist" in msg
        assert "Research context" in msg

    def test_no_research_section_when_empty(self, event):
        msg = _build_user_message(event, ResearchContext())
        assert "Research context" not in msg


class TestBuildCriticMessage:
    def test_contains_draft(self, event):
        msg = _build_critic_message("This is the draft essay.", event, ResearchContext())
        assert "This is the draft essay." in msg

    def test_contains_event_for_fact_checking(self, event, context):
        msg = _build_critic_message("Draft.", event, context)
        assert "Ryoji Ikeda" in msg
        assert "Martin-Gropius-Bau" in msg
        assert "exhibition" in msg

    def test_contains_research_context(self, event, context):
        msg = _build_critic_message("Draft.", event, context)
        assert "Artist background" in msg
        assert "Venue context" in msg

    def test_truncates_long_context(self, event):
        long_ctx = ResearchContext(artist_background="x" * 5000)
        msg = _build_critic_message("Draft.", event, long_ctx)
        x_count = msg.count("x")
        assert x_count <= 1010
        assert x_count < 5000


class TestLanguageNotes:
    def test_all_languages_present(self):
        assert "en" in LANGUAGE_NOTES
        assert "de" in LANGUAGE_NOTES
        assert "ru" in LANGUAGE_NOTES

    def test_russian_has_latin_script_reminder(self):
        assert "латиницей" in LANGUAGE_NOTES["ru"] or "латиниц" in LANGUAGE_NOTES["ru"].lower()

    def test_german_has_proper_noun_reminder(self):
        assert "Eigennamen" in LANGUAGE_NOTES["de"] or "Original" in LANGUAGE_NOTES["de"]
