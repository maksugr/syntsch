from datetime import datetime
from pydantic import BaseModel


class EventCandidate(BaseModel):
    name: str
    start_date: str = ""
    end_date: str = ""
    venue: str
    city: str = "Berlin"
    category: str
    description: str
    source_url: str = ""
    event_url: str = ""
    raw_snippet: str = ""


class ScoutResult(BaseModel):
    events: list[EventCandidate]
    searched_at: datetime


class CuratorResult(BaseModel):
    chosen_event_id: str
    why_chosen: str
    curated_at: datetime


class ResearchContext(BaseModel):
    artist_background: str = ""
    venue_context: str = ""
    cultural_context: str = ""
    related_works: str = ""
    raw_sources: list[str] = []


class ArticleOutput(BaseModel):
    title: str
    lead: str = ""
    body: str
    event: EventCandidate
    language: str
    word_count: int
    model_used: str
    generated_at: datetime
