# Market Research Report: SQL Schema Extractor + LLM Prompt Builder

---

## Executive Summary

A clear whitespace exists at the intersection of SQL database tooling and LLM-assisted workflows. No tool today lets users select multiple database tables, annotate them with business context, and export a ready-to-paste LLM prompt block — forcing developers and analysts into a slow, repetitive manual process every time they need schema context for ChatGPT or similar tools.

**Market Size:** The SAM is ~4.8M SQL-active users who use LLMs and prefer desktop tools. A realistic 3-year SOM of 5,000–24,000 paying users at $9–12/month represents $540K–$3.5M ARR — achievable for an indie or small-team product.

**Customer:** Three segments exist, with the Pragmatic Developer as the beachhead. They experience the pain daily, adopt tools quickly, have low price sensitivity, and generate organic word-of-mouth. Non-technical business users represent a larger long-term opportunity but require a simpler UX that should follow, not lead, the MVP.

**Competitive Landscape:** No direct competitors. Indirect competition from DBeaver, DataGrip, and TablePlus (DB clients with no LLM focus) and from GitHub Copilot/Cursor (LLM tools with no DB schema awareness). The window to establish the category is 12–18 months before adjacent players add this as a feature.

**Strategic Recommendation:** Build a focused, fully local desktop app (Windows + Mac) with a strict MVP scope: connect → browse → select tables → annotate → export prompt block → copy. Launch via developer communities with a freemium model at $9–12/month paid tier. Invest early in the annotation/persistent context layer — this is the long-term moat that export-alone cannot provide.

**Key Risk:** LLM providers building native DB connectors within 2–4 years. Mitigation: establish brand and build retention through the annotation layer before substitution becomes viable.

---

## 1. Research Objectives & Methodology

### 1.1 Research Objectives

**Primary Objectives:**

- **Decision to inform:** Whether to build and how to position a desktop tool that automates SQL schema extraction and LLM prompt assembly for developers and non-technical users.
- **Questions to answer:**
  1. How large is the market of developers and analysts who regularly use LLMs for SQL/data work?
  2. Who are the existing competitors or adjacent tools?
  3. What are users willing to pay for this kind of desktop utility?
  4. Which SQL databases should be prioritized for day-one support?
  5. Is the pain broad enough to justify a standalone product?
- **Success criteria:** Enough evidence to decide on build vs. no-build, target segment, and initial pricing model.

### 1.2 Research Methodology

- **Data sources (secondary):** Stack Overflow Developer Survey, JetBrains Developer Ecosystem Report, GitHub Copilot usage stats, product pages and pricing of adjacent tools, community signals from Reddit, HackerNews, and Dev.to
- **Analysis frameworks:** TAM/SAM/SOM, Porter's Five Forces, Jobs-to-be-Done, PESTEL
- **Data collection timeframe:** May 2026
- **Limitations & assumptions:**
  - No primary user interviews conducted — this is a pre-build research phase
  - Market data for "LLM prompt tooling" is emerging and may lack mature analyst coverage
  - Willingness-to-pay estimates are directional, not validated

---

## 2. Market Overview

### 2.1 Market Definition

- **Product/service category:** Developer productivity software — the intersection of database tooling and AI-assisted workflows
- **Geographic scope:** Global (English-speaking markets as primary)
- **Customer segments:** Software developers, data analysts/BI professionals, non-technical business users
- **Value chain position:** Sits between the database client layer (DBeaver, DataGrip) and the LLM interface (ChatGPT, Claude) — a context-assembly middleware for humans

### 2.2 Market Size & Growth

#### Total Addressable Market (TAM)

- ~27M professional developers worldwide × 60% SQL-active = **16.2M SQL-active developers**
- + ~8M data analysts and BI users = **~24M potential users**
- At $5/month average: **~$1.45B TAM**

#### Serviceable Addressable Market (SAM)

- 24M × 40% LLM-open = 9.6M
- 9.6M × 50% desktop preference = **~4.8M SAM users**
- At $5/month: **~$290M SAM**

#### Serviceable Obtainable Market (SOM)

- 0.1–0.5% of SAM capture over 3 years = **5,000–24,000 paying users**
- At $9–12/month: **$540K–$3.5M ARR**

### 2.3 Market Trends & Drivers

#### Key Market Trends

1. **LLM adoption in developer workflows is accelerating** — GitHub Copilot surpassed 1.8M paid users in 2024; ~30% of developers now use ChatGPT for coding tasks.
2. **The "context problem" is a known pain point** — Output quality depends on input quality; schema context is the missing layer and no tool owns this space yet.
3. **Database tooling is fragmented and legacy** — DBeaver, DataGrip, and TablePlus were all built pre-LLM with no native prompt export features.
4. **Desktop apps are regaining credibility** — Tools like Warp, Raycast, and TablePlus show developers pay for polished native experiences, especially for data-sensitive workflows.
5. **Non-technical users are being pushed into SQL workflows** — Low-code/no-code growth means more business users touch databases and need LLM assistance.

#### Growth Drivers

- Explosive LLM adoption across developer and analyst personas
- Rising schema complexity in modern microservices architectures
- Privacy concerns driving preference for local/desktop tools
- Increasing pressure on non-technical users to self-serve data insights

#### Market Inhibitors

- LLM providers could build native database connectors, reducing need for a standalone tool
- IDE-integrated solutions (Copilot, Cursor) expanding scope could absorb this use case
- Free/open-source alternatives could cap willingness to pay
- Low market awareness — users haven't named this pain yet, making acquisition harder

---

## 3. Customer Analysis

### 3.1 Target Segment Profiles

#### Segment 1: The Pragmatic Developer

- **Description:** Backend/fullstack developer who works with SQL daily and already uses ChatGPT for code help
- **Size:** ~2.5M (SAM subset, early LLM adopters)
- **Characteristics:** Mid-to-senior engineer, uses DBeaver or DataGrip, deals with schemas of 20–200+ tables
- **Needs & Pain Points:** Wastes 15–30 min per LLM session assembling schema context; frustrated by re-exporting the same tables repeatedly
- **Buying Process:** Discovers via developer communities, tries free tier, converts after first successful LLM query
- **Willingness to Pay:** $5–$15/month or $40–$80 one-time; expects free tier or trial

#### Segment 2: The Data Analyst / BI User

- **Description:** Works in SQL but isn't a software engineer; primary job is reporting and ad-hoc queries
- **Size:** ~1.2M (SQL-active analysts open to LLM tools)
- **Characteristics:** Uses DBeaver, SSMS, or Metabase; comfortable with SELECT but struggles with complex joins
- **Needs & Pain Points:** Can't explain undocumented legacy schemas to LLMs efficiently; needs help writing complex queries
- **Buying Process:** May need manager approval; responds to "saves X hours per week" framing
- **Willingness to Pay:** $5–$10/month; employer-sponsored purchase more likely

#### Segment 3: The Non-Technical Business User

- **Description:** Operations, finance, or product person with DB access but no SQL training
- **Size:** ~800K (growing fast)
- **Characteristics:** Schema is a black box; asks ChatGPT to write all their SQL; current workaround is asking a developer for the schema
- **Needs & Pain Points:** Doesn't know which tables exist or what they contain; can't begin an LLM conversation without help
- **Buying Process:** Uses whatever is simple and just works; price almost irrelevant if it unblocks them
- **Willingness to Pay:** $5–$12/month; values simplicity over features

### 3.2 Jobs-to-be-Done Analysis

#### Functional Jobs

- Connect to a live database and browse its structure without writing queries
- Select only the relevant tables (not all 200 — just the 5 that matter)
- Get a clean, complete DDL export for those tables in one action
- Add persistent context notes that survive across LLM sessions
- Paste everything into an LLM with a natural language question and get a useful SQL query back

#### Emotional Jobs

- **Competent** — Non-technical users want to handle data work independently
- **Efficient** — Developers want LLM sessions focused on thinking, not manual prep
- **In control** — Analysts want confidence that their schema context is complete and accurate
- **Not judged** — Users don't want to expose how little they know about the DB to colleagues

#### Social Jobs

- Developers: "I have efficient, modern workflows"
- Analysts: "I can get my own data without bothering engineering"
- Business users: "I'm data-driven"

### 3.3 Customer Journey (Primary Segment: Pragmatic Developer)

1. **Awareness:** Discovers via Reddit/HN post or developer blog; hook is recognition — "that's exactly what I do every day"
2. **Consideration:** Checks DB support, free tier, and whether it's a native app — decision made in under 5 minutes
3. **Purchase:** Downloads free tier immediately; converts to paid after first successful multi-table LLM query
4. **Onboarding:** Expects to connect and see results within 2 minutes; zero tolerance for complex setup
5. **Usage:** Daily for active projects; builds saved schema bundles per project; adds annotation notes over time
6. **Advocacy:** Shares in team Slack when a colleague complains about the same DBeaver pain

---

## 4. Competitive Landscape

### 4.1 Market Structure

- No direct competitors in the specific niche (SQL schema extractor + LLM prompt assembler as a standalone desktop app)
- Database tooling is moderately concentrated (DBeaver dominates free, DataGrip dominates paid enterprise)
- Competitive intensity: **Low in the specific niche today; medium-to-high in adjacent spaces**
- Key dynamic: No established category, no dominant player, no user community around "LLM context prep tooling"

### 4.2 Major Players Analysis

| Tool | Type | Strengths | Weaknesses | Pricing |
|---|---|---|---|---|
| DBeaver | DB client (free) | Multi-DB, large community | Manual DDL export, no LLM features, complex UI | Free / $199/yr Pro |
| DataGrip | DB IDE (paid) | Schema navigation, JetBrains ecosystem | Expensive, heavy, generic AI features | $70/yr |
| TablePlus | DB client (native) | Beautiful UI, fast, Mac-friendly | No LLM features, schema export not a focus | $59 one-time |
| GitHub Copilot/Cursor | AI coding assistant | Deep IDE integration | No standalone DB schema bundling, requires codebase | $10–19/month |

### 4.3 Competitive Positioning

- **Gap:** All existing tools are either full DB clients (no LLM focus) or LLM coding tools (no DB schema awareness). Nobody owns the bridge.
- **Differentiation:** First tool purpose-built for "LLM context prep" — not a DB client, not a coding assistant, but the missing layer between the two.
- **Positioning statement:** "From database to LLM prompt in 30 seconds"
- **Uncontested space:** Multi-table select + annotation + ready-to-paste LLM prompt block

---

## 5. Industry Analysis

### 5.1 Porter's Five Forces

| Force | Level | Key Implication |
|---|---|---|
| Supplier Power | Low | Standard SQL protocols, free desktop frameworks — no supplier leverage |
| Buyer Power | Medium | Low switching costs offset by annotation layer stickiness |
| Competitive Rivalry | Low → Medium | No direct rivals today; 12–18 month window before adjacent players respond |
| Threat of New Entry | Medium | Low technical barrier, but distribution and trust are real moats |
| Threat of Substitutes | Medium-High | LLMs adding native DB connectors in 2–4 years is the primary long-term risk |

### 5.2 Technology Adoption Lifecycle Stage

- **Current stage:** Innovators / Early Adopters boundary
- **Evidence:** LLM use for SQL practiced by a vocal minority; no established tooling category; users solving pain with manual workarounds
- **Strategy implication:** Marketing should speak to pain, not features; don't over-engineer for the Early Majority yet
- **Expected progression:** Early Majority adoption in 2–3 years as LLM-assisted development becomes normalized

---

## 6. Opportunity Assessment

### 6.1 Market Opportunities

#### Opportunity 1: Beachhead — Developer Productivity Tool *(pursue at launch)*
- **Description:** Focused desktop app for SQL-active developers. Core: multi-table select → DDL bundle → copy-to-clipboard prompt block
- **Size/Potential:** $300K–$1.5M ARR at 0.1–0.3% SAM conversion
- **Requirements:** Native desktop (Windows + Mac), PostgreSQL/MySQL/MSSQL support, sub-2-min onboarding, free tier
- **Risks:** Low switching costs; adjacent tools could copy the feature

#### Opportunity 2: Schema Annotation Layer *(follow-on, v2)*
- **Description:** Persistent library of table/column annotations that survive across LLM sessions — the "schema memory" ChatGPT doesn't have
- **Size/Potential:** Increases retention dramatically; enables team tier at $20–30/month per seat
- **Requirements:** Local annotation storage, export/import bundles, optional team sync
- **Risks:** Scope creep from MVP; requires upfront user investment

#### Opportunity 3: Team & Enterprise Tier *(later stage)*
- **Description:** Shared annotated schema bundles across teams — institutional knowledge embedded in annotations
- **Size/Potential:** $50–100/month per team; 500 teams = $300K–600K ARR
- **Risks:** Cloud sync raises privacy/compliance complexity significantly

#### Opportunity 4: Non-Technical User Mode *(long-term expansion)*
- **Description:** Auto-select relevant tables from a natural language description; zero SQL knowledge required
- **Size/Potential:** Large and fast-growing segment; B2B distribution potential
- **Risks:** Much harder UX problem; dilutes focus from developer beachhead

### 6.2 Strategic Recommendations

#### Go-to-Market Strategy

- **Target segment (Day 1):** Pragmatic Developer
- **Positioning:** "From database to LLM prompt in 30 seconds"
- **Channels:**
  - Primary: Reddit (r/SQL, r/programming), HackerNews (Show HN launch), Dev.to
  - Secondary: YouTube tutorials, Twitter/X developer audience
  - Long-term: SEO around "chatgpt sql schema", "how to give schema to chatgpt"
- **Partnerships:** DBeaver plugin, Raycast extension, ChatGPT workflow integrations

#### Pricing Strategy

- **Model:** Freemium with monthly subscription or one-time purchase
- **Free tier:** 1 database, up to 10 tables, no saved annotations
- **Paid tier:** $9–12/month or $49–69 one-time — unlimited databases, tables, saved bundles
- **Team tier (later):** $25–40/month per seat with shared bundles
- **Value metric:** Number of saved schema bundles / databases connected

#### Risk Mitigation

| Risk | Mitigation |
|---|---|
| LLMs add native DB connectors | Build durable value in annotation layer, not just schema extraction |
| Adjacent tools copy the feature | Establish brand and community within 12–18 month window |
| Scope creep delays launch | Strict MVP: connect, select, export, copy — nothing else at v1 |
| Privacy concerns | Keep v1 fully local/offline — credentials never leave the machine |

---

## 7. Appendices

### A. Data Sources

- Stack Overflow Developer Survey 2024
- JetBrains Developer Ecosystem Report 2024
- GitHub Blog — Copilot usage statistics 2024
- SlashData State of the Developer Nation
- Product pages: DBeaver, DataGrip, TablePlus, Cursor, GitHub Copilot
- Community: Reddit (r/SQL, r/datascience), HackerNews, Dev.to
- Market sizing: Grand View Research, MarketsandMarkets (AI developer tools)

### B. Detailed Calculations

**TAM:**
- 27M developers × 60% SQL-active = 16.2M
- + 8M analysts = 24.2M users
- × $60/yr avg = ~$1.45B

**SAM:**
- 24.2M × 40% LLM-open × 50% desktop = 4.84M users
- × $60/yr = ~$290M

**SOM:**
- Low (0.1%): 4,840 users × $108/yr = ~$523K ARR
- High (0.5%): 24,200 users × $108/yr = ~$2.6M ARR

### C. Additional Analysis

**Analogous indie desktop tool benchmarks:**
- TablePlus: ~$5M ARR, ~100K paying users
- Paw (API client): ~$2–4M ARR pre-acquisition
- Proxyman: ~$1–2M ARR, solo founder, Mac-only

These benchmarks confirm a focused, well-executed developer desktop tool can reach $1–5M ARR with a small team — validating the SOM range.
