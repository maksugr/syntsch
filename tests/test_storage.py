import pytest
from datetime import datetime

from models import EventCandidate, ArticleOutput
from storage import EventStorage, generate_slug


@pytest.fixture
def tmp_storage(tmp_path):
    return EventStorage(tmp_path)


@pytest.fixture
def sample_event():
    return EventCandidate(
        name="Ryoji Ikeda: data-verse",
        start_date="2026-03-01",
        end_date="2026-03-15",
        venue="Martin-Gropius-Bau",
        city="Berlin",
        category="exhibition",
        description="Audiovisual installation",
        source_url="https://example.com",
    )


class TestGenerateSlug:
    def test_basic(self):
        assert generate_slug("Hello World") == "hello-world"

    def test_cyrillic(self):
        slug = generate_slug("Берлинская филармония")
        assert slug == "berlinskaya-filarmoniya"
        assert slug.isascii()

    def test_special_chars(self):
        assert (
            generate_slug("Ryoji Ikeda: data-verse 3.0") == "ryoji-ikeda-data-verse-3-0"
        )

    def test_empty_string(self):
        assert generate_slug("") == ""

    def test_mixed_script(self):
        slug = generate_slug("Концерт Kraftwerk в Berghain")
        assert "kraftwerk" in slug
        assert "berghain" in slug


class TestEventStorage:
    def test_save_event_returns_id(self, tmp_storage, sample_event):
        eid = tmp_storage.save_event(sample_event)
        assert eid
        assert len(eid) == 36

    def test_save_event_dedup_by_name(self, tmp_storage, sample_event):
        eid1 = tmp_storage.save_event(sample_event)
        eid2 = tmp_storage.save_event(sample_event)
        assert eid1 == eid2

    def test_save_event_dedup_case_insensitive(self, tmp_storage, sample_event):
        eid1 = tmp_storage.save_event(sample_event)
        upper = EventCandidate(
            name=sample_event.name.upper(),
            venue="Other",
            category="exhibition",
            description="Desc",
        )
        eid2 = tmp_storage.save_event(upper)
        assert eid1 == eid2

    def test_get_event(self, tmp_storage, sample_event):
        eid = tmp_storage.save_event(sample_event)
        row = tmp_storage.get_event(eid)
        assert row["name"] == sample_event.name
        assert row["category"] == "exhibition"

    def test_get_event_missing(self, tmp_storage):
        assert tmp_storage.get_event("nonexistent-id") is None

    def test_event_exists(self, tmp_storage, sample_event):
        tmp_storage.save_event(sample_event)
        assert tmp_storage.event_exists(sample_event.name)
        assert not tmp_storage.event_exists("Nonexistent Event")

    def test_get_all_event_names(self, tmp_storage):
        e1 = EventCandidate(
            name="Event A", venue="V1", category="music", description="D1"
        )
        e2 = EventCandidate(
            name="Event B", venue="V2", category="cinema", description="D2"
        )
        tmp_storage.save_event(e1)
        tmp_storage.save_event(e2)
        names = tmp_storage.get_all_event_names()
        assert set(names) == {"Event A", "Event B"}

    def test_find_existing_event_by_venue_date(self, tmp_storage, sample_event):
        eid = tmp_storage.save_event(sample_event)
        found = tmp_storage.find_existing_event(
            "Different Name", "Martin-Gropius-Bau", "2026-03-01"
        )
        assert found == eid

    def test_find_existing_event_not_found(self, tmp_storage, sample_event):
        tmp_storage.save_event(sample_event)
        assert tmp_storage.find_existing_event("X", "Y", "2099-01-01") is None

    def test_event_to_candidate(self, tmp_storage, sample_event):
        eid = tmp_storage.save_event(sample_event)
        row = tmp_storage.get_event(eid)
        candidate = tmp_storage.event_to_candidate(row)
        assert candidate.name == sample_event.name
        assert isinstance(candidate, EventCandidate)

    def test_save_article(self, tmp_storage, sample_event):
        eid = tmp_storage.save_event(sample_event)
        article = ArticleOutput(
            title="Test Title",
            lead="Test lead",
            body="Body text " * 100,
            event=sample_event,
            language="en",
            word_count=200,
            model_used="test",
            generated_at=datetime.now(),
        )
        aid, slug = tmp_storage.save_article(eid, article)
        assert aid
        assert slug == "test-title"

    def test_has_article_in_language(self, tmp_storage, sample_event):
        eid = tmp_storage.save_event(sample_event)
        assert not tmp_storage.has_article_in_language(eid, "en")

        article = ArticleOutput(
            title="T",
            body="B",
            event=sample_event,
            language="en",
            word_count=1,
            model_used="test",
            generated_at=datetime.now(),
        )
        tmp_storage.save_article(eid, article)
        assert tmp_storage.has_article_in_language(eid, "en")
        assert not tmp_storage.has_article_in_language(eid, "de")

    def test_is_already_covered(self, tmp_storage, sample_event):
        eid = tmp_storage.save_event(sample_event)
        assert not tmp_storage.is_already_covered(
            sample_event.name, sample_event.venue, sample_event.start_date
        )

        article = ArticleOutput(
            title="T",
            body="B",
            event=sample_event,
            language="en",
            word_count=1,
            model_used="test",
            generated_at=datetime.now(),
        )
        tmp_storage.save_article(eid, article)
        assert tmp_storage.is_already_covered(
            sample_event.name, sample_event.venue, sample_event.start_date
        )
        assert tmp_storage.is_already_covered(
            sample_event.name,
            sample_event.venue,
            sample_event.start_date,
            language="en",
        )
        assert not tmp_storage.is_already_covered(
            sample_event.name,
            sample_event.venue,
            sample_event.start_date,
            language="de",
        )

    def test_get_available_events(self, tmp_storage):
        future = EventCandidate(
            name="Future",
            start_date="2099-01-01",
            venue="V",
            category="music",
            description="D",
        )
        past = EventCandidate(
            name="Past",
            start_date="2020-01-01",
            venue="V",
            category="music",
            description="D",
        )
        tmp_storage.save_event(future)
        tmp_storage.save_event(past)

        available = tmp_storage.get_available_events()
        names = [e["name"] for e in available]
        assert "Future" in names
        assert "Past" not in names

    def test_get_available_events_excludes_covered(self, tmp_storage, sample_event):
        future_event = EventCandidate(
            name="Future Show",
            start_date="2099-06-01",
            venue="V",
            category="music",
            description="D",
        )
        eid = tmp_storage.save_event(future_event)

        assert len(tmp_storage.get_available_events()) == 1

        article = ArticleOutput(
            title="T",
            body="B",
            event=future_event,
            language="en",
            word_count=1,
            model_used="test",
            generated_at=datetime.now(),
        )
        tmp_storage.save_article(eid, article)

        available_en = tmp_storage.get_available_events(language="en")
        assert len(available_en) == 0

        available_de = tmp_storage.get_available_events(language="de")
        assert len(available_de) == 1

    def test_unique_slug_collision(self, tmp_storage, sample_event):
        eid = tmp_storage.save_event(sample_event)
        a1 = ArticleOutput(
            title="Same Title",
            body="B1",
            event=sample_event,
            language="en",
            word_count=1,
            model_used="test",
            generated_at=datetime.now(),
        )
        a2 = ArticleOutput(
            title="Same Title",
            body="B2",
            event=sample_event,
            language="de",
            word_count=1,
            model_used="test",
            generated_at=datetime.now(),
        )
        _, slug1 = tmp_storage.save_article(eid, a1)
        _, slug2 = tmp_storage.save_article(eid, a2)
        assert slug1 == "same-title"
        assert slug2 == "same-title-2"

    def test_get_recent_categories(self, tmp_storage, sample_event):
        eid = tmp_storage.save_event(sample_event)
        article = ArticleOutput(
            title="T",
            body="B",
            event=sample_event,
            language="en",
            word_count=1,
            model_used="test",
            generated_at=datetime.now(),
        )
        tmp_storage.save_article(eid, article)
        cats = tmp_storage.get_recent_categories(days=7)
        assert "exhibition" in cats
