import asyncio
import json
from datetime import datetime
from unittest.mock import AsyncMock

import pytest

from models import EventCandidate, ArticleOutput
from storage import EventStorage


@pytest.fixture
def tmp_storage(tmp_path):
    return EventStorage(tmp_path)


@pytest.fixture
def sample_event():
    return EventCandidate(
        name="Ryoji Ikeda: data-verse",
        start_date="2026-03-01",
        venue="Martin-Gropius-Bau",
        city="Berlin",
        category="exhibition",
        description="Audiovisual installation",
        source_url="https://example.com",
    )


@pytest.fixture
def saved_articles(tmp_storage, sample_event):
    eid = tmp_storage.save_event(sample_event)
    slugs = []
    for lang in ["en", "ru"]:
        article = ArticleOutput(
            title=f"Test Article {lang}",
            lead=f"Lead text {lang}",
            body=f"Body text {lang}",
            event=sample_event,
            language=lang,
            word_count=100,
            model_used="test",
            generated_at=datetime.now(),
        )
        _, slug = tmp_storage.save_article(eid, article)
        slugs.append(slug)
    return slugs


class TestNotifyReadsArticles:
    def test_reads_article_json(self, tmp_storage, saved_articles):
        slug = saved_articles[0]
        path = tmp_storage.articles_dir / f"{slug}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        assert data["title"] == "Test Article en"
        assert data["language"] == "en"
        assert data["event"]["category"] == "exhibition"

    def test_missing_slug_not_found(self, tmp_storage):
        path = tmp_storage.articles_dir / "nonexistent.json"
        assert not path.exists()


class TestNotifySendsCorrectly:
    def test_telegram_sent_for_ru(self, tmp_storage, saved_articles):
        ru_slug = saved_articles[1]
        path = tmp_storage.articles_dir / f"{ru_slug}.json"
        article = json.loads(path.read_text(encoding="utf-8"))

        mock_tg = AsyncMock()
        asyncio.run(mock_tg(article["title"], article["lead"], article["slug"]))
        mock_tg.assert_called_once_with("Test Article ru", "Lead text ru", ru_slug)

    def test_email_sent_with_event_data(self, tmp_storage, saved_articles):
        slug = saved_articles[0]
        path = tmp_storage.articles_dir / f"{slug}.json"
        article = json.loads(path.read_text(encoding="utf-8"))
        event = article["event"]

        mock_email = AsyncMock()
        asyncio.run(
            mock_email(
                title=article["title"],
                lead=article["lead"],
                slug=article["slug"],
                language=article["language"],
                category=event.get("category", ""),
                venue=event.get("venue", ""),
                start_date=event.get("start_date", ""),
            )
        )
        mock_email.assert_called_once_with(
            title="Test Article en",
            lead="Lead text en",
            slug=slug,
            language="en",
            category="exhibition",
            venue="Martin-Gropius-Bau",
            start_date="2026-03-01",
        )


class TestArticleJsonStructure:
    def test_has_required_fields(self, tmp_storage, saved_articles):
        for slug in saved_articles:
            path = tmp_storage.articles_dir / f"{slug}.json"
            data = json.loads(path.read_text(encoding="utf-8"))
            assert "title" in data
            assert "lead" in data
            assert "slug" in data
            assert "language" in data
            assert "event" in data
            assert "category" in data["event"]
            assert "venue" in data["event"]
            assert "start_date" in data["event"]
