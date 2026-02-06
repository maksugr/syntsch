from abc import ABC, abstractmethod

from models import EventCandidate


class EventSource(ABC):
    @abstractmethod
    async def fetch_events(self, city: str, days_ahead: int) -> list[EventCandidate]:
        ...
