# Goals and Background Context

## Goals

- Eliminate the repetitive manual workflow of right-clicking tables in DBeaver, copying DDL one-by-one, and pasting into ChatGPT
- Enable one-shot schema context bundling for any SQL database
- Allow users to annotate tables/columns to add semantic meaning before sending to an LLM
- Support both technical developers and non-technical users in getting accurate SQL help from LLMs
- Deliver a desktop application targeting Windows (SQL databases only, no NoSQL) for MVP

## Success Metrics

- A user can go from cold app launch to first clipboard copy in **under 2 minutes** on a database with up to 20 tables
- Schema extraction for a 200-table PostgreSQL database completes in **under 5 seconds**
- A returning user can reconnect and regenerate their last prompt in **under 30 seconds** (saved profile + persisted annotations)
- **Zero plain-text credential storage** — all passwords stored exclusively via Windows Credential Manager

## Out of Scope (MVP)

The following are explicitly excluded from MVP scope:

- **NoSQL databases** — MongoDB, Redis, DynamoDB, etc. are not supported
- **Non-PostgreSQL SQL engines** — MySQL, SQL Server, SQLite, Oracle support is post-MVP
- **Query execution** — the app reads schema only; it does not run SQL queries
- **Multi-user or collaboration features** — profiles and annotations are local to the machine
- **Cloud sync or backup** — all data stays local; no cloud storage or account system
- **Auto-update mechanism** — users update manually via a new `.exe` installer
- **Custom prompt templates** — the prompt format is fixed for MVP
- **CI/CD pipeline** — to be added post-MVP
- **WCAG accessibility compliance** — not targeted for MVP

## Background Context

Developers and non-technical users who rely on LLMs for SQL assistance face a fundamental friction: LLMs require full schema context to give useful answers, but gathering that context is entirely manual — N right-clicks for N tables, then copy-paste into a chat window. The process scales with database complexity, turning what should be a one-shot question into a multi-minute setup ritual every single time.

This app solves that by connecting directly to SQL databases, extracting the complete schema in one action, and letting users compose an annotated, ready-to-paste LLM prompt block — collapsing N manual steps into one.

---
