# Story: Add a "Compose Prompt" step with rich-text Natural-Language Query and Expected-Output fields

<!-- Source: User chat request (2026-05-21): "the system has to add comments per table, but i need to have a rich text editor to write the natural language query, then i add comment per table, but i need to have a rich text area to write the general natural language and the output expected" -->
<!-- Context: Brownfield feature addition — inserts a new prompt-composition step between Schema Browser and Prompt Preview. Per-table annotations stay untouched. -->

## Status

Approved

## Scope Risk — READ BEFORE STARTING

⚠️ **This story exceeds the brownfield-create-story budget (single focused dev session / ~4 hours).** The combined scope — new route + new screen + new TipTap dependency + two WYSIWYG editors + Markdown round-trip + prompt-generator extension + tests — is realistically **8–12 hours**. Per `.bmad-core/tasks/brownfield-create-story.md` ("If complexity grows during analysis, escalate to brownfield-create-epic"), the recommended split is:

| Sub-story | Scope | Est. |
|---|---|---|
| **A — Rich-text plumbing** | Add `@tiptap/react` + `@tiptap/starter-kit` + `tiptap-markdown`; build `RichTextEditor.tsx` wrapper with toolbar; tests for Markdown round-trip and toolbar interactions. No app-level wiring. | ~3 hr |
| **B — Compose screen + route** | New `/compose` route; `ComposeScreen.tsx` with two `RichTextEditor` instances; Zustand `query` + `expectedOutput` state; rename SchemaBrowserScreen "Generate Prompt" → "Next: Compose"; nav from Compose → Prompt Preview. Tests. | ~3 hr |
| **C — Prompt-generator integration** | Extend `generatePrompt` signature + body to weave query/expected-output Markdown around the schema block; update worked-example test; update Prompt Preview's empty-state copy if needed. | ~2 hr |

**Decision required from the story owner before starting Task 1:** proceed as a single story (this document, all tasks executed in order) **or** split per the table above and turn this document into a parent brownfield epic.

The remainder of this document is written to be **executable as a single story** if that path is chosen. If split, lift the relevant Acceptance Criteria + Tasks into each sub-story and treat this file as the epic landing page.

## Story

**As a** SchemaLift user building a prompt to paste into an LLM,
**I want** dedicated rich-text fields to write my natural-language query and my expected output **alongside** the schema selection,
**so that** the copied prompt block contains everything the LLM needs in one paste — the schema context, the question I'm actually asking, and the shape of the answer I want — instead of forcing me to re-type the question into the LLM after pasting just the schema.

## Context Source

- **Source Document**: User chat request (2026-05-21). Full quote pinned in the file-level comment at the top of this story.
- **Enhancement Type**: Feature addition — new prompt-composition step between Schema Browser and Prompt Preview. Per-table column/table annotations (`src/components/schema/AnnotationInput.tsx`) **stay untouched** in this story.
- **Existing System Impact**:
  - **NEW**: `/compose` route, `ComposeScreen.tsx`, `RichTextEditor.tsx`, two Zustand fields (`query`, `expectedOutput`), three npm dependencies (`@tiptap/react`, `@tiptap/starter-kit`, `tiptap-markdown`).
  - **CHANGED**: `SchemaBrowserScreen` (button label + nav target only), `generatePrompt` (signature gains two params; output gains preface + suffix), `promptGenerator.test.ts` (worked example + 4 new tests), `App.tsx` (one new `<Route>`).
  - **UNCHANGED**: Rust backend (no IPC change). `PromptPreviewScreen` (still receives a `PromptBlock`; the content just contains more). Per-table annotations. `AppShell` nav (Compose is a workflow step, not a top-level nav item — see Task 3 rationale).

## Acceptance Criteria

1. **New `/compose` route exists** between `/schema` and `/prompt`. Direct navigation to `/compose` with no active selection shows an empty-state message and a "Back to Schema Browser" button (parallels how `/prompt` handles `prompt === null` today at [PromptPreviewScreen.tsx:11-21](src/screens/PromptPreviewScreen.tsx:11)).

2. **Schema Browser button is renamed and rerouted.** [SchemaBrowserScreen.tsx:42](src/screens/SchemaBrowserScreen.tsx:42)'s "Generate Prompt" button becomes **"Next: Compose Prompt"**, navigates to `/compose` (not `/prompt`), and **no longer calls `generatePrompt`** itself. The button stays disabled when `selectedTables.size === 0`.

3. **Compose screen has two rich-text editors** stacked vertically, each ~200 px tall, each with a toolbar exposing: bold, italic, inline code, bullet list, ordered list, link. The editors are:
   - **Natural-Language Query** — labelled "What do you want to ask?" with a short helper line beneath. Placeholder: *"e.g., Write a SQL query that returns the top 10 customers by total order value in the last 30 days."*
   - **Expected Output** — labelled "What kind of answer do you want back?" with a short helper line beneath. Placeholder: *"e.g., A single SELECT statement with column aliases. Include a one-line comment above the query explaining the join."*

4. **Markdown round-trip is lossless for the supported feature set.** Bold, italic, inline code, lists, and links survive: type in the editor → Zustand stores Markdown → user navigates away → user returns → editor re-hydrates from Markdown with the same visual state. **Out-of-scope (post-MVP):** tables, images, code blocks with language hints, headings beyond plain text. The starter kit's headings and code-block extension may stay enabled (free with `StarterKit`), but the toolbar exposes no button for them.

5. **Generated prompt weaves the query and expected output around the schema.** `generatePrompt(tree, tables, columns, annotations, query, expectedOutput)` returns a `PromptBlock.content` shaped as:
   ```
   <query Markdown>           ← omitted entirely (no leading whitespace) when query is empty or whitespace-only
   <one blank line>
   Here is my database schema:

   <schema blocks as today>

   <one blank line>
   Expected output:
   <expectedOutput Markdown>  ← entire "Expected output:" section omitted when expectedOutput is empty or whitespace-only
   ```
   When **both** query and expectedOutput are empty, the output is **byte-for-byte identical** to today's output (regression test in Task 12).

6. **Compose → Preview is a one-click step.** A "Generate Prompt" button on Compose calls the extended `generatePrompt`, writes the result to `prompt` via `setPrompt`, and navigates to `/prompt`. The button is enabled whenever `selectedTables.size > 0` (query and expectedOutput are both optional — empty values just collapse out of the prompt per AC 5).

7. **Query and expectedOutput are session-scoped in this story.** They live in Zustand only — **no SQLite persistence, no `connection_profile_id` foreign key, no Rust IPC**. Reconnecting, switching profiles, or restarting the app clears them. (Persistence is explicitly deferred to a future story; capturing the requirement here so it doesn't sneak in.)

8. **Existing functionality regression-tested.**
   - All current promptGenerator tests pass without modification **except** the worked-example test (Task 12 updates it to pass the two new args). The schema-only output is unchanged when both new params are empty.
   - The Schema Browser flow with the renamed button continues to work end-to-end: select tables → Next: Compose → Generate Prompt → Prompt Preview shows the prompt.
   - Per-table annotations (`AnnotationInput.tsx`) continue to work and continue to render as today inside `CREATE TABLE` blocks.

9. **No new Rust code, no new IPC command, no new dependency in `src-tauri/`.** The three new npm packages are frontend-only.

10. **Bundle-size budget.** The new TipTap dependencies are expected to add **~80–120 kB gzipped** to the bundle. The Dev Agent must report the post-build bundle size in Completion Notes and call out the delta vs. the current baseline (78.48 kB gz per Story 4.3 Dev Agent Record); if the delta exceeds 150 kB gz, raise a discussion before merging rather than silently shipping the regression.

## Tasks / Subtasks

### Dependency setup

- [ ] **Task 1: Add TipTap dependencies.** (AC: 3, 4, 10)
  - [ ] `npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link tiptap-markdown`. The four packages together provide the editor (`@tiptap/react`), the default extension bundle (`@tiptap/starter-kit` — paragraph, bold, italic, code, lists, history, etc.), the link extension (separate package — not in StarterKit), and Markdown round-trip serialization (`tiptap-markdown`).
  - [ ] Verify `package.json` shows pinned versions and `package-lock.json` is regenerated. Run `npm run build` once after install to surface any peer-dependency warnings before writing any new code; if a peer warning fires, document the resolution in Completion Notes.

### Frontend — types, store

- [ ] **Task 2: Extend the Zustand store with the two new fields.** (AC: 4, 6, 7, 8)
  - [ ] In [src/store/appStore.ts:5-37](src/store/appStore.ts:5), add to the `AppState` interface alongside `prompt`:
    ```typescript
    query: string                                   // Markdown
    expectedOutput: string                          // Markdown
    setQuery: (markdown: string) => void
    setExpectedOutput: (markdown: string) => void
    ```
  - [ ] Add the initial values (`query: ''`, `expectedOutput: ''`) to the `create(...)` body next to `prompt: null`.
  - [ ] Add `setQuery` and `setExpectedOutput` setters next to `setPrompt`:
    ```typescript
    setQuery: (markdown) => set({ query: markdown }),
    setExpectedOutput: (markdown) => set({ expectedOutput: markdown }),
    ```
  - [ ] **Extend `clearConnection`** ([src/store/appStore.ts:54-67](src/store/appStore.ts:54)) to also reset `query: ''` and `expectedOutput: ''`. AC 7 requires session-scope; disconnecting must drop the in-flight prompt intent so the next profile starts clean.
  - [ ] **Do NOT** add a corresponding TypeScript type in `src/types/index.ts` — `string` is the wire type, and there's no IPC roundtrip to mirror. [Source: docs/architecture/17-coding-standards.md#171-critical-fullstack-rules ("Type Mirroring" applies only to IPC payloads)]

### Frontend — RichTextEditor component

- [ ] **Task 3: Create `src/components/prompt/RichTextEditor.tsx`.** (AC: 3, 4)
  - [ ] Single reusable wrapper. Props:
    ```typescript
    interface RichTextEditorProps {
      value: string                                 // controlled — Markdown
      onChange: (markdown: string) => void
      placeholder?: string
      ariaLabel: string
      minHeightClass?: string                       // default "min-h-[200px]"
    }
    ```
  - [ ] Internal structure:
    - `useEditor` from `@tiptap/react` with extensions: `StarterKit`, `Link.configure({ openOnClick: false })`, `Markdown` (from `tiptap-markdown`).
    - Initialize editor content from `value` using `editor.commands.setContent(parsed, false)` via the Markdown extension's `setContent` helper — **do NOT** call `setContent(value)` raw with the literal Markdown string (it would render the asterisks as literals).
    - On `editor.on('update', ...)`, call `onChange(editor.storage.markdown.getMarkdown())`.
    - **Re-hydrate from prop changes:** when the `value` prop changes externally (e.g., navigating away and back), the editor must update its content. Use a `useEffect` keyed on `value` that compares the current `editor.storage.markdown.getMarkdown()` with the incoming `value` and only calls `setContent` when they diverge — without the equality guard you get an infinite loop with `onChange`.
    - Toolbar above the editor area: six buttons (bold / italic / inline code / bullet list / ordered list / link). Use `lucide-react` icons (`Bold`, `Italic`, `Code`, `List`, `ListOrdered`, `Link2`) already in the project (`package.json` dep). Toggle state via `editor.isActive('bold')` etc., to give visual feedback on the active button.
    - Link button opens a small inline prompt: `const url = window.prompt('URL:')` → `editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()`. Empty url removes the link. Don't pull in a modal component for this story.
  - [ ] Container styling: bordered rounded box matching the project's existing aesthetic (`border border-border rounded bg-background`). Toolbar: `flex gap-1 p-1 border-b border-border`. Editor area: `prose prose-sm prose-invert max-w-none p-3 min-h-[200px] focus:outline-none` — the `prose` classes give sensible WYSIWYG-ish defaults from `@tailwindcss/typography` **IF** that plugin is already installed; if not, fall back to manual styles (a one-liner per element class). **Verify by reading `tailwind.config.js`** before adding the `prose` classes; do NOT add a new Tailwind plugin in this story.
  - [ ] Accessibility:
    - The editor container has the supplied `aria-label`.
    - Each toolbar button has an `aria-label` (e.g., `"Bold"`, `"Insert link"`).
    - Placeholder uses the Tiptap `Placeholder` extension — **also add `@tiptap/extension-placeholder`** to Task 1's install line (was omitted above — add it).
  - [ ] **Why no shadcn `Toolbar`:** consistent with Story 4.3's "no new shadcn primitive" stance. Six icon buttons in a flex container is enough.

### Frontend — Compose screen + routing

- [ ] **Task 4: Create `src/screens/ComposeScreen.tsx`.** (AC: 1, 3, 6, 7)
  - [ ] Skeleton:
    ```typescript
    import { FC } from 'react'
    import { useNavigate } from 'react-router-dom'
    import { Button } from '@/components/ui/button'
    import { useAppStore } from '@/store/appStore'
    import { generatePrompt } from '@/lib/promptGenerator'
    import RichTextEditor from '@/components/prompt/RichTextEditor'

    const ComposeScreen: FC = () => {
      const navigate = useNavigate()
      const schemaTree = useAppStore(s => s.schemaTree)
      const selectedTables = useAppStore(s => s.selectedTables)
      const selectedColumns = useAppStore(s => s.selectedColumns)
      const annotations = useAppStore(s => s.annotations)
      const query = useAppStore(s => s.query)
      const expectedOutput = useAppStore(s => s.expectedOutput)
      const setQuery = useAppStore(s => s.setQuery)
      const setExpectedOutput = useAppStore(s => s.setExpectedOutput)
      const setPrompt = useAppStore(s => s.setPrompt)

      const canGenerate = schemaTree !== null && selectedTables.size > 0

      if (!canGenerate) {
        return (
          <div className="p-6 flex flex-col gap-3">
            <h1 className="text-2xl font-bold">Compose Prompt</h1>
            <p className="text-sm text-muted-foreground">No tables selected yet.</p>
            <Button variant="outline" size="sm" className="w-fit" onClick={() => navigate('/schema')}>
              Back to Schema Browser
            </Button>
          </div>
        )
      }

      const handleGenerate = () => {
        if (schemaTree === null) return
        const block = generatePrompt(schemaTree, selectedTables, selectedColumns, annotations, query, expectedOutput)
        setPrompt(block)
        navigate('/prompt')
      }

      return (
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div>
              <h1 className="text-lg font-semibold">Compose Prompt</h1>
              <p className="text-xs text-muted-foreground">
                {selectedTables.size} {selectedTables.size === 1 ? 'table' : 'tables'} selected
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/schema')}>Back</Button>
              <Button variant="default" size="sm" onClick={handleGenerate}>Generate Prompt</Button>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 flex flex-col gap-6">
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">What do you want to ask?</h2>
              <p className="text-xs text-muted-foreground">
                The natural-language question that goes above the schema in your final prompt.
              </p>
              <RichTextEditor
                value={query}
                onChange={setQuery}
                placeholder="e.g., Write a SQL query that returns the top 10 customers by total order value in the last 30 days."
                ariaLabel="Natural language query"
              />
            </section>
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">What kind of answer do you want back?</h2>
              <p className="text-xs text-muted-foreground">
                Optional. Describe the format or constraints the LLM should follow.
              </p>
              <RichTextEditor
                value={expectedOutput}
                onChange={setExpectedOutput}
                placeholder="e.g., A single SELECT statement with column aliases. Include a one-line comment above the query explaining the join."
                ariaLabel="Expected output"
              />
            </section>
          </div>
        </div>
      )
    }

    export default ComposeScreen
    ```
  - [ ] **Why guard on `schemaTree !== null && selectedTables.size > 0` (not just `selectedTables.size > 0`):** the user may land on `/compose` after a disconnect-then-reconnect race where `schemaTree` is null while the previous selection lingered in state. Guarding both avoids a null deref inside `generatePrompt`.

- [ ] **Task 5: Wire the route in `src/App.tsx`.** (AC: 1)
  - [ ] Add `import ComposeScreen from '@/screens/ComposeScreen'` and a `<Route path="compose" element={<ComposeScreen />} />` between the `schema` and `prompt` routes (so the source order matches the user flow). [Source: src/App.tsx:13-17]
  - [ ] **Do NOT** add a NavItem to `AppShell.tsx`. Compose is a workflow step, not a top-level destination — the same reason Prompt Preview's nav item is *only* useful when there's a generated prompt. (If a future story decides to add either, that's its scope.)

### Frontend — wire Schema Browser to the new step

- [ ] **Task 6: Rename and reroute the Schema Browser action button.** (AC: 2, 8)
  - [ ] In [src/screens/SchemaBrowserScreen.tsx:42-44](src/screens/SchemaBrowserScreen.tsx:42), change the button label to `Next: Compose Prompt` and the `onClick` to navigate to `/compose` instead of calling `handleGeneratePrompt`. Remove the now-unused `handleGeneratePrompt` function and the unused imports (`generatePrompt` from `@/lib/promptGenerator`, `setPrompt` from the store) — TypeScript will surface them.
  - [ ] **Do NOT** clear `query` / `expectedOutput` on this navigation. Round-tripping (Schema Browser ⇄ Compose) without losing in-flight drafts is desired UX.
  - [ ] Update [src/__tests__/SchemaBrowserScreen.test.tsx](src/__tests__/SchemaBrowserScreen.test.tsx) tests accordingly (Task 11).

### Frontend — prompt generator extension

- [ ] **Task 7: Extend `generatePrompt` to weave query + expectedOutput.** (AC: 5, 8)
  - [ ] In [src/lib/promptGenerator.ts:10-15](src/lib/promptGenerator.ts:10), update the signature:
    ```typescript
    export function generatePrompt(
      schemaTree: SchemaTree,
      selectedTables: Set<string>,
      selectedColumns: Set<string>,
      annotations: Map<string, Annotation>,
      query: string = '',
      expectedOutput: string = '',
    ): PromptBlock {
      // ... existing body builds `content` up to the schema portion
      const trimmedQuery = query.trim()
      const trimmedOutput = expectedOutput.trim()

      const parts: string[] = []
      if (trimmedQuery !== '') parts.push(trimmedQuery)
      parts.push(content)  // schema block, including the trailing newline
      if (trimmedOutput !== '') parts.push(`Expected output:\n${trimmedOutput}\n`)
      return { content: parts.join('\n'), tableCount, columnCount, generatedAt }
    }
    ```
  - [ ] **Defaults to `''`** so all existing callers (and existing tests) compile unchanged. This is the key to AC 8's "no regression when both are empty" — when both default args are `''`, the join collapses to `parts.join('\n') === content`, byte-for-byte identical.
  - [ ] **Separator discipline:**
    - Between query and schema: exactly one blank line (`'\n'.join(['queryEndsWithoutNL', 'Here is my schema...'])` adds one newline; since `content` already starts with `Here is my database schema:\n...` and ends with `\n`, this works out).
    - Between schema and "Expected output:": one blank line. Since `content` ends with `;\n` (for non-empty selections) or `(No tables selected.)\n`, prepending another `\n` via `parts.join('\n')` adds the blank line.
    - **No double-trailing newline.** The final result ends with one `\n`. Test in Task 12 asserts this exactly.

### Frontend — Prompt Preview meta line

- [ ] **Task 8: Update Prompt Preview header to reflect the new prompt structure.** (AC: 5, 8)
  - [ ] [PromptPreviewScreen.tsx:26-33](src/screens/PromptPreviewScreen.tsx:26)'s header subline currently says "N tables, M columns — generated HH:MM". Keep this format. **Do NOT** add a "with query" / "with expected output" annotation in the header — the prompt text itself is the source of truth and adding a meta annotation would just create another place to maintain. Verify by reading the file: confirm no copy change is needed unless the rendering pre/pre-wrap behavior visually breaks for multi-paragraph Markdown content (it should not; `whitespace-pre overflow-x-auto` is already permissive). [Source: src/screens/PromptPreviewScreen.tsx:42-47]
  - [ ] **If** the rendered Markdown's longest line wraps awkwardly in the `<pre>`, this is acceptable for v1 — the user copies the raw text. Visual polish is a future story.

### Frontend — Tailwind config sanity check

- [ ] **Task 9: Confirm Tailwind typography plugin availability.** (AC: 3)
  - [ ] Read `tailwind.config.js`. If `@tailwindcss/typography` is in the plugins array, the `prose prose-sm prose-invert` classes in Task 3 work as-is. If not, **do not install it** — replace the `prose` classes in `RichTextEditor.tsx` with explicit styles (`text-sm leading-6 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_a]:underline [&_a]:text-primary`). Pick one approach and document the choice in Completion Notes.

### Frontend — Tests

- [ ] **Task 10: Create `src/__tests__/RichTextEditor.test.tsx`.** (AC: 3, 4)
  - [ ] Vitest + `@testing-library/react`. Tests:
    - [ ] `renders the placeholder when value is empty` — assert the placeholder text is in the document.
    - [ ] `applies the supplied aria-label to the editor container`.
    - [ ] `typing into the editor calls onChange with Markdown` — use `userEvent.type` on the contenteditable region; assert `onChange` is called with the expected Markdown string. (TipTap's contenteditable + Markdown serialization is async; use `await waitFor`.)
    - [ ] `clicking the Bold button toggles the active state` — assert `aria-pressed="true"` or the visual active class (whichever you implement); assert `onChange` is called with `**...**` Markdown after typing then bolding.
    - [ ] `external value change re-hydrates the editor without firing onChange recursively` — render with `value="initial"`, re-render with `value="**bold**"`, assert the editor's text content reflects the new value and `onChange` was NOT called from the prop change.
    - [ ] `Link button inserts a link with the supplied URL` — stub `window.prompt` to return `"https://example.com"`, select text, click Link, assert `onChange` is called with `[selectedText](https://example.com)`.
    - [ ] **One known TipTap-in-jsdom pitfall:** TipTap's selection model can complain in jsdom about missing range APIs. If a test fails on `Range.getBoundingClientRect`, polyfill it in `src/__tests__/setup.ts`: `Range.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON: () => ({}) }) as DOMRect`. Document the polyfill in Completion Notes if added.

- [ ] **Task 11: Update `src/__tests__/SchemaBrowserScreen.test.tsx`.** (AC: 2, 8)
  - [ ] Find the existing test that asserts on the "Generate Prompt" button label and clicks it. Update the label assertion to "Next: Compose Prompt" and update the navigation assertion: instead of expecting `setPrompt` to have been called, assert `useNavigate`-returned mock was called with `'/compose'`. (Mirror the pattern already used in this file for `useNavigate` mocking.)
  - [ ] If the existing test asserted on the prompt content, **delete that assertion** — generating the prompt is no longer Schema Browser's job. Add a comment one line above the test explaining why: `// Prompt generation moved to ComposeScreen (brownfield-compose-prompt-rich-text)`.

- [ ] **Task 12: Update + extend `src/__tests__/promptGenerator.test.ts`.** (AC: 5, 8)
  - [ ] **All existing tests must continue to pass without signature changes** — the new params default to `''`, so existing call sites (`generatePrompt(tree, tables, columns, annotations)`) compile and produce identical output.
  - [ ] Add four new tests:
    - [ ] `prepends the query block when query is non-empty`:
      ```typescript
      const { content } = generatePrompt(tree, tables, columns, new Map(), 'Show me the users.', '')
      expect(content.startsWith('Show me the users.\n\nHere is my database schema:')).toBe(true)
      ```
    - [ ] `appends the expected-output block when expectedOutput is non-empty`:
      ```typescript
      const { content } = generatePrompt(tree, tables, columns, new Map(), '', 'A single SELECT.')
      expect(content).toContain('\n\nExpected output:\nA single SELECT.\n')
      expect(content.endsWith('Expected output:\nA single SELECT.\n')).toBe(true)
      ```
    - [ ] `weaves both query and expectedOutput around the schema`:
      ```typescript
      const { content } = generatePrompt(tree, tables, columns, new Map(), 'Q', 'O')
      expect(content).toMatch(/^Q\n\nHere is my database schema:[\s\S]+;\n\nExpected output:\nO\n$/)
      ```
    - [ ] `whitespace-only query and expectedOutput collapse out`:
      ```typescript
      const { content: empty } = generatePrompt(tree, tables, columns, new Map(), '   \n\n', '\t')
      const { content: noArgs } = generatePrompt(tree, tables, columns, new Map())
      expect(empty).toBe(noArgs)
      ```
  - [ ] Update the existing `'matches the worked-example output verbatim'` test ([promptGenerator.test.ts:288](src/__tests__/promptGenerator.test.ts:288)) — **leave the test body untouched** (no Q/O passed → defaults apply → output unchanged) but add a short comment above explaining why no Q/O is passed: `// Worked-example covers the schema-only baseline; Q/O weaving is covered by the four tests immediately below.`

- [ ] **Task 13: Update `src/__tests__/appStore.test.ts` with three new tests.** (AC: 7, 8)
  - [ ] `setQuery updates the query field`: call `setQuery('**bold**')`, assert `useAppStore.getState().query === '**bold**'`.
  - [ ] `setExpectedOutput updates the expectedOutput field`: parallel test.
  - [ ] `clearConnection resets query and expectedOutput`: seed both via setters, then call `clearConnection()`, assert both are `''`.

- [ ] **Task 14: Create `src/__tests__/ComposeScreen.test.tsx`.** (AC: 1, 6, 7)
  - [ ] Mock `RichTextEditor` to a simple `<textarea>` for these tests (don't re-test TipTap; that's Task 10's job). Use `vi.mock('@/components/prompt/RichTextEditor', () => ({ default: ({ value, onChange, ariaLabel }: any) => <textarea aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)} /> }))`.
  - [ ] Tests:
    - [ ] `shows empty-state when no tables are selected`: render with `selectedTables: new Set()` → assert the "No tables selected yet." copy and the "Back to Schema Browser" button.
    - [ ] `renders both editors when tables are selected`: seed `selectedTables: new Set(['public.users'])` and a minimal `schemaTree`; assert both labelled regions are present.
    - [ ] `Generate Prompt button calls generatePrompt and navigates to /prompt`: seed selection + query; spy on `useNavigate`'s returned mock; click Generate; assert `useAppStore.getState().prompt !== null` and the nav mock was called with `'/prompt'`.
    - [ ] `Back button navigates to /schema and DOES NOT clear query/expectedOutput`: seed query/output, click Back, assert nav `'/schema'` and `useAppStore.getState().query` is unchanged.

### Verification gates

- [ ] **Task 15: Frontend gates.** (AC: 1–10)
  - [ ] `npm run lint` — clean.
  - [ ] `npx tsc --noEmit` — clean. Watch for any `any` leakage from the TipTap typings — fix or `// eslint-disable-next-line` with a one-line reason.
  - [ ] `npm run test -- --run` — all tests pass. Story 4.3 baseline was 219 passing; this story should land around 219 + ~15 new = ~234.
  - [ ] `npm run build` — clean; **report bundle size delta vs. baseline (78.48 kB gz) in Completion Notes**. If gz delta exceeds 150 kB, stop and raise with the story owner before merging (AC 10).

- [ ] **Task 16: Backend gates.** (AC: 9)
  - [ ] No backend changes — `cargo check` / `cargo test --lib` SHOULD pass without re-running (subject to the documented MSVC SDK / VS 2026 Insiders gap; see Stories 4.1/4.2/4.3). If a CI run is available, confirm green there.
  - [ ] Grep `rg "compose" src-tauri/` and confirm zero hits — defends AC 9.

- [ ] **Task 17: Manual end-to-end smoke test.** (AC: 1–8) — **DEFERRED TO USER** if MSVC toolchain blocks `npm run tauri dev` per the same constraint as Stories 4.1/4.2/4.3. Sub-bullets are unverified by the dev agent.
  - [ ] `npm run tauri dev`.
  - [ ] Connect to a database → Schema Browser → select 1–2 tables. Click **Next: Compose Prompt**. Confirm navigation to `/compose` with the meta line showing the table count.
  - [ ] Type a multi-line query with bold and a bullet list. Type an expected-output description with an inline code span and a link.
  - [ ] Click **Generate Prompt**. Confirm Prompt Preview shows: query Markdown at the top, schema block in the middle, "Expected output:" with the formatted Markdown at the bottom.
  - [ ] Click **Copy** on Prompt Preview. Paste into a plain-text editor. Confirm the Markdown is intact and the schema block is byte-identical to today's format.
  - [ ] Navigate back to Compose. Confirm both editors retain their content.
  - [ ] Navigate to Schema Browser → toggle a column. Click **Next: Compose**. Confirm both editors STILL retain their content (Task 6's "do not clear" requirement).
  - [ ] Disconnect (from Schema Browser). Confirm `query` and `expectedOutput` reset to empty when reconnecting (AC 7).
  - [ ] **Regression**: select tables → Compose with both editors EMPTY → Generate Prompt. Confirm the Prompt Preview output is byte-identical to a prompt generated under the current `main` branch with the same selection (i.e., schema-only, no query, no expected output). This is the AC 5 / AC 8 byte-for-byte claim.

## Risk Assessment

### Implementation Risks

- **Primary Risk: TipTap Markdown round-trip is lossy on edge cases.** `tiptap-markdown` is a community package; certain combinations (nested lists, links inside emphasis, code spans containing backticks) may round-trip to slightly different Markdown than what the user typed. If the user pastes the result into an LLM, this is generally fine — the LLM is tolerant. But if a test asserts byte-equality of round-tripped Markdown, it may flake.
  - **Mitigation**: Task 10's tests assert *visual* equivalence (re-render produces the same rendered text), not byte-equality of the Markdown string. Document any known lossy case in Completion Notes.
  - **Verification**: The round-trip test in Task 10 (`external value change re-hydrates...`) is the canary. If it passes for the supported feature set in AC 4, ship.

- **Secondary Risk: Bundle-size regression.** TipTap + StarterKit + tiptap-markdown + extension-link + extension-placeholder is meaningful — historically ~70–110 kB gzipped depending on tree-shaking effectiveness in Vite's prod build.
  - **Mitigation**: AC 10 makes the size delta a first-class gate. Task 15 requires reporting it.
  - **Verification**: If gz delta > 150 kB, the dev agent stops and raises before merging. A future optimization story could lazy-load `ComposeScreen.tsx` via `React.lazy` to push TipTap out of the initial bundle — explicitly NOT done in this story.

- **Tertiary Risk: jsdom test environment is hostile to TipTap.** TipTap relies on `Range`, `Selection`, and `getBoundingClientRect` APIs that jsdom partially implements. Tests may fail with cryptic stack traces from prosemirror-view.
  - **Mitigation**: Task 10 includes the canonical polyfill (`Range.prototype.getBoundingClientRect = ...`). If more polyfills are needed, add them to `src/__tests__/setup.ts` and document in Completion Notes.
  - **Verification**: If a TipTap test can't be coerced to pass in jsdom after reasonable effort, mark it `it.skip` with a `// TODO: TipTap+jsdom — covered by manual smoke test (Task 17)` comment. Do NOT delete the test. Do NOT add a new test-environment dependency (e.g., `@testing-library/user-event` patches, happy-dom) just for this — that's a separate story.

- **Quaternary Risk: User confusion about per-table annotations vs. the new fields.** SchemaLift already has per-table/column annotations (`AnnotationInput.tsx`). The new fields are *prompt-level*, not *table-level*. A new user might add their question into a table annotation instead.
  - **Mitigation**: The helper text under each editor heading (Task 4) makes the role explicit. Compose's `<h1>` and the meta line ("N tables selected") reinforce that this is the post-selection step.
  - **Verification**: Future user-research story; not gated on this story.

### Rollback Plan

1. `git revert` the merge commit. All changes are additive at the route, screen, store, and dependency layers. No data migration. No IPC change. No SQLite schema change.
2. If a partial rollback is needed (e.g., editors ship but cause perf regressions on slower machines), the smallest rollback is reverting Task 6: change Schema Browser's button back to `Generate Prompt` calling `handleGeneratePrompt` directly. The `/compose` route can stay orphaned (no nav points to it) until investigation completes; or it can be deleted in a follow-up commit.
3. **Bundle-size rollback path**: if the TipTap dependencies cause an unacceptable startup time regression after merge, the smallest mitigation is wrapping `ComposeScreen` in `React.lazy` + `Suspense`. This is a 10-minute change but is **out of scope** for this story.

### Safety Checks

- [ ] No new Rust files / no new IPC commands / no new SQLite migration (defend AC 9 by grep).
- [ ] `clearConnection` resets the two new fields (defend AC 7 via Task 13 store test).
- [ ] Schema Browser button stays disabled at `selectedTables.size === 0` (defend AC 2 via Task 11).
- [ ] Empty Q/O path produces byte-identical output to today (defend AC 5/AC 8 via Task 12 `whitespace-only ... collapse out` test).
- [ ] No new Tailwind plugin installed (Task 9 — if `@tailwindcss/typography` isn't already present, fall back to explicit styles).
- [ ] No global event listeners leaked from `RichTextEditor` (TipTap's `useEditor` handles its own cleanup; verify by inspecting the React DevTools after toggling the route a few times during manual smoke test — no listener growth).

## Dev Technical Guidance

### Existing System Context

- The prompt-generation pipeline today is purely client-side: select tables in `SchemaBrowserScreen` → `generatePrompt(...)` → write to `appStore.prompt` → navigate to `/prompt` → render in `<pre>`. Zero IPC involved.
- The Rust backend is **not touched** by this story. The Schema Browser ⇄ Compose ⇄ Prompt Preview triad is entirely frontend state + routing.
- Per-table and per-column annotations (Story 4.2) live in SQLite, keyed by `connection_profile_id`. They persist and rehydrate per profile. The new Compose fields **deliberately do not** — see AC 7 and the explicit deferral note. A future "Persist prompt drafts" story can add a `prompt_drafts` table keyed similarly.

### Integration Approach

- **Frontend-only.** Three npm packages, one new route, one new screen, one new component, two new store fields, one signature change to `generatePrompt`.
- **Zero IPC change.** The new fields stay in Zustand. The backend has no knowledge they exist.
- **Schema Browser surgically updated** — button label + nav target only. No behavior change to selection, search, annotations, or progress indicators.
- **Prompt Preview unchanged** beyond what it receives: a `PromptBlock` whose `content` field has more text in it.

### File Locations

| Layer | Path | Action |
|---|---|---|
| Frontend deps | `package.json`, `package-lock.json` | EDIT — add 5 TipTap packages (Task 1) |
| Frontend store | `src/store/appStore.ts` | EDIT — add `query`, `expectedOutput`, setters; extend `clearConnection` (Task 2) |
| Frontend component | `src/components/prompt/RichTextEditor.tsx` | NEW (Task 3) |
| Frontend screen | `src/screens/ComposeScreen.tsx` | NEW (Task 4) |
| Frontend routing | `src/App.tsx` | EDIT — add `/compose` route (Task 5) |
| Frontend screen | `src/screens/SchemaBrowserScreen.tsx` | EDIT — rename button + reroute (Task 6) |
| Frontend prompt logic | `src/lib/promptGenerator.ts` | EDIT — signature + weaving (Task 7) |
| Frontend screen | `src/screens/PromptPreviewScreen.tsx` | UNTOUCHED (verify in Task 8) |
| Frontend nav | `src/components/layout/AppShell.tsx` | UNTOUCHED (Task 5 rationale) |
| Frontend tests | `src/__tests__/RichTextEditor.test.tsx` | NEW (Task 10) |
| Frontend tests | `src/__tests__/SchemaBrowserScreen.test.tsx` | EDIT — update button + nav assertions (Task 11) |
| Frontend tests | `src/__tests__/promptGenerator.test.ts` | EDIT — 4 new tests + 1 comment (Task 12) |
| Frontend tests | `src/__tests__/appStore.test.ts` | EDIT — 3 new tests (Task 13) |
| Frontend tests | `src/__tests__/ComposeScreen.test.tsx` | NEW (Task 14) |
| Frontend tests | `src/__tests__/setup.ts` | POSSIBLY EDIT — add `Range.prototype.getBoundingClientRect` polyfill iff Task 10 needs it |
| Backend | `src-tauri/**` | UNTOUCHED — verify via grep (Task 16) |

### Existing Pattern References

- **Route + screen + store + tests parallel structure**: Story 4.3 added `/settings` end-to-end. This story mirrors that shape for `/compose`. (See [docs/stories/4.3.story.md](docs/stories/4.3.story.md).)
- **Empty-state pattern for screens that depend on prior steps**: [PromptPreviewScreen.tsx:11-21](src/screens/PromptPreviewScreen.tsx:11) renders an empty state when `prompt === null` and offers a "Go to Schema Browser" button. Compose mirrors that pattern when `selectedTables.size === 0`.
- **Single-string Markdown state in Zustand**: there's no prior example in this codebase. The closest analog is `Annotation.text` (free-form string per (schema,table,column) key). Compose's `query` and `expectedOutput` are simpler — single global strings.
- **Toolbar component with icon-only buttons + `aria-label`**: pattern established in `ProfileListItem.tsx` (Story 4.3) — `<Button variant="ghost" size="sm" aria-label="...">`.

### Technical Constraints

- **No new shadcn primitive.** Consistent with Story 4.3. Six toolbar buttons in a flex container are sufficient.
- **No new Tailwind plugin.** Task 9 enforces this. Either `@tailwindcss/typography` is already in `tailwind.config.js` (use it) or it isn't (fall back to inline styles).
- **No `dangerouslySetInnerHTML`.** TipTap renders into a managed contenteditable; Markdown stays as the canonical state. The schema block in the generated prompt is rendered in a `<pre>` (Prompt Preview) which is already safe.
- **No new TypeScript IPC type.** AC 9 / Task 2's "do not add a type" — `string` is the wire type and there's no Rust mirror.
- **Accessibility minimum (matches Story 4.3 bar):**
  - Each editor has an `aria-label` (Task 3).
  - Each toolbar button has an `aria-label` (Task 3).
  - The Compose page heading is an `<h1>`; the two section headings are `<h2>`.
- **Bundle-size discipline** is a first-class AC (10). Don't bring in extra TipTap extensions speculatively. The five packages listed in Task 1 are the floor; nothing beyond.
- **`window.prompt` for the Link URL** is acceptable for v1 — it's a native, accessible, keyboard-navigable, screen-reader-friendly UI element. A future story can replace it with a styled inline popover if the design language demands.
- **Tests assert visual/behavioral equivalence, not byte-level Markdown.** TipTap's Markdown serialization has minor stylistic choices (e.g., `*x*` vs `_x_` for italic, trailing newline placement); pinning byte-level output makes the suite brittle and adds no real coverage. Use `toContain` and visual rendering checks instead.

### Testing

- **Frameworks**: Vitest 1.x + jsdom + @testing-library/react. Same setup as Story 4.3.
- **TipTap-in-jsdom**: the polyfill in Task 10's pitfall note is the known sharp edge. If a test can't be coerced to pass after polyfilling, `it.skip` with a justification comment and rely on the manual smoke test (Task 17) for coverage. Do **not** add a new test-environment dependency to fix one stubborn test.
- **AC traceability**:
  - AC 1 → Task 4 (empty state), Task 14 (`shows empty-state when no tables are selected`), Task 5 (route wiring).
  - AC 2 → Task 6 (impl), Task 11 (test).
  - AC 3 → Task 3 (impl), Task 10 (`renders the placeholder...`, `applies the supplied aria-label...`), Task 4 (compose-screen labels + helper text).
  - AC 4 → Task 3 (impl), Task 10 (round-trip + bold/link tests).
  - AC 5 → Task 7 (impl), Task 12 (four new tests).
  - AC 6 → Task 4 (impl), Task 14 (`Generate Prompt button calls generatePrompt and navigates`).
  - AC 7 → Task 2 (`clearConnection` extension), Task 13 (`clearConnection resets query and expectedOutput`), Task 14 (`Back button ... DOES NOT clear`).
  - AC 8 → Task 6/Task 7 collectively + Task 12's `whitespace-only ... collapse out` test (the byte-identity claim).
  - AC 9 → Task 16 (grep gate).
  - AC 10 → Task 15 (bundle-size reporting in Completion Notes).

## Compatibility Verification

- [x] No breaking changes to existing APIs (`generatePrompt` gains optional params with defaults).
- [x] No database changes (no SQLite migration; no new tables).
- [x] No IPC schema change.
- [x] UI changes follow existing design patterns (shadcn `Button`, lucide icons, Tailwind border/rounded/bg-background palette).
- [⚠️] Performance impact: ~80–120 kB gz bundle increase. First-paint impact for an MVP desktop app is acceptable but not negligible. AC 10 gates this.

## Definition of Done

- [ ] All AC 1–10 met.
- [ ] All Tasks 1–16 completed; Task 17 either completed or explicitly deferred-to-user with a noted reason.
- [ ] All frontend gates green (lint / tsc / test / build).
- [ ] Bundle-size delta reported in Completion Notes; no surprise > 150 kB gz.
- [ ] No new Rust code (grep gate passes).
- [ ] `clearConnection` correctly drops the two new fields.
- [ ] Existing prompt-generator behaviour byte-identical when query and expectedOutput are empty.

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-05-21 | 1.0 | Initial draft from user request | Bob (SM) |

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None required — no blocking issues during implementation.

### Completion Notes List

**Bundle-size delta (AC 10) — ⚠️ EXCEEDS LIMIT — RAISED FOR DISCUSSION:**
- Story 4.3 baseline: 78.48 kB gz
- Pre-feature baseline (post-install, no new code): 80.10 kB gz
- Post-feature build: 255.64 kB gz
- **Delta vs. story baseline: +177.16 kB gz. Delta vs. immediate pre-feature baseline: +175.54 kB gz.**
- Root cause: npm resolved `@tiptap/react`, `@tiptap/starter-kit`, etc. to **TipTap v3.23.5** (story estimated v2 at ~80–120 kB gz). TipTap v3 ships a substantially larger bundle. The `tiptap-markdown@0.9.0` package also targets `@tiptap/core ^3.0.1`, so v3 is the correct peer.
- **Mitigation path (not implemented in this story per scope rules):** wrap `ComposeScreen` in `React.lazy` + `Suspense` to split TipTap out of the initial bundle. Estimated to reduce the initial chunk back toward ~80–90 kB gz with TipTap loading only on first `/compose` visit. This is a 10-minute change and is the recommended follow-up before merging.
- **Decision required from story owner:** accept the +175 kB delta as-is, OR apply the lazy-load split before merging, OR downgrade to TipTap v2 (not recommended — `tiptap-markdown` v0.9 targets v3).

**Tailwind typography plugin (Task 9):**
- `@tailwindcss/typography` is NOT in `tailwind.config.ts` (only `tailwindcss-animate`).
- Used explicit inline Tailwind utility classes in `RichTextEditor.tsx`: `[&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc ...` etc. No new plugin installed.

**TipTap-in-jsdom polyfills (Task 10):**
- Added `Range.prototype.getBoundingClientRect` and `Range.prototype.getClientRects` polyfills in `RichTextEditor.test.tsx` `beforeAll`. Not added to `setup.ts` (scoped to this test file only).
- TipTap v3 API change: `setContent(content, false)` is invalid in v3 — must use `setContent(content, { emitUpdate: false })`. Fixed with `eslint-disable @typescript-eslint/no-explicit-any` for `editor.storage.markdown` (untyped by tiptap-markdown).
- Re-hydration guard: added `isProgrammaticUpdate` ref to prevent `onUpdate` → `onChange` → re-render loop when setting content programmatically.

**Markdown round-trip (Task 10):**
- No lossy cases discovered for the supported feature set (bold, italic, inline code, lists, links).
- TipTap v3 `tiptap-markdown` serializes italic as `*x*` (not `_x_`). Tests use `toContain` / `toMatch` rather than byte-equality to avoid brittleness.

**`npm install` flag:** required `--legacy-peer-deps` due to pre-existing `@eslint/js@10` / `eslint@9` peer conflict (not TipTap-related, pre-existed before this story).

### File List

- `package.json` — added `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `tiptap-markdown`
- `package-lock.json` — regenerated
- `src/store/appStore.ts` — added `query`, `expectedOutput` fields, setters, extended `clearConnection`
- `src/components/prompt/RichTextEditor.tsx` — NEW
- `src/screens/ComposeScreen.tsx` — NEW
- `src/App.tsx` — added `/compose` route
- `src/screens/SchemaBrowserScreen.tsx` — renamed button, rerouted to `/compose`, removed unused imports
- `src/lib/promptGenerator.ts` — extended signature with `query`/`expectedOutput` defaults, weaving logic
- `src/__tests__/RichTextEditor.test.tsx` — NEW (6 tests)
- `src/__tests__/SchemaBrowserScreen.test.tsx` — updated label + nav assertions
- `src/__tests__/promptGenerator.test.ts` — added 4 new tests + comment
- `src/__tests__/appStore.test.ts` — added 3 new tests
- `src/__tests__/ComposeScreen.test.tsx` — NEW (4 tests)

## QA Results

_To be filled by QA reviewer (Quinn)._
