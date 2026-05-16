# Epic 3: Table Selection & Prompt Generation

**Goal:** Allow the user to select one or more tables via checkboxes, add plain-text annotations to tables and columns, and generate a formatted LLM prompt block containing the selected DDL and annotations — culminating in a one-click copy to clipboard. This is the core value proposition of the app.

## Story 3.1: Table & Column Selection via Checkboxes

As a user,
I want to select tables and columns using checkboxes in the schema tree,
so that I can control exactly what context goes into my LLM prompt.

**Acceptance Criteria:**
1. Every table and column in the schema tree has a checkbox
2. Checking a table automatically checks all its columns
3. Unchecking individual columns is possible after a table is checked (partial selection)
4. A "Select All" / "Deselect All" control is available at the schema level
5. Selected item count is displayed (e.g., "3 tables, 12 columns selected")

## Story 3.2: Table & Column Annotation

As a user,
I want to add plain-text descriptions to tables and columns,
so that the generated LLM prompt includes context that isn't in the schema alone.

**Acceptance Criteria:**
1. Clicking a table or column opens an inline annotation input (sidebar or popover)
2. Annotations accept plain text up to 500 characters
3. Annotated tables/columns are visually marked in the tree (e.g., a small icon)
4. Annotations are included in the generated prompt alongside the DDL
5. Clearing an annotation removes the visual marker

## Story 3.3: Prompt Generation & Copy to Clipboard

As a user,
I want to generate a formatted LLM prompt block from my selected tables and copy it with one click,
so that I can immediately paste it into any LLM chat.

**Acceptance Criteria:**
1. A "Generate Prompt" button produces the prompt from currently selected tables/columns
2. The prompt includes: a preamble ("Here is my database schema:"), DDL for each selected table, and any annotations formatted as comments
3. Prompt Preview screen renders the full generated prompt in a read-only code block
4. A "Copy to Clipboard" button copies the full prompt text with a single click
5. A visual confirmation (toast or button state change) confirms the copy succeeded
6. Regenerating the prompt with a different selection updates the preview immediately

---
