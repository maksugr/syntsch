# Ptytsch

Autonomous cultural digest. Finds interesting events in your city, writes article-reviews in the style of i-D/Dazed, publishes daily.

## How it works

Four agents run in a chain:

1. **Scout** — searches for cultural events (with dedup and query rotation), saves new candidates to `data/events/`
2. **Curator** — picks the best event from the pool of all non-expired, unwritten events
3. **Author** — researches the event once, writes articles in all requested languages (default: en/de/ru) with Dazed-style tone of voice, generates a lede for each
4. **Publisher** — formats and publishes to website + sends email to subscribers (not yet implemented)

Everything is fully autonomous. No human moderation.

## Setup

```bash
# clone and enter
cd ptytsch2

# create virtualenv and install
python -m venv .venv
source .venv/bin/activate
pip install -e .

# configure
cp .env.example .env
# edit .env — add your ANTHROPIC_API_KEY and TAVILY_API_KEY
```

### API keys

| Key | Where to get |
|-----|-------------|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/ |
| `TAVILY_API_KEY` | https://tavily.com/ |

## Configuration

Edit `config.py`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `CITY` | `"Berlin"` | City to search events in |
| `DAYS_AHEAD` | `14` | How many days ahead to look |
| `ARTICLE_LANGUAGE` | `"en"` | Article language: `en`, `de`, or `ru` |
| `SCOUT_MODEL` | `claude-sonnet-4-5-20250929` | LLM for event discovery |
| `CURATOR_MODEL` | `claude-sonnet-4-5-20250929` | LLM for event selection |
| `AUTHOR_MODEL` | `claude-opus-4-6` | LLM for article writing |
| `CRITIC_MODEL` | `claude-opus-4-6` | LLM for self-critique |
| `LEAD_MODEL` | `claude-opus-4-6` | LLM for lede generation |

## Usage

All commands go through `cli.py`:

```bash
# find 5 events and save to data/events/
python cli.py scout

# custom city and time window
python cli.py scout --city Berlin --days 14

# pick the best event from the pool (preview, no article)
python cli.py curate

# let curator pick, then write articles in all 3 languages
python cli.py author --from-curator

# only specific languages
python cli.py author --from-curator --language en de
python cli.py author --from-curator --language ru

# write articles for a specific event UUID
python cli.py author --event-id 9a3f1c7e-...

# write articles from a JSON file (also saves event)
python cli.py author --event examples/sample_event.json

# full pipeline: scout → curate → author (all languages)
python cli.py pipeline

# full pipeline with options
python cli.py pipeline --city Berlin --language en de
```

Curator picks one event, author writes articles for all requested languages. If an article already exists for a given event+language, it's skipped. Research runs once per event.

All data is stored as JSON flat files in `data/events/` and `data/articles/`, tracked in git.

## Web app

Static Next.js 16 site (Tailwind v4, brutalist design). Located in `web/`.

### Run locally

```bash
cd web
npm install
npm run dev
```

### Build

```bash
cd web
npm run build
```

## Project structure

```
ptytsch2/
├── cli.py                 — all CLI commands (scout, curate, author, pipeline)
├── config.py              — settings (city, models, language)
├── models.py              — Pydantic data models
├── storage.py             — JSON file storage (events + articles, language-aware dedup, event dedup)
├── agents/
│   ├── scout.py           — event discovery (finds 5 candidates)
│   ├── curator.py         — event selection (picks best from pool, per language)
│   └── author.py          — article generation with self-critique
├── sources/
│   ├── base.py            — event source interface
│   ├── tavily_search.py   — Tavily web search source (query rotation)
│   └── research.py        — web search for article context
├── prompts/
│   ├── author_system.md   — author system prompt
│   └── critic_system.md   — self-critique prompt
├── web/                   — Next.js 16 static site
│   ├── app/               — pages (home feed, article/[slug])
│   ├── components/        — Header, LanguageSelector, LanguageProvider,
│   │                        ArticleCard, ArticleFeed, CategoryTag, EventSidebar
│   └── lib/               — db.ts, types.ts, translations.ts
├── examples/              — sample event JSONs
└── data/                  — JSON flat files (events + articles, tracked in git)
```

## Extending

### Add a new city

Change `CITY` in `config.py`. The search queries adapt automatically.

### Add a new event source

Create a class in `sources/` that implements `EventSource.fetch_events()`. Register it in `agents/scout.py`.

### Add a new language

By default all three languages (en, de, ru) are written. Use `--language` to limit: `--language en de`. To add more languages, extend `LANGUAGE_NOTES` in `agents/author.py` and add translations in `web/lib/translations.ts`.
