from pathlib import Path

BASE_DIR = Path(__file__).parent

CITY = "Berlin"
DAYS_AHEAD = 14
ESSAY_LANGUAGE = "en"

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

DB_PATH = BASE_DIR / "data" / "events.db"
OUTPUT_DIR = BASE_DIR / "output"
PROMPTS_DIR = BASE_DIR / "prompts"
