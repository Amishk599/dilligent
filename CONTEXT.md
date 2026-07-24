# Dilligent — Session Context (setup phase)

Captured 2026-07-24 to hand off into a fresh planning session. This file is a snapshot, not a living doc — fold it into real docs once planning starts.

## Project

**Dilligent** — an AI VC analyst / deep-research investment memo generator, built for the **You.com Agentic Hackathon (Deep Research track)**. Given a startup's name, website, and founders, it runs multi-source research via You.com's Search + Research APIs and produces a structured, citation-backed investment memo scored against a configurable investment thesis.

Must showcase real synthesis with citations from You.com's APIs — not an LLM chatting from its own knowledge.

## Core scope (build in this order)

1. **Input screen** — company name, company website URL, founder name(s) comma-separated. Text inputs only, no file/deck upload.
2. **Investment thesis config** (sets the scoring lens) — Stage (Pre-seed/Seed/Series A), Sector (Fintech/AI-Dev-Tools/Consumer/Healthcare/Other), Check size (dropdown or slider), Risk appetite (Conservative/Balanced/Aggressive).
3. **Research legs**:
   - Market: size, growth trends, tailwinds/headwinds → Research API
   - Founders: public professional background, past companies/exits, domain experience → Search API (public/professional info only)
   - Competitive landscape: direct competitors, differentiation, moat signals → Research API
4. **Synthesis / scoring**:
   - Weighted score per thesis dimension (Market Fit, Team Strength, Competitive Position) → composite score /100
   - Written memo per section in the model's own words, inline citations to sources
   - Explicit "Risks & Open Questions" section
   - Overall recommendation label (Strong Fit / Fit with Reservations / Pass) — always framed relative to the configured thesis, never as an absolute/universal verdict
5. **UI**:
   - Input/config screen, branded "Dilligent"
   - Loading state that visibly shows each research leg running — this is the key demo moment, don't skip it
   - Output styled as a real investment memo: score header, thesis-fit breakdown, expandable evidence-backed sections, citations, risks callout

## Stretch goals (only after core works end-to-end)

- Pitch deck (PDF/PPTX) upload as alt input
- Financial Research API leg for public-market comps/benchmarking
- Bull-case vs. bear-case agent debate feeding synthesis
- Export memo as shareable PDF
- Side-by-side comparison of two startups

## Explicitly out of scope for this build

- Real financial modeling or valuation math
- Presenting the recommendation as objective fact rather than thesis-relative
- Non-public personal info about founders
- Deck/slide parsing (today)

## Demo target

Single confident live demo: type in a real, well-known company, watch research legs run, get a clean memo back in **under a minute**.

---

## You.com API reference (verified against live docs 2026-07-24)

### Auth
- Header: `X-API-Key: $YDC_API_KEY`
- Env var convention: `YDC_API_KEY`
- Get key + $100 free credits: https://you.com/platform (via https://you.com/platform/api-keys)
- Python SDK: `You(api_key_auth=os.environ["YDC_API_KEY"])`
- TS SDK: `new You({ apiKeyAuth: process.env.YDC_API_KEY })`

### Web Search API
- `GET https://ydc-index.io/v1/search` (also accepts POST for complex params)
- Params: `query` (required), `count` (default 10), `freshness` (`day`/`week`/`month`/`year`/date range), `offset`, `country`, `language` (BCP 47), `safesearch`, `livecrawl` (`web`/`news`/`all`, returns full page content), `livecrawl_formats` (`html`/`markdown`), `include_domains`/`exclude_domains`/`boost_domains` (max 500, include is mutually exclusive with exclude/boost), `crawl_timeout` (1–60s)
- Response: `results.web[]` (`url`, `title`, `description`, `snippets[]`, `thumbnail_url`, `favicon_url`, `page_age`, `contents.{html,markdown}` if livecrawl on), `results.news[]` (similar), `metadata` (`search_uuid`, `query`, `latency`)
- Rate limits not documented; livecrawl priced separately ($1/1000 pages + $5/1000 base calls)
- **Use for**: founder background lookups (light, fast)

### Research API
- `POST https://api.you.com/v1/research`
- Params: `input` (required, question, max 40,000 chars), `research_effort` (`lite`/`standard` [default]/`deep`/`exhaustive`/`frontier`), `background` (bool, required `true` for `frontier`), `output_schema` (JSON Schema object for structured results — max depth 5, max 100 properties, max 500 enum values, 25,000-char schema budget; supported on `standard`/`deep`/`exhaustive`/`frontier`, **not** `lite`), `source_control` (`include_domains`/`exclude_domains`/`boost_domains` up to 500, `freshness`, `country`)
- `frontier`: 30s–12000s latency (p50 300s), must run async via `background: true`
- Sync response: `{ output: { content, content_type, sources: [{url, title, snippets[]}] }, warnings: [] }`
- Citations: markdown `content` has numbered `[[1]]` markers indexing into `sources[]`. **Unconfirmed**: exact citation shape when `output_schema` is used instead of markdown — need to smoke-test with a real key before locking the synthesis/citation data model.
- Async response: `{ task_id, type, status: "queued", stream_url, created_at }` → poll `GET /v1/research/{task_id}` or stream `GET /v1/research/{task_id}/stream`
- Status codes: 200 / 401 unauthorized / 403 forbidden / 422 validation (schema limits, param conflicts) / 500
- **Use for**: Market leg, Competitive landscape leg. Prefer `output_schema` for structured JSON over parsing markdown, per task instructions. `standard` or `deep` effort fits the "under a minute" demo constraint — avoid `exhaustive`/`frontier` for the live demo path.

### Finance Research API
- `POST https://api.you.com/v1/finance_research`
- Params: `input` (required, max 40,000 chars), `research_effort` (`deep` [default] or `exhaustive`)
- Response shape matches Research API: `output.{content, content_type, sources[]}`
- **Use for**: stretch goal only (public-market comps/benchmarking)

### MCP Server
- Remote HTTP: `https://api.you.com/mcp`
- Free profile (no auth, 100 queries/day, search only): `https://api.you.com/mcp?profile=free`
- Tools: `you-search` (free tier ✓), `you-contents`, `you-research`, `you-finance`, `you-discover`, `you-balance` (all require API key)
- Claude Code setup with key: `claude mcp add --transport http ydc-server https://api.you.com/mcp --header "Authorization: Bearer <YDC_API_KEY>"`
- OAuth 2.1 alternative: omit the Authorization header, client handles the flow

### youdotcom-oss/agent-skills (github.com/youdotcom-oss/agent-skills)
- Installable Claude Code skills wrapping these same APIs with routing logic: `you-web`, `you-free`, `you-research`, `you-finance`, `you-discover`
- Install: `npx skills add youdotcom-oss/agent-skills` (or `--skill you-web` etc. for one)
- Requires `YDC_API_KEY` env var
- Worth evaluating during implementation as a shortcut vs. hand-rolling API calls — not yet decided.

---

## Workspace state (as of this session)

- `/Users/amish/Workspace/personal/dilligent/` initialized as its **own** git repo (not part of the parent `personal/` folder, which is an unrelated, uncommitted monorepo of many sibling projects — deliberately kept separate)
- No commits made yet
- Files created: `.gitignore` (node_modules, .env, build artifacts, etc.), `.env.example` (`YDC_API_KEY=`), `README.md` (one-paragraph stub), this `CONTEXT.md`
- MCP server registered in this project's Claude Code config: `you-free` → `https://api.you.com/mcp?profile=free`, confirmed ✔ Connected via `claude mcp list`
- No `YDC_API_KEY` obtained/wired in yet — needed to test Research/Finance APIs and the paid MCP tools

## Open items before/during planning

1. **Get a `YDC_API_KEY`** from https://you.com/platform (new accounts start with $100 free credit) and smoke-test a real Research API call with `output_schema` to confirm the structured-output citation shape before locking the synthesis data model.
2. **Tech stack not yet decided** — no framework chosen. Given single-session build + live demo requirement, likely candidates: Next.js (TS) full-stack for one deploy, or a lighter React frontend + minimal backend. To be decided in planning.
3. **Decide on agent-skills package vs. direct API calls** for implementation.
4. Confirm exact structured-output citation format for `output_schema` results (see above).
5. Design the `output_schema` JSON Schemas for the Market leg and Competitive landscape leg research calls.
6. Design the weighted scoring model (dimensions, weights per thesis stage/sector/risk-appetite combination).
