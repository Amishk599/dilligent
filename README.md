# Dilligent

An AI VC analyst that runs real diligence, not a chatbot guessing from memory. Built for the You.com Agentic Hackathon (Deep Research track).

Give Dilligent a company name, website, and founders. It runs three research agents in parallel (market, team, competitive position), scores each against a configurable investment thesis, and returns a citation-backed memo in under a minute.

## Why

Early-stage diligence is slow and generic AI research tools make it worse: they assert things confidently with no source to check. Dilligent is built around two ideas instead:

- **Every claim is sourced.** Nothing in the memo comes from the model's own knowledge. Each research leg calls the You.com Research API, and every sentence carries a citation that resolves to a real source, a snippet, and a plain-language summary.
- **The verdict is relative to your thesis, not universal.** The same company can be a Strong Fit for one fund and a Pass for another. Stage, sector, check size, and risk appetite change the scoring weights and thresholds, so the recommendation reflects the fund's actual criteria.

## How it works

1. **Input** - company name, website, and founders (with auto-discovery: Dilligent can suggest founder names from public sources, which you confirm or edit).
2. **Thesis config** - stage, sector, check size, and risk appetite. This sets the scoring lens for everything downstream.
3. **Three research legs, run in parallel:**
   - Market: size, growth trends, tailwinds and headwinds
   - Founders: public professional background, past companies, domain experience
   - Competitive landscape: direct competitors, differentiation, moat signals
4. **Synthesis** - each leg gets a 0-100 score, weighted by stage into a composite score, mapped to a recommendation (Strong Fit / Fit with Reservations / Pass) using thresholds tuned to the chosen risk appetite. A Risks & Open Questions section is generated alongside it.
5. **History** - every run is saved automatically so past memos can be revisited later.

## You.com APIs

- **Research API** (`research_effort: standard`, with a structured `output_schema`) powers the Market and Competitive legs, returning structured JSON instead of raw markdown to parse.
- **Search API** powers founder discovery and surfaces candidate sources quickly in the UI while the slower Research call is still synthesizing.
- A lightweight Research API call also crunches citation snippets into plain-language summaries, so a source can be understood without leaving the memo.

## What's out of scope

Dilligent doesn't present the recommendation as objective fact and doesn't use non-public information about founders. These are deliberate boundaries.

## Future enhancements

Right now all three research legs run on public sources only. A natural next step is a fourth input path: pitch decks and company-provided numbers (revenue, growth rate, burn, cap table) that aren't publicly available. Feeding those into the scoring model alongside the public research legs would let Dilligent move from qualitative thesis-fit to real financial modeling and valuation benchmarking.

## Stack

Next.js (TypeScript) full-stack app, deployed on Vercel. Research legs stream progress to the client over Server-Sent Events, so each dimension appears as soon as its own research resolves rather than waiting on the slowest leg. Run history is stored in the browser (localStorage), no backend database.

## Getting started

```bash
npm install
cp .env.example .env.local   # add your YDC_API_KEY (from you.com/platform)
npm run dev
```
