# Project Brief: SchemaLift

---

## Executive Summary

**SchemaLift** *(working name)* is a focused desktop application that connects to SQL databases, lets users select and annotate relevant tables, and exports a ready-to-paste LLM prompt block — replacing a slow, multi-step manual process with a single 30-second action.

**Problem:** Every time a developer or analyst needs LLM help with SQL, they spend 15–30 minutes manually extracting DDL definitions from their database client (DBeaver, DataGrip) and copying them into ChatGPT — before they can even ask the question.

**Target Market:** SQL-active developers and analysts who regularly use LLMs for data work — a SAM of ~4.8M users, with Pragmatic Developers as the Day 1 beachhead segment.

**Value Proposition:** The first tool purpose-built for LLM context prep — from database to prompt in 30 seconds. Not a DB client, not a coding assistant, but the missing layer between the two.

---

## Problem Statement

### The Current State

Every time a developer, analyst, or business user needs LLM assistance with SQL, they face the same friction before they can even ask their question:

1. Open DBeaver (or equivalent)
2. Locate each relevant table, one by one
3. Right-click → Generate DDL definition
4. Export DDL — one table at a time
5. Manually copy each DDL block into ChatGPT
6. Then — finally — write the actual question

For a schema of 5–10 tables, this takes **15–30 minutes of pure mechanical work** every single session.

### Impact of the Problem

- **Time lost:** 15–30 min of setup per LLM session, repeated daily by millions of SQL-active developers and analysts
- **Cognitive cost:** Context-switching between tools breaks flow; the prep work crowds out actual thinking
- **Scale-dependent pain:** The more complex the schema, the worse it gets — N tables = N manual operations, with no ceiling
- **Repeated pain:** Annotations and context built in one ChatGPT session don't persist — the extraction starts from zero next time

### Why Existing Solutions Fall Short

| Tool | Gap |
|---|---|
| DBeaver / DataGrip / TablePlus | Built pre-LLM — schema export is a side feature, not multi-select, and produces no LLM-ready output |
| GitHub Copilot / Cursor | LLM-first, but requires a codebase context — no standalone DB schema awareness |
| ChatGPT / Claude directly | Can interpret schema, but has no DB connection — the user must assemble and paste context manually |

No tool today owns the bridge between the database and the LLM conversation.

### Why Now

LLM adoption in developer and analyst workflows is accelerating rapidly (GitHub Copilot: 1.8M paid users; ~30% of developers use ChatGPT for coding tasks). The pain is being felt by an increasingly large and vocal group — but nobody has named the category or built the solution yet. The window to establish the space is **12–18 months** before adjacent tools add this as a feature.

---

## Proposed Solution

### Core Concept

A focused, fully local desktop application (Windows + Mac) that eliminates the schema-assembly bottleneck by doing one thing exceptionally well: turning a multi-table database selection into a ready-to-paste LLM prompt block in a single action.

### The Core Workflow

```
Connect → Browse → Select Tables → Annotate (optional) → Generate Prompt Block → Copy
```

1. **Connect** — enter DB credentials (PostgreSQL, MySQL, MSSQL, SQLite) — credentials stay local, never leave the machine
2. **Browse** — see all tables in the schema; search/filter by name
3. **Select** — checkbox multi-select of the tables you actually need (not all 200 — just the 5 that matter)
4. **Annotate** — optionally add free-text notes per table or column to give the LLM business context ("this table tracks soft-deleted users")
5. **Generate** — one-click export: all selected DDL definitions + annotations bundled into a clean, structured prompt block
6. **Copy** — single copy-to-clipboard action; paste directly into ChatGPT, Claude, or any LLM

### Key Differentiators

- **Purpose-built for LLM context prep** — not a DB client, not a coding assistant; a context assembler
- **Multi-table, one-shot export** — replaces N manual steps with a single action regardless of how many tables you need
- **Persistent annotations** — notes survive across sessions, so context compounds over time rather than starting from zero
- **Fully local/offline** — DB credentials and schema data never leave the machine; privacy-safe by design
- **30-second onboarding target** — connect and see results before the user has time to doubt the tool

### Why This Will Succeed

- No direct competitors own this exact positioning today
- The pain is universal, daily, and immediately recognizable — no education required to sell it
- The annotation layer creates compounding value and switching costs that a simple copy-paste feature cannot replicate
- Fully local architecture removes the single biggest adoption blocker (privacy/security concerns with cloud tools)

---

## Target Users

### Primary User Segment: The Pragmatic Developer

**Profile:**
- Mid-to-senior backend or fullstack developer
- Works with SQL daily; schemas of 20–200+ tables are normal
- Already uses ChatGPT or Claude for coding help — LLM-native workflow
- Current tools: DBeaver, DataGrip, or TablePlus

**Current Behavior:**
- Manually extracts DDL from their DB client 3–5x per week
- Wastes 15–30 min per LLM session on schema assembly before asking the real question
- Re-exports the same tables repeatedly because context doesn't persist between sessions

**Specific Pain Points:**
- The manual process scales with schema complexity — more tables = more pain
- Context built in one ChatGPT session is lost; next session starts from zero
- Switching between DBeaver and ChatGPT breaks flow and interrupts deep work

**Goals:**
- Get to the actual LLM conversation faster — make the prep invisible
- Build a persistent schema context library that compounds over time
- Look like the engineer with the most efficient AI workflow on the team

**Why they're the beachhead:**
- Experience the pain daily and most acutely
- Discover and adopt developer tools quickly (Reddit, HN, dev blogs)
- Low price sensitivity for tools that genuinely save time
- Generate organic word-of-mouth when a colleague complains about the same DBeaver friction

---

### Secondary User Segment: The Data Analyst / BI User

**Profile:**
- Works in SQL but isn't a software engineer — primary job is reporting and ad-hoc queries
- Comfortable with SELECT but struggles with complex joins across unfamiliar schemas
- Tools: DBeaver, SSMS, Metabase; LLM usage growing but not yet daily

**Current Behavior:**
- Asks a developer for schema context before they can begin an LLM conversation
- Works with legacy databases that are poorly documented — schema is a black box
- Employer-sponsored purchasing is common; often needs manager sign-off

**Specific Pain Points:**
- Can't explain undocumented legacy schemas to an LLM without developer help
- Blocked from self-serving data insights by schema opacity
- Persistent annotations would save them from re-asking the same questions repeatedly

**Goals:**
- Get data answers independently without bothering engineering
- Understand the schema well enough to have a productive LLM conversation
- Frame requests in "saves X hours per week" terms for manager approval

---

## Goals & Success Metrics

### Business Objectives

- **Validate product-market fit within 90 days of launch** — reach 500 active free-tier users as proof of organic demand
- **Achieve $5K MRR within 6 months of launch** — ~500 paid users at $9–12/month, representing 0.1% SAM conversion
- **Reach $15K MRR within 12 months** — ~1,500 paid users; signals sustainable indie product trajectory
- **Establish category ownership within 12–18 months** — become the first result for "chatgpt sql schema tool" and equivalent searches before adjacent players respond
- **Maintain 80%+ monthly retention on paid tier** — annotation layer stickiness is the core retention thesis; this metric validates it

### User Success Metrics

- **Time-to-first-prompt under 2 minutes** — user connects, selects tables, and has a copyable prompt block within 2 min of opening the app for the first time
- **Schema assembly time reduced by 90%+** — from 15–30 min manual process to under 2 min per session
- **Return usage within 7 days** — user comes back for a second session, indicating the tool fits into their real workflow
- **Annotation adoption rate ≥ 30%** — at least 30% of active users add at least one annotation within their first week; validates that the moat feature is actually used
- **NPS ≥ 50** — developer tools with strong PMF typically score here; target for first 200 users surveyed

### Key Performance Indicators (KPIs)

- **Weekly Active Users (WAU):** Users who generate at least one prompt block per week — primary engagement signal
- **Free-to-Paid Conversion Rate:** Target 8–12%; validated by TablePlus and similar indie dev tool benchmarks
- **Prompt Blocks Generated per User per Week:** Measures depth of usage; target ≥ 3 for active users
- **Churn Rate (monthly):** Target ≤ 5% for paid tier; annotation stickiness is the primary churn mitigation
- **Onboarding Completion Rate:** % of new users who complete a full connect → select → copy flow; target ≥ 70% on day 1
- **Organic Acquisition %:** Share of new signups from community posts, word-of-mouth, SEO — target ≥ 60% to validate low-CAC go-to-market thesis

---

## MVP Scope

### Core Features (Must Have)

- **Multi-database connection:** Connect to PostgreSQL, MySQL, MSSQL, and SQLite via standard credentials — stored locally, never transmitted
- **Schema browser:** Tree view of all tables and columns in the connected database; searchable/filterable by name
- **Multi-table checkbox select:** Select any combination of tables in a single action — no one-at-a-time export
- **One-click DDL bundle export:** Generate a single, clean block containing all selected tables' DDL definitions formatted for LLM readability
- **Per-table annotations:** Free-text notes per table (and optionally per column) that persist across sessions in local storage
- **Prompt block assembler:** Combines selected DDL + annotations + optional user-typed natural language question into a single copy-to-clipboard output
- **Copy to clipboard:** Single action to copy the full prompt block, ready to paste into any LLM interface
- **Saved connections:** Remember DB connection credentials locally so users don't re-enter them each session

### Out of Scope for MVP

- Team sharing or cloud sync of annotations or schema bundles
- Non-SQL databases (MongoDB, Redis, DynamoDB, etc.)
- Natural language table auto-selection ("find the tables relevant to orders")
- Built-in LLM integration (direct API calls to ChatGPT/Claude from within the app)
- Query execution or result display inside the app
- Schema diff or version history
- Export formats beyond plain text (PDF, Notion, Confluence, etc.)
- User accounts, login, or authentication system
- Mobile or web version

### MVP Success Criteria

The MVP is successful when a Pragmatic Developer can:

1. Download and install the app on Windows or Mac
2. Connect to a live PostgreSQL, MySQL, MSSQL, or SQLite database
3. Browse the schema, select 3–10 tables, and add at least one annotation
4. Generate and copy a complete, LLM-ready prompt block
5. Complete the entire flow — from cold open to clipboard — in under 2 minutes

**And at the product level:**
- 500+ active free-tier users within 90 days of launch
- 8%+ free-to-paid conversion on users who complete at least 3 sessions
- Zero reported data-leaving-the-machine incidents (fully local architecture must hold)

---

## Post-MVP Vision

### Phase 2 Features

- **Schema bundle saving & management** — save named bundles of table selections (e.g., "Order Flow Tables", "User Auth Schema") that can be recalled instantly across sessions; eliminates re-selection for recurring LLM workflows
- **Column-level annotations** — extend annotations from table-level to individual columns; critical for legacy schemas where column names are cryptic (e.g., `usr_flg_2`, `amt_cd_x`)
- **Multiple saved connections dashboard** — manage and switch between multiple databases from a single home screen; important for developers working across several projects or environments (dev/staging/prod)
- **Prompt template library** — save and reuse prompt structures combined with schema bundles for one-click recurring queries
- **Export format options** — Markdown, JSON, plain DDL, or simplified schema (column names + types only, no constraints) to match different LLM preferences and user needs
- **Data Analyst / BI UX polish** — simplified table browser with plain-language column descriptions; reduces dependency on SQL knowledge to operate the tool effectively

### Long-term Vision (1–2 Years)

A desktop tool that functions as a **persistent schema intelligence layer** for every LLM conversation a developer or analyst has about their database — not a one-time export utility, but a living context library that compounds in value the more it's used.

By year 2, the annotation layer becomes a team asset: shared schema knowledge, business context embedded in the tool, and institutional understanding that doesn't live in a single developer's head or a ChatGPT conversation that expires. The product evolves from a personal productivity tool into a lightweight team knowledge base for database context.

**North star metric at year 2:** Average annotated tables per active user ≥ 20 — indicating that users are investing in the tool as a long-term context library, not just a one-off export utility.

### Expansion Opportunities

- **Team & Enterprise tier** — shared annotated schema bundles across engineering and data teams; $25–40/seat/month; unlocks B2B sales motion and significantly higher ARR ceiling
- **Non-Technical User Mode** — simplified interface where users describe what they're looking for in plain English and the app suggests relevant tables
- **DBeaver / DataGrip plugin** — meet developers inside their existing tools rather than asking them to switch; reduces adoption friction
- **Raycast extension** — quick-launch schema bundle selection from the macOS command palette; targets power-user developer segment
- **LLM integration (opt-in)** — direct API connection to ChatGPT or Claude from within the app for users who opt in; keeps it optional to preserve the privacy-safe positioning

---

## Technical Considerations

### Platform Requirements

- **Target Platforms:** Windows 10+ and macOS 12+ (Monterey and later); Linux as a stretch goal post-MVP
- **Browser/OS Support:** Native desktop app — no browser dependency; offline-first, no internet connection required for core functionality
- **Performance Requirements:** Schema load time under 3 seconds for databases up to 500 tables; prompt block generation under 1 second; app cold start under 4 seconds

### Technology Preferences

- **Frontend:** Electron or Tauri — Electron has the larger ecosystem and easier cross-platform packaging; Tauri is lighter and more performant but has a steeper Rust learning curve. Recommend **Tauri + React** if the team has Rust comfort, otherwise **Electron + React**
- **Backend (local):** Rust (via Tauri) or Node.js (via Electron) for DB connection handling, DDL extraction, and local file I/O
- **Database:** SQLite for local annotation and connection storage — no external database dependency, fully embedded, zero setup for the user
- **Hosting/Infrastructure:** None required for MVP — fully local app; distribution via direct download (GitHub Releases or a simple landing page) and eventually Mac App Store / Windows Store

### Architecture Considerations

- **Repository Structure:** Monorepo — single repo containing desktop app shell, DB connector layer, and UI
- **Service Architecture:** Single-process local app — no server, no API, no cloud dependency at MVP; DB connections are made directly from the desktop client to the user's database
- **Integration Requirements:**
  - SQL driver support: `pg` (PostgreSQL), `mysql2` (MySQL), `mssql` (MSSQL), `better-sqlite3` (SQLite)
  - Clipboard API: OS-native via Electron/Tauri built-ins
  - Local storage: SQLite file in user's app data directory for annotations and saved connections
- **Security/Compliance:**
  - DB credentials stored in OS keychain (not plaintext config files) — non-negotiable for the privacy-safe positioning
  - No telemetry or analytics by default at MVP; opt-in only if added later
  - Schema data and annotations never leave the machine in v1 — architecture must enforce this, not just policy

---

## Constraints & Assumptions

### Constraints

- **Budget:** Indie/small-team context; fully local architecture keeps ongoing costs near zero at MVP; primary cost is developer time
- **Timeline:** Target MVP launch within 12–18 months of project start to capture the category window before adjacent tools respond
- **Resources:** Assumed 1–2 person team; scope has been sized accordingly — no features that require dedicated backend infrastructure or a separate ops function
- **Technical:** SQL databases only (no NoSQL); no cloud sync or user accounts at MVP; app must function fully offline; DB credential security via OS keychain is a hard constraint

### Key Assumptions

- Pragmatic Developers will discover the tool organically through developer communities (Reddit, HackerNews) without significant paid acquisition spend
- Users are willing to grant a desktop app direct access to their database credentials if the local-only architecture is clearly communicated
- The 15–30 min manual schema assembly pain is felt frequently enough (3–5x per week per active user) to justify a paid subscription
- Free-to-paid conversion will follow indie developer tool benchmarks (8–12%) given the immediate, tangible time savings
- PostgreSQL, MySQL, MSSQL, and SQLite cover 80%+ of the target segment's day-to-day databases at launch
- The annotation layer will drive retention — users who invest in annotations will not churn; **this assumption carries the most strategic weight and is currently unvalidated by primary research**

---

## Risks & Open Questions

### Key Risks

- **LLM providers build native DB connectors** — OpenAI or Anthropic add direct database connectivity within 2–4 years, reducing the standalone tool's core value; *Impact: existential if annotation layer hasn't been established as the moat by then*
- **Adjacent tools copy the feature** — DBeaver, DataGrip, or TablePlus add a "copy schema for LLM" feature as a minor update; *Impact: high if it happens within 12 months; lower after brand and community are established*
- **Annotation adoption is lower than expected** — users treat the tool as a pure export utility and don't invest in annotations; *Impact: churn rate rises, long-term retention thesis fails*
- **Privacy perception barrier** — developers are reluctant to connect a third-party app to production databases even with local-only architecture; *Impact: slows adoption, especially in enterprise-adjacent teams*
- **Schema complexity edge cases** — very large schemas (1,000+ tables, complex views, stored procedures) degrade performance or produce unwieldy prompt blocks; *Impact: alienates power users with the most acute pain*

### Open Questions

- Which desktop framework — Tauri or Electron? Decision should be made before any UI work begins
- What is the exact output format for the prompt block? Raw DDL only? Simplified schema? Mixed? Needs user testing
- Should the natural language question be typed inside the app or just in the LLM interface?
- What does the free tier gate on — number of databases, number of tables per export, or absence of annotation persistence?
- Is there a meaningful market in the EU/regulated industries where even local DB tool installs require IT approval?
- How does the app handle database schemas with sensitive column names — should it warn users before copying PII-adjacent schema data to clipboard?

### Areas Needing Further Research

- Primary user interviews with 5–10 Pragmatic Developers to validate the 15–30 min pain estimate and willingness to pay
- Annotation adoption patterns — do developers annotate proactively or only after pain with an undocumented schema?
- Competitive monitoring — track DBeaver, DataGrip, and Cursor roadmaps for any LLM schema export features
- Freemium gate testing — which limit drives the highest free-to-paid conversion without alienating free users

---

## Next Steps

### Immediate Actions

1. Decide on desktop framework (Tauri vs Electron) — align team on language/tooling before any code is written
2. Conduct 5–10 user interviews with Pragmatic Developers to validate pain intensity, annotation interest, and willingness to pay
3. Build a clickable prototype of the core flow (connect → select → copy) to test onboarding completion rate before full development
4. Set up competitive monitoring alerts for DBeaver, DataGrip, Cursor, and TablePlus roadmap announcements
5. Draft landing page copy using the "from database to LLM prompt in 30 seconds" positioning to begin organic SEO and community signal testing

### PM Handoff

This Project Brief provides the full context for SchemaLift. Please start in 'PRD Generation Mode', review the brief thoroughly to work with the user to create the PRD section by section as the template indicates, asking for any necessary clarification or suggesting improvements.
