import os
from pathlib import Path

BASE_DIR = Path(__file__).parent

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")
SITE_URL = "https://syntsch.de"

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

GENERAL_SOURCES = [
    "tip-berlin.de",
    "exberliner.com",
    "zitty.de",
    "timeout.com",
    "visitberlin.de",
]

CATEGORY_SOURCES = {
    "music": [
        "residentadvisor.net",
        "songkick.com",
        "bandsintown.com",
        "berliner-philharmoniker.de",
    ],
    "cinema": [
        "berlinale.de",
        "mubi.com",
        "yorck.de",
        "arsenalfilm.de",
    ],
    "theater": [
        "nachtkritik.de",
        "gorki.de",
        "schaubuehne.de",
        "deutschestheater.de",
    ],
    "exhibition": [
        "artforum.com",
        "monopol-magazin.de",
        "smb.museum",
        "kw-berlin.de",
    ],
    "lecture": [
        "hkw.de",
        "berliner-festspiele.de",
        "ici-berlin.org",
    ],
    "festival": [
        "berliner-festspiele.de",
        "transmediale.de",
        "ctm-festival.de",
        "berlinerfestspiele.de",
    ],
    "performance": [
        "hau-berlin.de",
        "sophiensaele.com",
        "tanzimaugust.de",
        "radialsystem.de",
    ],
    "club": [
        "residentadvisor.net",
        "berghain.berlin",
        "clubcommission.de",
    ],
}

DATA_DIR = BASE_DIR / "data"
PROMPTS_DIR = BASE_DIR / "prompts"
