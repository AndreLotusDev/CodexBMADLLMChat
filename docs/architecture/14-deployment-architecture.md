# 14. Deployment Architecture

## 14.1 Deployment Strategy

**Frontend:** Bundled into Tauri binary — not deployed to any server or CDN.

**Backend:** Compiled to native Windows `.exe` via `cargo build --release`, packaged by Tauri NSIS bundler.

**Output:** `src-tauri/target/release/bundle/nsis/SchemaLift_x.x.x_x64-setup.exe`

## 14.2 Build Pipeline (Manual — MVP)

```bash
npm ci
npm run typecheck && npm run lint
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
npm run test && cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri build
# Upload .exe to GitHub Releases
```

## 14.3 CI/CD Pipeline (Post-MVP Template)

```yaml
# .github/workflows/ci.yaml — NOT ACTIVE in MVP
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run typecheck && npm run lint && npm run test
      - run: cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
      - run: cargo test --manifest-path src-tauri/Cargo.toml
```

## 14.4 Environments

| Environment | Description | Purpose |
|-------------|-------------|---------|
| Development | Local dev machine (`localhost:1420`) | Active development with hot reload |
| Production | User's Windows machine (installed `.exe`) | Live app — no remote server |
| Test (Rust) | Developer machine (local PostgreSQL) | Integration tests |

## 14.5 Distribution

```
MVP: Build .exe → Upload to GitHub Releases → Share download link

Release Checklist:
  [ ] Version bumped in tauri.conf.json + Cargo.toml
  [ ] All tests passing
  [ ] Smoke test on clean Windows 10 VM
  [ ] Verify credentials stored in WinCred (not AppData files)
  [ ] Upload to GitHub Releases with changelog
```

## 14.6 Code Signing Note

MVP ships unsigned — Windows SmartScreen will warn on first run ("More info → Run anyway"). EV Code Signing Certificate (~$300-500/yr) is a post-MVP requirement for enterprise adoption.

---
