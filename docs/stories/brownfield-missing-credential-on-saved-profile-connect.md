# Story: Replace the cryptic "No matching entry found in secure storage" error with an actionable message

<!-- Source: User bug report (clicking a saved profile → "Connect & Browse Schema" surfaces "Failed to retrieve credentials: No matching entry found in secure storage") -->
<!-- Context: Brownfield fix to the secure-storage error mapping in the Tauri backend — Epic 4 (Persistence: Profiles & Annotations) -->

## Status

Ready for Review

## Story

**As a** SchemaLift user clicking a saved profile and pressing **Connect & Browse Schema**,
**I want** a clear, actionable error when my profile's password is missing from Windows Credential Manager (e.g., the credential vault was cleared, the DB row was copied from another machine, or the keychain entry was deleted manually),
**so that** I know exactly what to do — re-save the profile to restore its password — instead of seeing the raw keyring-crate text *"No matching entry found in secure storage"*.

## Context Source

- **Source Document**: User bug report — clicking a saved profile then **Connect & Browse Schema** surfaces *"Failed to retrieve credentials: No matching entry found in secure storage"* in `TestConnectionBanner` via the store's error path.
- **Enhancement Type**: Bug fix — error-mapping refinement in the Rust credential store. No behaviour change when the credential is present. No new error variant. No frontend change.
- **Existing System Impact**: Affects only the `connect_with_saved_profile` IPC path (and, transitively, any future caller of `credential_store::retrieve`). Zero impact when the credential entry exists.

## Acceptance Criteria

1. **Actionable user-facing message replaces the keyring crate's English text.** When `connect_with_saved_profile` is called against a profile whose Windows Credential Manager entry is missing (`keyring::Error::NoEntry`), the frontend receives `{ code: 'CredentialNotFound', message: <actionable string> }` where the message:
   - does **not** contain the substring `"No matching entry found in secure storage"`,
   - names the remediation in plain language (e.g., *"Re-save this profile from the Connection screen to restore its password."*), and
   - mentions Windows Credential Manager so the user understands which subsystem is involved.
2. **Non-`NoEntry` keyring failures stay distinguishable.** If `keyring::Entry::get_password()` returns any error variant other than `NoEntry` (e.g., `PlatformFailure`, `NoStorageAccess`), the rejection arrives at the frontend as `{ code: 'CredentialStoreError', message: ... }` — **not** `CredentialNotFound`. This lets the user (and future telemetry) tell "you need to re-save your profile" apart from "your credential vault is broken".
3. **The store path is unchanged.** `save_profile`'s compensation rollback (delete SQLite row when `credential_store.store` fails) continues to surface as `CredentialStoreError` — no semantic drift on the write path. Existing `roundtrip_store_retrieve_delete` and `delete_nonexistent_is_idempotent` `#[ignore]`-gated tests still pass after the change.
4. **No frontend code change.** [src/commands/index.ts](src/commands/index.ts), [src/components/connection/ConnectionForm.tsx](src/components/connection/ConnectionForm.tsx), the Zustand store, and `TestConnectionBanner` are all untouched. The improved message reaches the user through the existing `setConnectionStatus('error', (err as TauriCommandError).message ?? 'Connection failed')` path at [src/components/connection/ConnectionForm.tsx:199](src/components/connection/ConnectionForm.tsx:199).
5. **No new dependency, no new `AppError` variant, no IPC schema change.** The fix is a payload-text + match-arm refinement inside `src-tauri/src/credential_store.rs`. Serde output shape (`{code, message}`) is identical to today.
6. **Regression coverage.** The ignored `roundtrip_store_retrieve_delete` test in [src-tauri/src/credential_store.rs](src-tauri/src/credential_store.rs) is extended so that after `store.delete(&profile_id)`, calling `store.retrieve(&profile_id)` returns `Err(AppError::CredentialNotFound(msg))` where `msg` matches the AC1 substance check (contains "Re-save" and "Connection" — exact wording is at the dev's discretion). The test stays `#[ignore]` (it still requires Windows Credential Manager) but locks in the new payload contract.

## Tasks / Subtasks

- [x] **Task 1: Refine the keyring error mapping in `credential_store::retrieve`.** (AC: 1, 2, 5)
  - [x] Read [src-tauri/src/credential_store.rs:24-29](src-tauri/src/credential_store.rs:24) and confirm the current `.map_err(|e| AppError::CredentialNotFound(e.to_string()))` collapses every `get_password()` failure into one variant.
  - [x] Replace the body of `retrieve` so that the result of `entry.get_password()` is matched: `Err(keyring::Error::NoEntry)` → `AppError::CredentialNotFound(TAURI_MESSAGE)` where `TAURI_MESSAGE` is the actionable string from AC1; any other `Err(e)` → `AppError::CredentialStoreError(format!("Could not access Windows Credential Manager: {e}"))`.
  - [x] Keep the actionable string in a single `const` inside `credential_store.rs` (e.g., `const MISSING_CREDENTIAL_MESSAGE: &str = "..."`) so the test in Task 4 can reference it directly without string duplication.

- [x] **Task 2: Confirm `errors.rs` does not need changes.** (AC: 5)
  - [x] Read [src-tauri/src/errors.rs](src-tauri/src/errors.rs) and verify that `CredentialNotFound(String)` already carries a payload — the user-visible message comes from the payload (via `#[serde(tag = "code", content = "message")]`), **not** from the `#[error("Failed to retrieve credentials: {0}")]` Display string. Document this in a one-line code comment if the project conventions allow it, otherwise leave as-is.
  - [x] Do **not** add a new `AppError` variant. Do **not** rename `CredentialNotFound`. Do **not** change its tuple shape (changing `(String)` → unit would break the Serde `message` field and surface `null` to the frontend).

- [x] **Task 3: Verify the frontend surface is unchanged.** (AC: 3, 4)
  - [x] Trace [src/components/connection/ConnectionForm.tsx:180](src/components/connection/ConnectionForm.tsx:180) → `catch` at line 198 → `setConnectionStatus('error', (err as TauriCommandError).message ?? 'Connection failed')`. Confirm no code change is needed.
  - [x] Confirm `ProfileDropdown`, `ProfileList`, and the Zustand store have no special handling of the `CredentialNotFound` code that would be broken by the wording change (a grep for `'CredentialNotFound'` in `src/` should return zero hits — the frontend treats it as a generic error code).

- [x] **Task 4: Extend the ignored credential-store test.** (AC: 6)
  - [x] In [src-tauri/src/credential_store.rs:48-65](src-tauri/src/credential_store.rs:48), modify `roundtrip_store_retrieve_delete` so the final assertion captures the payload: `match store.retrieve(&profile_id) { Err(AppError::CredentialNotFound(msg)) => { assert!(msg.contains("Re-save") && msg.contains("Connection")); } other => panic!("expected CredentialNotFound, got {other:?}"), }`. Keep `#[ignore = "Requires Windows Credential Manager — run with `cargo test -- --ignored`"]`.
  - [x] Optionally add a second `#[ignore]`-gated test asserting that a non-`NoEntry` failure path routes to `CredentialStoreError`. **Skip this** if simulating a non-`NoEntry` keyring failure requires invasive mocking — the AC2 contract is covered by code review alone if direct unit testing is infeasible. *(Skipped per story guidance — simulating a non-`NoEntry` keyring failure requires invasive mocking; AC2 is verified by the exact-variant match-arm structure and the catch-all `Err(e)` branch.)*

- [ ] **Task 5: Manual smoke test in the running Tauri shell.** (AC: 1, 2, 3) — **DEFERRED TO USER**: requires a real Windows Credential Manager + an active Tauri shell.
  - [ ] `npm run tauri dev` → save a profile → confirm connect works (regression check for AC3).
  - [ ] Stop the app → open `Control Panel → User Accounts → Credential Manager → Windows Credentials` → find the entry whose Internet/network address is `schemalift` and the user name matches the profile's UUID → **Remove** it.
  - [ ] Restart the app → click the saved profile → **Connect & Browse Schema** → confirm the banner now shows the actionable AC1 message and that the literal string `"No matching entry found in secure storage"` is **absent**.
  - [ ] Save the same profile again (re-entering the password) → confirm the connection succeeds afterward, validating the remediation path the new message points to.

- [x] **Task 6: Update the error-handling architecture doc.** (AC: 2)
  - [x] In [docs/architecture/18-error-handling-strategy.md:54](docs/architecture/18-error-handling-strategy.md:54) — the "Unrecoverable States" table currently says *"WinCred unavailable | `CredentialStoreError` surfaced on connect"*. Add an adjacent row (or split the existing row) noting that *"Saved-profile password missing from WinCred | `CredentialNotFound` surfaced on connect — user remediation is to re-save the profile"*. One line; preserve table formatting.

## Risk Assessment

### Implementation Risks

- **Primary Risk**: A future maintainer reads the new actionable message in the payload and assumes `AppError::CredentialNotFound`'s `#[error("Failed to retrieve credentials: {0}")]` Display format is *also* user-facing (it is not — Serde uses the payload directly). They could then "double-prefix" the message by editing the Display string, producing UI text like *"Failed to retrieve credentials: Re-save this profile…"*.
  - **Mitigation**: The Task 2 one-line code comment makes the "Display ≠ user-visible" distinction explicit at the `errors.rs` site.
  - **Verification**: Task 5 manual smoke test catches a double-prefix regression visually.

- **Secondary Risk**: Mis-classifying a real `PlatformFailure` as `CredentialNotFound` because the new code path is fragile (e.g., catching the wrong `keyring::Error` variant). This would mislead the user into thinking re-saving will fix a problem that is actually OS-level.
  - **Mitigation**: Use an **exact** match arm (`Err(keyring::Error::NoEntry) =>`) rather than a string-based check on the error message — the `keyring` crate guarantees the variant shape across platforms.
  - **Verification**: The `else` arm in Task 1's match is `Err(e)` (catch-all), routing every non-`NoEntry` case to `CredentialStoreError`.

- **Tertiary Risk**: The hard-coded actionable string drifts out of sync with the actual UI flow (e.g., the Connection screen is renamed in a future story and the message still says "Re-save the profile from the Connection screen").
  - **Mitigation**: Keep the string in one `const` per Task 1 so a future rename is one-file. The frontend test grep in Task 3 will surface any code that hard-codes the screen name elsewhere.

### Rollback Plan

1. `git revert` the single commit — or hand-revert [src-tauri/src/credential_store.rs](src-tauri/src/credential_store.rs) to the prior `.map_err(|e| AppError::CredentialNotFound(e.to_string()))` line, and revert the one line added to [docs/architecture/18-error-handling-strategy.md](docs/architecture/18-error-handling-strategy.md).
2. No data migration, no IPC schema change, no frontend change — rollback is a single-file Rust revert.

### Safety Checks

- [ ] AC2's distinction between `CredentialNotFound` and `CredentialStoreError` is enforced by an **exact** `keyring::Error::NoEntry` match arm — not by string inspection.
- [ ] AC4 is verified by grep: `rg "CredentialNotFound" src/` must return zero hits (the frontend treats the code as opaque).
- [ ] Ignored tests in [src-tauri/src/credential_store.rs](src-tauri/src/credential_store.rs) still gate behind `--ignored` so CI is unaffected.

## Dev Technical Guidance

### Existing System Context

- The credential store is a thin wrapper over the `keyring` crate, instantiated at [src-tauri/src/lib.rs:43](src-tauri/src/lib.rs:43) with service name `"schemalift"`. Profiles store passwords keyed by their SQLite-generated UUID (`profile.id`).
- The `connect_with_saved_profile` Rust handler at [src-tauri/src/commands/connection.rs:26](src-tauri/src/commands/connection.rs:26) calls `state.credential_store.retrieve(&profile_id)?` — a missing entry shortcuts the entire connect flow with the cryptic error today.
- Error contract per [docs/architecture/18-error-handling-strategy.md:30](docs/architecture/18-error-handling-strategy.md:30): rejections arrive at the frontend as `{ code, message }`. The `message` field is sourced from the variant **payload**, not the `#[error("...")]` Display string — a non-obvious detail that this story relies on. (See Task 2.)

### Integration Approach

- A **backend-only** fix scoped to one Rust file plus one docs line.
- Reuses the existing `AppError::CredentialNotFound(String)` and `AppError::CredentialStoreError(String)` variants — no IPC schema change, no frontend change, no test-setup change.
- The actionable string is hard-coded as a `const` inside `credential_store.rs` (the only call site that surfaces it), avoiding cross-module coupling.

### Technical Constraints

- Must not add any new dependency, must not introduce a new `AppError` variant, must not change the Serde shape of any variant.
- Must not change `save_profile`'s rollback semantics — the compensation path (delete SQLite row on credential store failure) at [src-tauri/src/commands/profiles.rs:25-29](src-tauri/src/commands/profiles.rs:25) continues to surface as `CredentialStoreError`.
- The new actionable message MUST avoid the literal substring `"No matching entry found in secure storage"` (the current cryptic text the user reported).

### Files Touched (expected)

- **Modified**: `src-tauri/src/credential_store.rs`, `docs/architecture/18-error-handling-strategy.md`
- **Unchanged**: everything under `src/` (frontend), `src-tauri/src/errors.rs`, `src-tauri/src/commands/`, every test file under `src/__tests__/`

### Missing Information

None blocking. One judgement call for the dev agent: **exact wording of the actionable message**. AC1 specifies the substance (no `"No matching entry…"`, names re-save, mentions Windows Credential Manager) but the exact phrasing is at the dev's discretion.

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — `claude-opus-4-7[1m]` — as **James (dev)** via the `/BMad:agents:dev` persona.

### Debug Log References

- `cargo check --manifest-path src-tauri/Cargo.toml` → clean (1m08s compile).
- `cargo test --manifest-path src-tauri/Cargo.toml --lib credential_store` → 0 passed, 0 failed, 2 ignored (gated tests stay correctly behind `--ignored`).
- `cargo test --manifest-path src-tauri/Cargo.toml` → 25 passed, 2 failed, 2 ignored. The 2 failures are in `repositories::annotation_repository::tests::upsert_updates_existing_row_on_same_natural_key` and `upsert_handles_null_column_name_for_table_annotations`. **Reproduced these failures on unmodified `main`** (stashed my edits, re-ran the suite — same failures) — they are pre-existing on `main` and unrelated to this story. Not regressions from this change.
- `npm test` → 25 test files, 223 tests, all pass — confirms AC4 (no frontend regression).
- `rg "CredentialNotFound" src/` → 0 hits, confirming AC4: the frontend treats the code as opaque.

### Completion Notes List

- **AC1 wording.** Chose: *"This profile's password is missing from Windows Credential Manager. Re-save this profile from the Connection screen to restore its password."* Verifies AC1: avoids the literal string `"No matching entry found in secure storage"`, names the remediation, and mentions Windows Credential Manager. Stored in a single `const MISSING_CREDENTIAL_MESSAGE: &str` at the top of [src-tauri/src/credential_store.rs](src-tauri/src/credential_store.rs) (per Task 1's single-source-of-truth requirement).
- **AC2 enforcement.** The `retrieve` body now uses an **exact-variant** `Err(keyring::Error::NoEntry) =>` arm with a catch-all `Err(e) =>` for every other failure. The catch-all routes to `CredentialStoreError(format!("Could not access Windows Credential Manager: {e}"))`. No string inspection — the keyring crate's variant shape is the contract.
- **AC3 / write path unchanged.** `save_profile`'s compensation rollback still surfaces `CredentialStoreError` because the `store` method was not touched. `delete`'s idempotent `NoEntry` short-circuit was also not touched.
- **AC5 / no schema change.** `CredentialNotFound(String)` and `CredentialStoreError(String)` are unchanged in shape. `errors.rs` only gained a 3-line comment clarifying that Serde uses the payload — not the `#[error("...")]` Display string — for the user-visible `message` field. This mitigates the Primary Risk in the story (future maintainer double-prefixing).
- **AC6 / regression coverage.** `roundtrip_store_retrieve_delete` now asserts the payload contains both `"Re-save"` and `"Connection"`, and explicitly asserts that the raw keyring text `"No matching entry found in secure storage"` is **absent**. Test stays `#[ignore]`-gated behind Windows Credential Manager.
- **Optional second test skipped** per Task 4 guidance — simulating a non-`NoEntry` keyring failure (e.g., `PlatformFailure`) requires invasive mocking. AC2 is covered by code-review of the exact match-arm structure.
- **Task 5 (manual smoke test) deferred to user** per story instructions — requires running Tauri shell + manual Windows Credential Manager manipulation.
- **Pre-existing test failures noted but not in scope.** Two `annotation_repository::upsert_*` tests fail on `main` (verified pre-edit). These are not blocking this story but warrant a separate brownfield ticket.
- **🔴 CRITICAL OUT-OF-SCOPE FIX (Task 8 — added during smoke test).** User reported that the new actionable message was firing on **freshly saved profiles**, not just on profiles whose credential had been manually deleted. Diagnosis: the ignored `roundtrip_store_retrieve_delete` test (Task 4) was extended to assert AC1 substance and then run via `cargo test -- --ignored --test-threads=1`. It panicked at the *first* assertion (`store.retrieve(&profile_id).unwrap()`) — meaning `store()` was succeeding but the credential was not persisting to Windows Credential Manager at all. **Root cause:** [src-tauri/Cargo.toml:29](src-tauri/Cargo.toml:29) declared `keyring = "3"` with **no feature flags**. keyring v3.x ships with **no default native backend** — without `features = ["windows-native"]`, the crate falls back to a process-local mock HashMap that returns `NoEntry` across `Entry::new()` boundaries. Cargo.lock confirmed: the keyring entry pre-fix listed only `log` and `zeroize` as dependencies; no `windows-sys`. **Fix:** added `features = ["windows-native"]` to the keyring dep. Cargo.lock now lists `windows-sys 0.60.2` as a keyring dependency, confirming the native Win32 backend (CredWrite/CredRead) is compiled in. Both ignored credential_store tests now pass against real Windows Credential Manager. **Implication:** every credential save in production since project inception has been a silent no-op. Users with existing saved profiles cannot connect to them and must delete + recreate after this fix lands. This regression-of-the-original-feature is the deeper bug underneath this story's surface symptom.

### File List

**Modified:**
- `src-tauri/src/credential_store.rs` — added `MISSING_CREDENTIAL_MESSAGE` const; replaced `retrieve` body with exact-variant match on `keyring::Error::NoEntry`; extended `roundtrip_store_retrieve_delete` test to lock in AC1+AC6 payload contract.
- `src-tauri/src/errors.rs` — added 3-line comment above `AppError` enum clarifying Serde-payload-vs-Display distinction (mitigates Primary Risk in the story).
- `src-tauri/Cargo.toml` — **(out-of-scope but critical, Task 8)** added `features = ["windows-native"]` to keyring dep so credentials actually persist to Windows Credential Manager instead of a process-local mock HashMap.
- `src-tauri/Cargo.lock` — regenerated to include `windows-sys 0.60.2` as a keyring dependency.
- `docs/architecture/18-error-handling-strategy.md` — added one row to the Unrecoverable States table for "Saved-profile password missing from WinCred → `CredentialNotFound` surfaced on connect".
- `docs/stories/brownfield-missing-credential-on-saved-profile-connect.md` — status flipped Draft → Approved → Ready for Review; task checkboxes ticked; Dev Agent Record filled.

**Unchanged (per AC4 / AC5):**
- All `src/` (frontend) — no React, store, or commands change.
- `src-tauri/src/commands/connection.rs`, `src-tauri/src/commands/profiles.rs` — write/read paths intact.
- All test files under `src/__tests__/`.

### Change Log

| Date       | Version | Description                                                                                  | Author       |
|------------|---------|----------------------------------------------------------------------------------------------|--------------|
| 2026-05-21 | 0.1.0   | Initial draft.                                                                               | (SM)         |
| 2026-05-21 | 1.0.0   | Implemented backend error-mapping refinement + regression test + docs row. Ready for Review. | James (dev)  |
| 2026-05-21 | 1.1.0   | **CRITICAL out-of-scope fix:** added `features = ["windows-native"]` to keyring dep — credentials were never actually persisting to Windows Credential Manager (process-local mock HashMap). Discovered via the extended ignored test (now passing). | James (dev)  |

---

## QA Results

### Review Date: 2026-05-21

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

Surgical, well-targeted backend-only fix. The implementation does exactly what the story specifies — exact-variant `keyring::Error::NoEntry` match arm with a catch-all `Err(e)` routing to `CredentialStoreError`, a single `MISSING_CREDENTIAL_MESSAGE` const as the one place to edit, and a 3-line comment in `errors.rs` clarifying the Serde-payload-vs-Display distinction that mitigates the Primary Risk called out in the story. The `git diff` is 41 insertions / 4 deletions across exactly the files the dev claimed — no scope creep on the AC1-AC6 implementation. The extended `roundtrip_store_retrieve_delete` test asserts both presence of remediation text (`"Re-save"` + `"Connection"`) AND absence of the raw keyring text — symmetric coverage of AC1.

The **out-of-scope Task 8 finding deserves special recognition**: the dev used the new regression test as a TDD oracle, discovered it was panicking on the first assertion, and traced through to find that `keyring v3` ships without a native backend by default. Without `features = ["windows-native"]` the crate silently falls back to a process-local `HashMap`, meaning every credential save since project inception was a no-op. `Cargo.lock` now lists `windows-sys 0.60.2` as a keyring dep, confirming the native Win32 backend (`CredWrite`/`CredRead`) is compiled in. This is exemplary process — the dev didn't accept the green test until they understood *why* it was green.

That said, the Task 8 fix is a much bigger story than this one's stated surface scope. It retroactively invalidates Story 4.1's QA gate (which relied on the same ignored test that was silently passing against the mock) and changes the migration profile for every existing user. The gate concerns below are about institutionalizing the lesson learned, not about the implementation itself.

### Refactoring Performed

None. The code is clean and surgical — I had no improvements to apply directly. Recommendations below are for follow-up work, not refactors I performed.

### Compliance Check

- Coding Standards: ✓ — single const for the actionable string; exact-variant match (no string inspection per architecture §15.2 spirit); thin wrapper preserved.
- Project Structure: ✓ — change is contained to the credential_store module and one architecture doc row, exactly as scoped.
- Testing Strategy: ✓ with one accepted gap — the AC2 (non-`NoEntry` → `CredentialStoreError`) routing has no automated test, accepted per Task 4's explicit guidance because it requires invasive keyring mocking.
- All ACs Met: ✓ — AC1-AC6 implementation verified by code review + diff + grep. AC4 confirmed via `rg "CredentialNotFound" src/` returning zero hits.

### Improvements Checklist

- [ ] **Add architecture-doc note (or ADR) for the `windows-native` keyring requirement** — capture WHY it's load-bearing and what silently breaks without it. This is the single most important follow-up. (DOC-BF-001 part a)
- [ ] **Complete Task 5 manual smoke test end-to-end** and append the post-fix confirmation to the Dev Agent Record before transitioning to Done. (SMOKE-BF-001)
- [ ] Consider a Windows-only CI job that runs `cargo test -- --ignored`, OR a `build.rs` assertion that fails if no native keyring backend is enabled. Defense-in-depth against a future regression. (DOC-BF-001 part b)
- [ ] When the `CredentialStore` trait-abstraction refactor is taken on (also unblocks Story 4.1's TEST-4.1-001), add a unit test that injects a non-`NoEntry` keyring failure to lock the AC2 routing contract. (TEST-BF-001)
- [ ] Decide: publish a "What's New" / release note for the credential regression fix, or accept the new actionable message AS the migration UX. (MIGR-BF-001)
- [ ] File a separate brownfield ticket for the two pre-existing `annotation_repository::upsert_*` test failures on `main`. (INFO-BF-001)

### Security Review

**PASS, with a substantial retroactive improvement.** The new actionable message leaks no sensitive information. The exact-variant match arm is more robust than string inspection — a real `PlatformFailure` cannot be silently misclassified as `CredentialNotFound` and mislead a user about remediation. Most importantly, the Task 8 `windows-native` fix retroactively closes a major confidentiality + availability gap that has been latent since project inception: pre-fix, passwords were neither persisted at rest (architecture §15.2 violation — the contract said "WinCred only", reality was "process-local HashMap") nor protected by the OS vault. Post-fix, the credential subsystem actually does what the architecture claims it does.

### Performance Considerations

No performance-relevant changes. The `match` on `entry.get_password()` has the same branch count as the prior `.map_err`. The `format!` in the catch-all arm only runs on the rare-failure path. The `windows-sys 0.60.2` transitive on Windows builds adds negligible binary size.

### Files Modified During Review

None — I did not modify any source files. All findings are advisory and documented in the gate file. Dev does NOT need to update the File List.

### Gate Status

Gate: **CONCERNS** → [docs/qa/gates/bf.credential-missing-on-saved-profile-connect.yml](../qa/gates/bf.credential-missing-on-saved-profile-connect.yml)

Driver: the Task 8 fix (`windows-native` feature flag on keyring) is a critical institutional lesson that is **not yet captured in architecture docs**. Implementation itself is approval-ready; the CONCERNS gate is about preventing a future `cargo update` or dependency review from silently regressing the same bug. See `DOC-BF-001` in the gate file for the two-part remediation (architecture note + CI defense).

Quality score: **90** (100 − 0 FAILs × 20 − 1 CONCERNS × 10).

### Recommended Status

**✗ Changes Required — see unchecked items above.** Specifically: the two **immediate** recommendations (architecture-doc note for `windows-native`, and the Task 5 smoke test completion) should land before "Done". The rest are future follow-ups and do not block this story.

That said: if the team decides the architecture-doc note can be a follow-up brownfield ticket (rather than blocking this story), this gate could be revised to PASS — the implementation itself is solid. Story owner decides.

