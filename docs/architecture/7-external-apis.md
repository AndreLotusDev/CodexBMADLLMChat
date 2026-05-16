# 7. External APIs

SchemaLift has **no external API integrations** in the MVP. All network activity is limited to the user's own PostgreSQL server on their local network.

| Potential Integration | Decision | Reason |
|---|---|---|
| Cloud LLM APIs | Out of scope | PRD explicitly excludes built-in LLM integration |
| Telemetry / Analytics | Out of scope | NFR6 prohibits telemetry without explicit consent |
| Auto-update service | Out of scope | Manual `.exe` update deferred post-MVP |
| Windows Credential Manager | Internal OS API | Accessed via Rust crate — not a network call |
| User's PostgreSQL server | User-owned | Not a third-party integration |

---
