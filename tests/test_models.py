import pytest
from datetime import datetime

from models import EventCandidate, ScoutResult, CuratorResult, ResearchContext, ArticleOutput


class TestEventCandidate:
    def test_minimal(self):
        e = EventCandidate(name="Test", venue="Club", category="music", description="Desc")
        assert e.name == "Test"
        assert e.city == "Berlin"
        assert e.start_date == ""
        assert e.source_url == ""

    def test_full(self):
        e = EventCandidate(
            name="Ryoji Ikeda",
            start_date="2026-03-01",
            end_date="2026-03-15",
            venue="Martin-Gropius-Bau",
            city="Berlin",
            category="exhibition",
            description="New installation",
            source_url="https://example.com",
            event_url="https://event.com",
            raw_snippet="Some raw content",
        )
        assert e.end_date == "2026-03-15"
        assert e.raw_snippet == "Some raw content"

    def test_empty_venue_allowed(self):
        e = EventCandidate(name="Festival", venue="", category="festival", description="City-wide")
        assert e.venue == ""

    def test_missing_required_raises(self):
        with pytest.raises(Exception):
            EventCandidate(name="Test")


class TestScoutResult:
    def test_creation(self):
        events = [
            EventCandidate(name="E1", venue="V1", category="music", description="D1"),
            EventCandidate(name="E2", venue="V2", category="cinema", description="D2"),
        ]
        r = ScoutResult(events=events, searched_at=datetime.now())
        assert len(r.events) == 2


class TestCuratorResult:
    def test_creation(self):
        r = CuratorResult(chosen_event_id="abc-123", why_chosen="Best event", curated_at=datetime.now())
        assert r.chosen_event_id == "abc-123"


class TestResearchContext:
    def test_defaults(self):
        ctx = ResearchContext()
        assert ctx.artist_background == ""
        assert ctx.raw_sources == []

    def test_with_data(self):
        ctx = ResearchContext(artist_background="Bio", raw_sources=["url1", "url2"])
        assert len(ctx.raw_sources) == 2


class TestArticleOutput:
    def test_creation(self):
        event = EventCandidate(name="E", venue="V", category="music", description="D")
        a = ArticleOutput(
            title="Title",
            body="Body text here",
            event=event,
            language="en",
            word_count=500,
            model_used="claude-opus-4-6",
            generated_at=datetime.now(),
        )
        assert a.lead == ""
        assert a.word_count == 500
