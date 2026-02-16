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


class CritiqueIssue(BaseModel):
    type: str
    severity: str
    location: str
    fix: str


class PipelineTrace(BaseModel):
    draft_text: str = ""
    draft_word_count: int = 0
    critique_assessment: str = ""
    critique_issues: list[CritiqueIssue] = []
    revised_text: str = ""
    revision_changed: bool = False
    research_sources_count: int = 0
    research_context: ResearchContext | None = None
    expanded: bool = False


class ArticleOutput(BaseModel):
    title: str
    lead: str = ""
    body: str
    event: EventCandidate
    language: str
    word_count: int
    model_used: str
    generated_at: datetime
    trace: PipelineTrace | None = None


class ReflectionOutput(BaseModel):
    title: str
    body: str
    language: str
    period_start: str
    period_end: str
    analysis: dict
    word_count: int
    model_used: str
    generated_at: datetime
