# Ptytsch

Autonomous cultural digest. Finds interesting events in your city, writes essay-reviews in the style of i-D/Dazed, publishes daily.

## How it works

Four agents run in a chain:

1. **Scout** — searches for cultural events, saves 5 candidates to DB
2. **Curator** — picks the best event from the pool of all non-expired, unwritten events (per language)
3. **Author** — researches the event deeply, writes a long-form essay with Dazed-style tone of voice, generates a lede for the card preview
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
| `ESSAY_LANGUAGE` | `"en"` | Essay language: `en`, `de`, or `ru` |
| `SCOUT_MODEL` | `claude-sonnet-4-5-20250929` | LLM for event discovery |
| `CURATOR_MODEL` | `claude-sonnet-4-5-20250929` | LLM for event selection |
| `AUTHOR_MODEL` | `claude-opus-4-6` | LLM for essay writing |
| `CRITIC_MODEL` | `claude-opus-4-6` | LLM for self-critique |
| `LEAD_MODEL` | `claude-opus-4-6` | LLM for lede generation |

## Usage

All commands go through `cli.py`:

```bash
# find 5 events and save to DB
python cli.py scout

# custom city and time window
python cli.py scout --city Berlin --days 14

# pick the best event from the pool (preview, no essay)
python cli.py curate

# let curator pick, then write essay
python cli.py author --from-curator

# write essay for a specific event ID from DB
python cli.py author --event-id 3

# write essay from a JSON file (also saves event to DB)
python cli.py author --event examples/sample_event.json

# write in German or Russian
python cli.py author --from-curator --language de
python cli.py author --from-curator --language ru

# full pipeline: scout → curate → author
python cli.py pipeline

# full pipeline with options
python cli.py pipeline --city Berlin --language en
```

One event can have essays in all three languages. The curator and author filter by language — so running `--language de` won't skip an event that already has an English essay.

All data is stored in SQLite (`data/events.db`). Human-readable output (`.md`, `.json`) is also saved to `output/` for convenience.

## Web app

Static Next.js 16 site (Tailwind v4, brutalist design). Located in `web/`.

### Features

- **i18n**: language selector (en/de/ru) persisted in cookie, translates category names, sidebar labels, dates
- **Fonts**: Bebas Neue (Latin) + Russo One (Cyrillic), switched per language via CSS variable
- **Feed**: 2-column card grid on desktop, category filters
- **Dates**: locale-aware formatting (en-GB, de-DE for Latin; short month names; per-language)
- **Static export** to `web/out/`

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
# output in web/out/
```

## Project structure

```
ptytsch2/
├── cli.py                 — all CLI commands (scout, curate, author, pipeline)
├── config.py              — settings (city, models, language)
├── models.py              — Pydantic data models
├── storage.py             — SQLite storage (events + essays, language-aware dedup)
├── agents/
│   ├── scout.py           — event discovery (finds 5 candidates)
│   ├── curator.py         — event selection (picks best from pool, per language)
│   └── author.py          — essay generation with self-critique
├── sources/
│   ├── base.py            — event source interface
│   ├── tavily_search.py   — Tavily web search source
│   └── research.py        — web search for essay context
├── prompts/
│   ├── author_system.md   — author system prompt
│   └── critic_system.md   — self-critique prompt
├── web/                   — Next.js 16 static site
│   ├── app/               — pages (home feed, article/[id])
│   ├── components/        — Header, LanguageSelector, LanguageProvider,
│   │                        EssayCard, EssayFeed, CategoryTag, EventSidebar
│   └── lib/               — db.ts, types.ts, translations.ts
├── examples/              — sample event JSONs
├── output/                — generated essays and scout results
└── data/                  — SQLite database (gitignored)
```

## Extending

### Add a new city

Change `CITY` in `config.py`. The search queries adapt automatically.

### Add a new event source

Create a class in `sources/` that implements `EventSource.fetch_events()`. Register it in `agents/scout.py`.

### Add a new language

Set `ESSAY_LANGUAGE` in `config.py` to `"en"`, `"de"`, or `"ru"`. The author prompt adjusts automatically. To add more languages, extend the language-specific sections in `prompts/author_system.md` and add translations in `web/lib/translations.ts`.
