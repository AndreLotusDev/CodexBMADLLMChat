# Brainstorming Session — Multi-Database Schema Extractor + LLM Query Tool

**Date:** 2026-05-15
**Facilitator:** Mary (BMad Business Analyst)
**Technique:** Progressive Flow (broad → narrow)

---

## Session Setup

**Topic:** App that connects to SQL databases, extracts the full schema, lets users annotate table/column context, and bundles everything + a natural language query into a ready-to-paste LLM prompt.

**Target Users:** Developers and non-technical users

**Scope:** Broad exploration

**Deployment:** Desktop app

**Constraints:**
- SQL databases only (no NoSQL/MongoDB)
- Goal is to eliminate the manual schema-extraction friction before using ChatGPT

---

## Phase 1: Warm-Up — First Principles Thinking

### Core Pain Identified

**Current workflow (without the app):**
1. Open DBeaver
2. Find the tables needed one by one
3. Right-click each table → Generate DDL definition
4. Export DDL one by one
5. Manually copy all that information into ChatGPT
6. Write the natural language query

**Key quote from user:**
> "I need to go one by one the tables that I want, right click, wait to create DDL definition, click in export one by one, copy all those information manually into chat gpt chat and later write the natural language query. This make me spend so much time."

### Problem Statement (First Principles)

> "LLMs need full schema context to give useful SQL answers, but gathering that context is entirely manual, repetitive, and done outside the tool you actually want to use."

**Root bottleneck:**
> "Extracting schema context for an LLM requires N manual operations for N tables — it scales with complexity instead of being a one-shot action."

The pain is **context-building friction**, not the querying itself. The user already knows how to write the question; 80% of the time is spent assembling the ingredients.

---

## Phase 2: Divergent Thinking — "Yes, And..." (in progress)

### Seed Idea
The app connects to your SQL database, lets you check a box next to each table you want, and generates a single ready-to-paste block with all DDL definitions combined.

### Next question posed (session interrupted here):
*"Yes, and...? What else should happen in that moment or right after? What would make that even more useful or remove the next friction point you'd hit?"*

---

## Key Insights So Far

1. The core value prop is **one-shot schema bundling** — replacing N manual steps with a single multi-select + export action.
2. Users don't want a full SQL IDE replacement — they want a **context assembler** for LLM conversations.
3. The app should handle: connect → browse → select tables → annotate (optional) → generate prompt block → copy/paste.
4. Non-technical users are also a target, so the UX must be simple enough to not require SQL knowledge to operate.

---

## Open Questions (to explore in remaining phases)
- Which SQL databases to support first? (PostgreSQL, MySQL, MSSQL, SQLite?)
- What does "annotate table structure" look like? Free-text notes per table? Per column?
- Should the app remember annotations across sessions?
- What format should the output prompt block be? (Raw DDL? Simplified schema? Mixed?)
- Should the natural language query be typed inside the app or just in ChatGPT?
- Any privacy concerns about sending schema data outside the app?
