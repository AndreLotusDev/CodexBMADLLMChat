# 13. Development Workflow

## 13.1 Prerequisites

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable

# Node.js 20+ LTS
node --version   # must be >= 20

# Visual Studio C++ Build Tools (Windows — required by Rust)
# Select: "Desktop development with C++"

# Tauri CLI
cargo install tauri-cli --version "^2"

# PostgreSQL for integration tests
docker run -d --name schemalift-test-pg \
  -e POSTGRES_PASSWORD=testpass \
  -p 5432:5432 postgres:16
```

## 13.2 Initial Setup

```bash
git clone https://github.com/<org>/schemalift.git
cd schemalift
npm install
npx shadcn@latest init
cargo build --manifest-path src-tauri/Cargo.toml
cp .env.example .env.local
```

## 13.3 Development Commands

```bash
# Full app (hot reload on both Vite + Rust)
npm run tauri dev

# Frontend only (browser — for UI iteration)
# The frontend will display a banner indicating the Tauri IPC bridge is
# unavailable; database actions are intentionally disabled in this mode.
npm run dev

# Build production .exe installer
npm run tauri build

# Frontend tests
npm run test

# Rust unit tests
cargo test --manifest-path src-tauri/Cargo.toml

# Rust integration tests (requires PostgreSQL)
cargo test --manifest-path src-tauri/Cargo.toml -- --include-ignored integration

# Type check
npm run typecheck

# Lint + format
npm run lint
cargo fmt --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

## 13.4 Environment Configuration

```bash
# .env.example

# Frontend — no required env vars for MVP
# VITE_ENABLE_TELEMETRY=false  (future opt-in)

# Rust integration tests only (not bundled in binary)
# TEST_PG_HOST=localhost
# TEST_PG_PORT=5432
# TEST_PG_DB=postgres
# TEST_PG_USER=postgres
# TEST_PG_PASSWORD=testpass
```

---
