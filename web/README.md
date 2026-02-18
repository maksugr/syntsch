# Syntsch Web

Static frontend for [syntsch.de](https://syntsch.de). Built with Next.js 16, React 19, Tailwind v4, TypeScript.

For general project information, see the [root README](../README.md).

## Stack

- **Next.js 16** — App Router, SSG (`output: "export"`)
- **React 19** — Server Components + Client Components where needed
- **Tailwind v4** — utility-first styling
- **TypeScript 5**
- **Vercel Analytics + Speed Insights**

## Run locally

```bash
cp .env.sample .env.local
# add your Resend keys if you need the subscribe endpoint

npm install
npm run dev
```

Build:

```bash
npm run build
```

The site reads data from `../data/` (articles, events, reflections as JSON flat files).

## Structure

```
web/
├── app/
│   ├── layout.tsx                — root layout, fonts, analytics
│   ├── page.tsx                  — redirects / to /[lang]/
│   ├── sitemap.ts                — generated sitemap
│   ├── robots.ts                 — robots.txt
│   ├── not-found.tsx             — 404
│   ├── [lang]/                   — i18n routing (en, de, ru)
│   │   ├── page.tsx              — article feed
│   │   ├── article/[slug]/       — single article
│   │   ├── reflections/          — reflections list + single
│   │   ├── about/                — about page
│   │   ├── impressum/            — legal
│   │   ├── privacy/              — privacy policy
│   │   └── feed.xml/route.ts     — RSS feed
│   └── api/
│       └── subscribe/route.ts    — email subscription endpoint
├── components/
│   ├── ArticleFeed.tsx           — main feed with category filter
│   ├── ArticleCard.tsx           — article card (featured/normal)
│   ├── ArticleBody.tsx           — article text with marker rendering
│   ├── ArticleHero.tsx           — hero section
│   ├── ProcessTrace.tsx          — draft → critique → revision trace
│   ├── GenerativeArt.tsx         — seed-based procedural SVG
│   ├── ConfidenceMarker.tsx      — [~phrase|tooltip~] rendering
│   ├── SubscribeForm.tsx         — email subscription with validation
│   ├── EventSidebar.tsx          — event metadata (date, venue, link)
│   ├── LanguageProvider.tsx      — i18n context + font switching
│   ├── Header.tsx, Footer.tsx    — layout
│   └── ...                       — category tags, reflections, legal pages
└── lib/
    ├── db.ts                     — reads JSON from ../data/
    ├── types.ts                  — TypeScript interfaces
    ├── translations.ts           — UI strings (en/de/ru)
    └── i18n.ts                   — language config
```

## Key features

**i18n** — language-based routing (`/en/`, `/de/`, `/ru/`), cookie persistence, font switching (Bebas Neue for en/de, Russo One for ru).

**RSS** — per-language feeds at `/{lang}/feed.xml`. Last 50 articles, RSS 2.0 with Atom namespace.

**Generative art** — seed-based SVG generation using article slug as seed. Circles, lines, polygons, arcs, dots. Same seed always produces the same art.

**Process trace** — expandable section on each article showing draft word count, critique issues (by type and severity), revision changes, research source count.

**Confidence markers** — `[~phrase|tooltip~]` syntax rendered as interactive tooltips. Signals sourcing density and knowledge boundaries.

**Subscribe** — inline card in feed + footer form. Honeypot field, rate limiting, Resend API integration with language-based audience segments.

## License

[MIT](../LICENSE)
