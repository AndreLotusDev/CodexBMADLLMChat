# 19. Monitoring and Observability

## 19.1 Logging Architecture

```rust
// Daily rotating log file in AppData/logs/
// %APPDATA%\energy.cfp.schemalift\logs\schemalift.log

fn init_logging(log_dir: &Path) {
    let file_appender = RollingFileAppender::new(Rotation::DAILY, log_dir, "schemalift.log");
    tracing_subscriber::registry()
        .with(EnvFilter::new("schemalift=info,warn"))
        .with(fmt::layer().with_writer(file_appender).with_ansi(false))
        .init();
}
```

## 19.2 Key Log Events

| Event | Level | Fields |
|-------|-------|--------|
| Schema extraction complete | INFO | `profile_id`, `tables`, `duration_ms` |
| Connection established | INFO | `host`, `database` |
| Credential store error | ERROR | `profile_id`, `error` |
| Annotation upserted | DEBUG | `table_name` |
| App startup | INFO | `duration_ms` |

## 19.3 Frontend Dev Observability

DevTools enabled automatically in `npm run tauri dev`. Stripped from release builds. IPC errors logged to console in dev mode via `import.meta.env.DEV` guard.

## 19.4 No Cloud Telemetry

NFR6 prohibits telemetry without explicit user consent. No Sentry, Mixpanel, or analytics in MVP. Bug reports use local log file (`%APPDATA%\energy.cfp.schemalift\logs\`).

---
