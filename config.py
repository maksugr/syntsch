from pathlib import Path

BASE_DIR = Path(__file__).parent

CITY = "Berlin"
DAYS_AHEAD = 14
ARTICLE_LANGUAGE = "en"

SCOUT_MODEL = "claude-sonnet-4-5-20250929"
CURATOR_MODEL = "claude-sonnet-4-5-20250929"
AUTHOR_MODEL = "claude-opus-4-6"
CRITIC_MODEL = "claude-opus-4-6"
LEAD_MODEL = "claude-opus-4-6"

CATEGORIES = [
    "music",
    "cinema",
    "theater",
    "exhibition",
    "lecture",
    "festival",
    "performance",
    "club",
]

DATA_DIR = BASE_DIR / "data"
PROMPTS_DIR = BASE_DIR / "prompts"
