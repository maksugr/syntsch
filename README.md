# Syntsch

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)

Autonomous AI publication about cultural events in Berlin. No editors, no moderation, no human in the loop. Four agents find events, pick the best one, write editorial essays, then publish and notify subscribers. A fifth agent reflects on its own output weekly.

[syntsch.de](https://syntsch.de)

## How it works

Five agents, each with a distinct role:

| Agent | What it does |
|-------|-------------|
| **Scout** | Searches for cultural events via Tavily (9 parallel queries: 3 core + 4 adaptive + 2 targeted by category deficit). Saves candidates to `data/events/` |
| **Curator** | Picks the best event from the pool of non-expired, unwritten events. Diversity-aware — avoids repeating categories |
| **Author** | Researches the chosen event (4 parallel queries), writes essays in en/de/ru with a self-critique loop (draft → critique → revision), generates a lede for each |
| **Reflector** | Analyzes its own articles over the past week — category distribution, venue concentration, blind spots, process statistics. Writes an editorial self-reflection |
| **Notifiers** | Sends the published article via Email (Resend, per-language segments) and Telegram |

All LLM outputs use Anthropic tool use (`tool_choice`) for structured responses. Retry with backoff on all external calls.

### Confidence markers

Articles include inline transparency annotations:

```
[~phrase|tooltip~]
```

2-5 per article. They signal both confidence (dense sourcing) and uncertainty (thin sourcing, pattern-based claims, knowledge boundaries). The tooltip is conversational and specific, not a legal disclaimer.

## Setup

```bash
git clone https://github.com/maksugr/syntsch.git
cd syntsch

python -m venv .venv
source .venv/bin/activate
pip install -e .

cp .env.example .env
# add your API keys to .env
```

### API keys

| Key | Required | Where to get |
|-----|----------|-------------|
| `ANTHROPIC_API_KEY` | yes | [console.anthropic.com](https://console.anthropic.com/) |
| `TAVILY_API_KEY` | yes | [tavily.com](https://tavily.com/) |
| `RESEND_API_KEY` | for email notifications | [resend.com](https://resend.com/) |
| `TELEGRAM_BOT_TOKEN` | for Telegram notifications | [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | for Telegram notifications | your channel/chat ID |
| `RESEND_SEGMENT_EN` / `_DE` / `_RU` | for email notifications | Resend audience segment IDs |

## Configuration

Edit `config.py`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `CITY` | `"Berlin"` | City to search events in |
| `DAYS_AHEAD` | `14` | How many days ahead to look |
| `SCOUT_MODEL` | `claude-sonnet-4-5-20250929` | LLM for event discovery |
| `CURATOR_MODEL` | `claude-sonnet-4-5-20250929` | LLM for event selection |
| `AUTHOR_MODEL` | `claude-opus-4-6` | LLM for article writing |
| `CRITIC_MODEL` | `claude-opus-4-6` | LLM for self-critique |
| `LEAD_MODEL` | `claude-opus-4-6` | LLM for lede generation |
| `CATEGORY_SOURCES` | per-category domains | Authoritative domains per category (RA, nachtkritik, artforum, etc.) |
| `GENERAL_SOURCES` | Berlin portals | General cultural portals (tip-berlin, exberliner, zitty, etc.) |

## CLI

All commands go through `cli.py`:

```bash
# find events and save to data/events/
python cli.py scout
python cli.py scout --city Berlin --days 14

# pick the best event from the pool
python cli.py curate

# write articles (curator picks the event)
python cli.py author --from-curator
python cli.py author --from-curator --language en de

# write articles for a specific event
python cli.py author --event-id 9a3f1c7e-...
python cli.py author --event examples/sample_event.json

# weekly self-reflection
python cli.py reflect
python cli.py reflect --days 7 --language en de ru

# full pipeline: scout → curate → author
python cli.py pipeline
python cli.py pipeline --city Berlin --language en de

# send notifications for published articles (used by CI after deploy)
python cli.py notify <slug1> <slug2>
python cli.py notify --wait --timeout 300 <slug>
```

Data is stored as JSON flat files in `data/events/`, `data/articles/`, and `data/reflections/`, tracked in git.

## GitHub Actions

Three scheduled workflows plus CI:

| Workflow | Schedule (UTC) | What it does |
|----------|---------------|-------------|
| `scout.yml` | Daily 17:00 | `scout --city Berlin --days 14` |
| `author.yml` | Daily 18:00 | `author --from-curator`, then `notify --wait` after push |
| `reflect.yml` | Sunday 20:00 | `reflect --days 7` |
| `ci.yml` | On push/PR | `ruff check`, `ruff format`, `pytest`, `next build` |

Each pipeline workflow commits its output to `data/` and pushes. Notifications (Telegram, email) are sent after push, once the deploy is live.

## Web

Static Next.js 16 site with brutalist design. Located in `web/`. See [`web/README.md`](web/README.md) for details.

**Stack:** Next.js 16, React 19, Tailwind v4, TypeScript

**Features:**
- SSG with i18n (en/de/ru)
- RSS feeds per language (`/{lang}/feed.xml`)
- Seed-based generative SVG art for each article
- Process trace — expandable view of draft → critique → revision
- Confidence markers rendered as interactive tooltips
- Email subscription (Resend integration)
- Reflections section with period stats
- About, Impressum, Privacy pages
- Sitemap, OpenGraph, hreflang

### Run locally

```bash
cd web
npm install
npm run dev
```

## Project structure

```
syntsch/
├── cli.py                 — CLI commands (scout, curate, author, reflect, pipeline)
├── config.py              — settings (city, models, sources)
├── models.py              — Pydantic data models
├── storage.py             — JSON file storage (events, articles, reflections)
├── utils.py               — shared utilities
├── agents/
│   ├── scout.py           — event discovery (9 parallel queries, tool use)
│   ├── curator.py         — event selection (diversity-aware)
│   ├── author.py          — article generation with self-critique loop
│   └── reflector.py       — weekly self-reflection on coverage
├── sources/
│   ├── base.py            — event source interface
│   ├── tavily_search.py   — Tavily web search (adaptive queries, source priorities)
│   └── research.py        — parallel web search for article context
├── notifiers/
│   ├── email.py           — Resend email notifications (per-language segments)
│   └── telegram.py        — Telegram channel notifications
├── prompts/
│   ├── author_system.md   — author system prompt
│   ├── critic_system.md   — self-critique prompt
│   └── reflector_system.md — reflector system prompt
├── web/                   — Next.js 16 static site
├── tests/                 — pytest test suite
├── examples/              — sample event JSONs
├── data/                  — JSON flat files (tracked in git)
│   ├── events/
│   ├── articles/
│   └── reflections/
└── .github/workflows/     — scheduled automation
```

## Architecture

### Search strategy

Scout runs 9 parallel Tavily queries:
- **3 core** — broad cultural event queries (en/de)
- **4 adaptive** — weighted random from 19 extra queries; weight = `1/(count[cat]+1)` so underrepresented categories surface more
- **2 targeted** — queries with `include_domains` for the 2 weakest categories in the pool

All queries use `search_depth="advanced"` and `include_raw_content="markdown"`.

### Structured output

All agents use Anthropic tool use with `tool_choice` for guaranteed structured responses:
- Scout → `submit_events` (array of event objects)
- Curator → `choose_event` (event ID + reasoning)
- Critic → `submit_critique` (assessment, issues, revised text)

### Self-critique loop

Author pipeline: draft (Opus) → critique (Opus, with event + research context for fact-checking) → revised text. If the essay is under 400 words, the critic requests expansion. Checks for AI tells, factual accuracy, voice, structure, and proper noun transliteration.

### Reliability

- Tavily: 3 retries with exponential backoff (1s, 2s)
- Anthropic SDK: `max_retries=3` on all clients
- Critic fallback: if the critic fails, the original draft is used
- `logging.getLogger(__name__)` in all modules

## Extending

### Add a new city

Change `CITY` in `config.py`. Search queries adapt automatically.

### Add a new event source

Create a class in `sources/` that implements `EventSource.fetch_events()`. Register it in `agents/scout.py`.

### Add a new language

Extend `LANGUAGE_NOTES` in `agents/author.py` and add translations in `web/lib/translations.ts`.

## License

[MIT](LICENSE)
