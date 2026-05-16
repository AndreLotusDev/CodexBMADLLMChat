# 3. Tech Stack

## 3.1 Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.x | All React UI code | Type safety across IPC boundary; catches interface mismatches at compile time |
| Frontend Framework | React | 18.x | UI component tree | Industry standard; Tauri official starter; large ecosystem |
| UI Component Library | shadcn/ui | latest | Pre-built accessible components | Copy-paste components (no runtime dep); Tailwind-native; dark mode first-class |
| State Management | Zustand | 4.x | Global app state (connection, schema, selections, annotations) | Minimal boilerplate; no Provider wrapping; works naturally with Tauri event listeners |
| Backend Language | Rust | 1.78+ (stable) | All system-level logic | Tauri requirement; memory safety; native Win32 API access |
| Backend Framework | Tauri v2 | 2.x | Desktop runtime + IPC bridge | Core architectural choice; WebView2 host; command/event system |
| API Style | Tauri IPC (invoke/emit) | Tauri v2 | Frontend↔Backend communication | No HTTP server needed; typed commands; built-in serialization via serde |
| Database (user's) | PostgreSQL | 12+ | Target database for schema extraction | MVP scope per PRD; most common developer DB |
| Database (local) | SQLite | 3.x (via rusqlite) | Persist profiles and annotations | Embedded; zero setup; single file in AppData |
| Cache | None (MVP) | — | — | Schema held in Zustand memory; re-fetched on reconnect |
| File Storage | AppData directory | OS-managed | SQLite .db file location | Standard Windows app data path via Tauri path API |
| Authentication | Windows Credential Manager | Win32 API | Secure password storage | NFR3 hard requirement; never plaintext; via `keyring` crate |
| Frontend Testing | Vitest | 1.x | Unit tests for React components and utilities | Vite-native; fast; compatible with jsdom |
| Backend Testing | Rust built-in (`cargo test`) | — | Unit + integration tests for Rust commands | Zero setup; first-class in Rust toolchain |
| E2E Testing | None (MVP) | — | — | Explicitly out of scope per PRD |
| Build Tool | Vite | 5.x | Frontend dev server + bundler | Tauri v2 default; fast HMR |
| Bundler | Vite (Rollup) | 5.x | Production frontend bundle | Included with Vite |
| IaC Tool | None (MVP) | — | — | Local-only app; no cloud infrastructure |
| CI/CD | None (MVP) | — | — | Explicitly deferred post-MVP per PRD |
| Monitoring | None (MVP) | — | — | NFR6: no telemetry without consent; MVP has none |
| Logging | `tracing` crate (Rust) | 0.1.x | Structured Rust backend logging to file | Debug support without user-visible telemetry |
| CSS Framework | Tailwind CSS | 3.x | Styling | Pairs with shadcn/ui; utility-first; dark mode via `class` strategy |
| DB Driver (Rust) | sqlx | 0.7.x | PostgreSQL connection + introspection queries | Async; compile-time query checking; supports connection pooling |
| Serialization | serde / serde_json | 1.x | Rust↔TypeScript data serialization over IPC | Tauri's standard; zero-cost deserialization |

---
