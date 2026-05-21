# Story: Surface a clear error when the app runs outside the Tauri shell

<!-- Source: User bug report (screenshot) + docs/architecture/13-development-workflow.md + docs/architecture/18-error-handling-strategy.md -->
<!-- Context: Brownfield fix to the Connection screen IPC layer (Epic 2 — PostgreSQL Connection & Schema Extraction) -->

## Status

Done

## Story

**As a** user (or developer) opening the SchemaLift frontend in a plain browser via `npm run dev`,
**I want** to see a clear, actionable error telling me the desktop shell is required,
**so that** I don't waste time chasing a cryptic `Cannot read properties of undefined (reading 'invoke')` stack trace.

## Context Source

- **Source Document**: User bug report (screenshot of Connection screen showing `Cannot read properties of undefined (reading 'invoke')` under the "Test Connection" button)
- **Enhancement Type**: Bug fix + error-UX hardening (no behaviour change inside the Tauri shell)
- **Existing System Impact**: Affects every command in [src/commands/index.ts](src/commands/index.ts) — but only when the frontend runs outside the Tauri WebView. Zero change to in-shell behaviour.

## Acceptance Criteria

1. **Clear error on the Connection screen.** When `window.__TAURI_INTERNALS__` is undefined (i.e., the page is loaded in a browser at `http://localhost:1420` rather than the Tauri shell), clicking **Test Connection** displays a human-readable banner via the existing `TestConnectionBanner` that says, in substance: *"This app must be launched via `npm run tauri dev` (or the installed desktop build). Browser-only mode cannot reach the database."* It does **not** show `Cannot read properties of undefined (reading 'invoke')`.
2. **Same guarantee for every other command.** Every wrapper in [src/commands/index.ts](src/commands/index.ts) (`testConnection`, `connectAndExtractSchema`, `disconnect`, `listProfiles`, `saveProfile`, `deleteProfile`, `renameProfile`, `connectWithSavedProfile`, `loadAnnotations`, `upsertAnnotation`, `deleteAnnotation`) rejects with a structured error shaped like `TauriCommandError` (`{ code: 'TauriBridgeMissing', message: <user-facing string> }`) instead of throwing the raw `TypeError`. Existing `useEffect` calls that swallow errors (e.g. `commands.listProfiles().catch(...)` in [src/components/connection/ConnectionForm.tsx:44](src/components/connection/ConnectionForm.tsx:44)) continue to no-op silently.
3. **No regression inside the Tauri shell.** When launched with `npm run tauri dev` or the packaged `.exe`, every command behaves identically to today — the detection adds zero round-trips and does not change request shape or response shape.
4. **The error is recognisable as the same family as other connection errors.** It surfaces through the existing two-error-surface model (store state for the Connection screen, see [docs/architecture/18-error-handling-strategy.md:46](docs/architecture/18-error-handling-strategy.md:46)). No new modal, toast, or screen is introduced.
5. **A persistent visual hint appears on app load when running in browser mode.** A single subdued banner at the top of `AppShell` reads "Running in browser-only preview — Tauri IPC unavailable. Launch via `npm run tauri dev` for database features." This satisfies the "developer iterating on UI in a browser" use case documented at [docs/architecture/13-development-workflow.md:42](docs/architecture/13-development-workflow.md:42) without breaking that workflow.
6. **Vitest coverage exists.** A unit test in `src/__tests__/commands.test.ts` (new file) verifies that when `window.__TAURI_INTERNALS__` is undefined, `commands.testConnection(...)` rejects with `{ code: 'TauriBridgeMissing', message: <non-empty string> }`. The existing `ConnectionForm.test.tsx` test suite continues to pass unchanged (it already stubs `invoke`).

## Tasks / Subtasks

- [x] **Task 1: Add a Tauri-bridge detector helper.** (AC: 1, 2, 3)
  - [x] Create `src/lib/tauriBridge.ts` exporting `isTauriAvailable(): boolean` — returns `typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window`.
  - [x] Export a constant `TAURI_BRIDGE_MISSING_MESSAGE` with the user-facing string from AC1. Keep the message in one place so banner + error reuse it.

- [x] **Task 2: Guard every wrapper in `src/commands/index.ts`.** (AC: 1, 2, 3)
  - [x] At the top of every wrapper, if `!isTauriAvailable()`, return `Promise.reject({ code: 'TauriBridgeMissing', message: TAURI_BRIDGE_MISSING_MESSAGE })` instead of calling `invoke(...)`.
  - [x] Implementation note: factor this through a tiny `invokeOrReject<T>(name, args)` wrapper so the guard isn't duplicated 11 times.
  - [x] Do **not** add the `'TauriBridgeMissing'` code to `src-tauri/src/errors.rs` — it is a frontend-only synthetic error that never crosses the IPC boundary. Document this in a one-line comment in `tauriBridge.ts`.

- [x] **Task 3: Update `TestConnectionBanner` consumption (no component change).** (AC: 1, 4)
  - [x] Verify that `ConnectionForm.handleSubmit` at [src/components/connection/ConnectionForm.tsx:64](src/components/connection/ConnectionForm.tsx:64) already routes thrown errors through `setConnectionStatus('error', tauri?.message ?? String(err))`. It does — the new structured rejection from Task 2 will flow through unchanged. No edit needed beyond confirming.
  - [x] Do the same confirmation for the `Connect & Browse Schema` handler at [src/components/connection/ConnectionForm.tsx:175](src/components/connection/ConnectionForm.tsx:175).

- [x] **Task 4: Add the persistent browser-mode banner to `AppShell`.** (AC: 5)
  - [x] Read `src/components/layout/AppShell.tsx` first to learn the current layout slot pattern.
  - [x] Render the banner only when `!isTauriAvailable()`. Use `text-muted-foreground` + `bg-muted` styling so it reads as informational, not as an error.
  - [x] The banner must not push the routed content off-screen on the smallest supported window (900×600 per `tauri.conf.json`).

- [x] **Task 5: Add vitest coverage.** (AC: 6)
  - [x] Create `src/__tests__/commands.test.ts`.
  - [x] Test A: with `window.__TAURI_INTERNALS__` deleted, `commands.testConnection({...})` rejects with `{ code: 'TauriBridgeMissing', message: expect.stringContaining('tauri dev') }`.
  - [x] Test B: with `window.__TAURI_INTERNALS__` set to a truthy stub and `invoke` mocked, `commands.testConnection({...})` resolves normally — i.e. the guard does not short-circuit when the bridge is present.
  - [x] Verify existing `ConnectionForm.test.tsx`, `ProfileList.test.tsx`, `ProfileDropdown.test.tsx`, `SaveProfileInline.test.tsx` still pass — they mock `invoke` already, so the guard sees a present bridge and is inert.

- [ ] **Task 6: Manual smoke test in both modes.** (AC: 1, 3, 5) — **DEFERRED TO USER**: requires interactive browser + a running Tauri shell + a real Postgres; the dev agent cannot drive these. Automated coverage (Tasks 5 + AppShell banner tests) substitutes for AC1/AC5 in CI but does not replace a live double-mode smoke check.
  - [ ] `npm run dev` → open `http://localhost:1420` in Chrome → confirm the AppShell banner is visible and "Test Connection" shows the new clear error instead of the cryptic stack trace.
  - [ ] `npm run tauri dev` → confirm the AppShell banner is **absent** and a real connection attempt to a Postgres instance behaves identically to today.

- [x] **Task 7: Cross-link the workflow doc.** (AC: 5)
  - [x] In `docs/architecture/13-development-workflow.md` near the `npm run dev` line at line 42, add a one-line note: *"The frontend will display a banner indicating the Tauri IPC bridge is unavailable; database actions are intentionally disabled in this mode."*

## Risk Assessment

### Implementation Risks

- **Primary Risk**: Misdetecting Tauri presence — either failing to detect it inside the shell (would break the live app) or false-positively detecting it in the browser (would let the cryptic error through). Tauri v2 sets `window.__TAURI_INTERNALS__` before the frontend bundle evaluates, so the check is reliable, but a future Tauri upgrade could rename the global.
  - **Mitigation**: Put the check behind a single helper (`isTauriAvailable`) so a future rename is one-file. Add Test B in Task 5 to lock in the positive-detection path.
  - **Verification**: Task 6 smoke test in both modes is the definitive check.

- **Secondary Risk**: Side-effect-free `useEffect` calls (e.g. `commands.listProfiles().catch(() => {})` at [src/components/connection/ConnectionForm.tsx:44](src/components/connection/ConnectionForm.tsx:44)) start logging structured rejections to the console where they previously logged a `TypeError`. Cosmetic only.
  - **Mitigation**: The existing `.catch(() => {})` swallows them already. No code change needed; just confirm the console isn't noisy after the change.

- **Tertiary Risk**: The AppShell banner is visible on a developer's screen recording / demo of the browser-only UI iteration workflow. Some teams may dislike the visual pollution.
  - **Mitigation**: Use muted styling per Task 4. If pushback arises, the banner is one component to remove.

### Rollback Plan

1. `git revert` the single commit (or hand-revert: delete `src/lib/tauriBridge.ts`, revert `src/commands/index.ts` to use bare `invoke`, remove the `AppShell` banner block, delete `src/__tests__/commands.test.ts`).
2. No data migration, no IPC schema change, no Rust change — rollback is purely a frontend revert with zero state implications.

### Safety Checks

- [ ] Inside-Tauri-shell smoke test (Task 6) confirms zero behaviour change before merge.
- [ ] All 11 wrapper functions in `src/commands/index.ts` are routed through the same `invokeOrReject` helper — no chance of partial coverage.
- [ ] The new synthetic error code `TauriBridgeMissing` is documented in a code comment so a future reader doesn't grep `src-tauri/` looking for it.

## Dev Technical Guidance

### Existing System Context

- The app is a Tauri v2 desktop shell wrapping a React 18 + Vite SPA. Every backend interaction goes through `@tauri-apps/api/core`'s `invoke()`, wrapped per-command in [src/commands/index.ts](src/commands/index.ts).
- Error contract is defined at [docs/architecture/18-error-handling-strategy.md:30](docs/architecture/18-error-handling-strategy.md:30): rejections are `{ code, message }`. The Connection screen consumes them via the store's `setConnectionStatus('error', message)` path.
- The architecture explicitly supports a "frontend-only browser mode" for UI iteration ([docs/architecture/13-development-workflow.md:42](docs/architecture/13-development-workflow.md:42)) but the UI has no awareness of it today, hence the cryptic `TypeError`.

### Integration Approach

- A frontend-only guard. **No Rust changes.** The new synthetic error never reaches the Tauri bridge — it short-circuits in TypeScript before `invoke` is ever called.
- Reuses the existing `TauriCommandError` shape so consumers (e.g. `(err as TauriCommandError).message ?? 'Connection failed'` at [src/components/connection/ConnectionForm.tsx:199](src/components/connection/ConnectionForm.tsx:199)) need no changes.

### Technical Constraints

- Must not add any new dependency. The detection is a one-line `'__TAURI_INTERNALS__' in window` check.
- Must not change the public TypeScript signature of any wrapper in `src/commands/index.ts` — downstream callers should be unaffected.
- The synthetic `code: 'TauriBridgeMissing'` value must **not** collide with any Rust-side `AppError` variant. Rust variants today (per [docs/stories/2.1.story.md:29](docs/stories/2.1.story.md:29)) are `HostUnreachable`, `AuthFailed`, `DatabaseNotFound`, `ConnectionTimeout`, `Internal`. `TauriBridgeMissing` is distinct — safe.

### Files Touched (expected)

- **New**: `src/lib/tauriBridge.ts`, `src/__tests__/commands.test.ts`
- **Modified**: `src/commands/index.ts`, `src/components/layout/AppShell.tsx`, `docs/architecture/13-development-workflow.md`
- **Unchanged**: any Rust file under `src-tauri/`, any other React component, any store slice

### Missing Information

None blocking. One judgement call for the dev agent: **wording of the banner / error message**. The story specifies the substance ("must be launched via `npm run tauri dev`") but exact phrasing is at the dev's discretion as long as it (a) names the command and (b) avoids jargon like "IPC bridge" in the AC1 banner shown to end-users. (The AppShell developer banner in AC5 may use slightly more technical phrasing since its audience is the developer who started `npm run dev`.)

---

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) — BMad `dev` agent (James)

### Debug Log References

- `npm run test -- --run` (first pass): 1 failed / 222 passed. Failing test: `src/__tests__/ConnectionForm.test.tsx:136` — `expect(mockInvoke).toHaveBeenCalledWith('list_profiles')`. Root cause: my `invokeOrReject('list_profiles')` was forwarding `undefined` as the second positional arg, so the actual call became `invoke('list_profiles', undefined)` — strict-arg mismatch.
- Fix: in `invokeOrReject`, drop the second arg when it is `undefined` so the public arity matches the original `invoke('list_profiles')` call. This preserves the existing IPC call-site shape for downstream test assertions and is a no-op at runtime (Tauri's `invoke` treats missing and `undefined` second args identically).
- `npm run test -- --run` (second pass): **25 files / 223 tests passed.**
- `npx tsc --noEmit`: clean.
- `npm run lint`: clean.

### Completion Notes List

1. **Frontend-only synthetic error**: `TauriBridgeMissing` lives entirely in TypeScript ([src/lib/tauriBridge.ts](src/lib/tauriBridge.ts)) and never round-trips through `src-tauri/`. The Rust `AppError` enum is untouched. A one-line comment in `tauriBridge.ts` documents why a future maintainer will not find this code in `src-tauri/src/errors.rs`.
2. **One central guard, eleven inert call sites**: every wrapper in [src/commands/index.ts](src/commands/index.ts) routes through `invokeOrReject<T>(name, args)`. Adding a new IPC command in the future automatically inherits the guard — there is no per-command opt-in to remember.
3. **Test setup hardening**: `src/__tests__/setup.ts` now seeds `window.__TAURI_INTERNALS__ = {}` so the guard treats the test environment as "bridge present" by default. This protects all 21 pre-existing test files from accidental short-circuits and matches the story's premise that *"they mock `invoke` already, so the guard sees a present bridge and is inert."* Per-test simulation of browser-only mode is done by `delete window.__TAURI_INTERNALS__` inside a `try`/`finally` so the suite stays isolated.
4. **AppShell layout reflow**: the original layout was a single horizontal flex (`flex bg-…`). To slot the banner above the sidebar+main pair without pushing content off-screen at 900×600, I switched the root to a column flex and wrapped the existing sidebar+main pair in `<div className="flex-1 flex min-h-0">`. The `min-h-0` is load-bearing — without it the inner flex children compute their min-content height instead of yielding to overflow, which would defeat the banner's `shrink-0`. Visual styling is `bg-muted` + `text-muted-foreground` + `text-xs` per the AC5 "subdued" mandate.
5. **Banner is intentionally hidden inside the Tauri shell** — `isTauriAvailable()` returns true there, the conditional `{!tauriAvailable && …}` short-circuits, the banner DOM is not rendered, and the layout collapses back to its original single-row form (the outer flex-col with a single flex-1 child is visually identical to the old single flex row).
6. **Two-error-surface model preserved** (AC4): `TauriBridgeMissing` flows through the existing store path (`setConnectionStatus('error', message)`), so it renders inside `TestConnectionBanner`. No new toast, modal, or screen. The persistent `AppShell` banner from AC5 is informational, not an error surface.
7. **Task 6 deferred**: see the `Tasks / Subtasks` checkbox — the manual smoke test in both modes requires a human at a keyboard, an active Tauri shell, and a real PostgreSQL instance. Automated coverage substitutes for AC1 and AC5 in CI (see new tests in `commands.test.ts` and the updated `AppShell.test.tsx`), but the live double-mode check is a user responsibility before merge.

### File List

**New:**
- `src/lib/tauriBridge.ts`
- `src/__tests__/commands.test.ts`

**Modified:**
- `src/commands/index.ts` — every wrapper routed through `invokeOrReject`.
- `src/components/layout/AppShell.tsx` — added conditional browser-only banner and adjusted root layout to column flex.
- `src/__tests__/setup.ts` — seeded `window.__TAURI_INTERNALS__` so the guard treats the test env as bridge-present by default.
- `src/__tests__/AppShell.test.tsx` — added 2 new tests for the banner presence/absence.
- `docs/architecture/13-development-workflow.md` — added one-line note near the `npm run dev` block.

**Unchanged (as scoped):** every file under `src-tauri/`, all other React components, all other store slices.

### Change Log

| Date       | Version | Description                                                                                              | Author |
|------------|---------|----------------------------------------------------------------------------------------------------------|--------|
| 2026-05-20 | 0.1.0   | Initial implementation. AC1–AC5 + AC6 satisfied via code + tests. AC6 manual smoke test deferred to user. | James (dev) |

### Story DoD Self-Assessment

1. **Requirements Met**
   - [x] AC1 — `TestConnectionBanner` surfaces `TAURI_BRIDGE_MISSING_MESSAGE` (which contains the literal `npm run tauri dev` per AC1's substance requirement) via the existing `setConnectionStatus('error', …)` path; the raw `TypeError` cannot reach it because `invokeOrReject` short-circuits first.
   - [x] AC2 — all 11 wrappers route through `invokeOrReject`; the rejection shape is `{ code: 'TauriBridgeMissing', message: <string> }` (matches `TauriCommandError`); the silently-swallowed `commands.listProfiles().catch(…)` still no-ops because the `.catch` doesn't inspect the error.
   - [x] AC3 — `isTauriAvailable()` is a single synchronous `'__TAURI_INTERNALS__' in window` check that adds zero IPC round-trips; the request and response shapes of every wrapper are unchanged when the bridge is present.
   - [x] AC4 — the rejection is a `TauriCommandError` shape, so it flows through the same store-state-driven Connection-screen surface as `AuthFailed` / `HostUnreachable` / etc.; no new modal or toast.
   - [x] AC5 — `AppShell` renders a single subdued (`bg-muted` / `text-muted-foreground` / `text-xs`) banner only when `!isTauriAvailable()`, sized to not push content off-screen at 900×600 (achieved by `shrink-0` on the banner and `min-h-0` on the inner flex row).
   - [x] AC6 — `src/__tests__/commands.test.ts` covers both Test A (bridge absent → `TauriBridgeMissing` rejection with `expect.stringContaining('tauri dev')`) and Test B (bridge present → resolves through to mocked `invoke`); all 21 pre-existing test files still pass.

2. **Coding Standards & Project Structure**
   - [x] Operational guidelines: IPC commands stay in `src/commands/index.ts` per [docs/architecture/17-coding-standards.md:6](docs/architecture/17-coding-standards.md:6); helper goes in `src/lib/` per [docs/architecture/12-unified-project-structure.md:21](docs/architecture/12-unified-project-structure.md:21).
   - [x] Tech stack adherence: no new runtime dependency; reuses TypeScript 5.x, React 18.x, Vitest 4.x already in `package.json`.
   - [x] No linter / typecheck warnings: `npm run lint` and `npx tsc --noEmit` both clean.
   - [x] Comments are limited to the one-line "frontend-only synthetic error" note in `tauriBridge.ts` (clarifies a non-obvious WHY for a future Rust-side searcher) and three short justification comments in `setup.ts` and `AppShell.tsx`. No noise comments added.

3. **Testing**
   - [x] Unit tests added (`commands.test.ts`, plus 2 AppShell tests). All 25 test files / 223 tests pass on the second run.
   - [N/A] Integration / E2E — project explicitly has no E2E layer (see [docs/architecture/3-tech-stack.md:21](docs/architecture/3-tech-stack.md:21) "E2E Testing: None (MVP)").

4. **Functionality & Verification**
   - [x] Automated verification: full vitest suite green, typecheck green, lint green.
   - [ ] Manual two-mode smoke test (AC6 Task 6) — **deferred to user**, see Completion Note #7. The dev agent cannot drive an interactive browser or the Tauri shell.
   - [x] Edge cases considered: bridge present, bridge absent, bridge restored mid-test (Test B follows Test A in the same file — `setup.ts` seeds the default, `try`/`finally` restores per-test).

5. **Story Administration**
   - [x] All in-scope task checkboxes ticked. Task 6 left unchecked with an inline `DEFERRED TO USER` note.
   - [x] All dev-time decisions documented in this Dev Agent Record.
   - [x] Change Log row added.

6. **Dependencies, Build & Configuration**
   - [x] No new runtime dependencies.
   - [x] Lint passes; typecheck passes; test build passes.
   - [N/A] No new env vars introduced.

7. **Documentation**
   - [x] `docs/architecture/13-development-workflow.md` updated per Task 7.
   - [x] Inline comments added where the WHY is non-obvious (synthetic-error scope, test-env bridge stub, layout `min-h-0`).

### Final Confirmation

Story `brownfield-tauri-bridge-missing.md` is **Ready for Review** with one explicit caveat: the AC6 Task 6 manual smoke test in both runtime modes is deferred to the user because it requires a real Tauri shell + real PostgreSQL + interactive browser. All other ACs are satisfied by code + automated tests; lint, typecheck, and the full 223-test vitest suite all pass.
