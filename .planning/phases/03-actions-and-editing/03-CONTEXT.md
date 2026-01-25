# Phase 3: Actions and Editing - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Execute GSD commands and edit planning files without leaving TUI. This phase builds the interaction interfaces (command palette, inline editing, keybindings) with stub implementations — actual command execution is deferred to Phase 4 (OpenCode Integration). The one working feature is opening files in $EDITOR.

</domain>

<decisions>
## Implementation Decisions

### Command Palette UX
- Invoke with `:` (Vim command mode style)
- Shows GSD commands only (no navigation or settings)
- Fuzzy search filters as you type, first match highlighted
- Commands are stubbed — selecting a command shows toast ("Will execute when connected to OpenCode")
- Results display via toast/flash messages that appear then fade

### Inline Editing Flow
- Add todo: type in palette → "todo" filters to add-todo → Tab selects → text field appears → Enter confirms → toast shows (stubbed)
- Complete todo: Space toggles checkbox on selected todo → toast shows (stubbed)
- Reorder phases: Enter "reorder mode" → arrow keys move selection → Esc exits → toast shows (stubbed)
- Confirm deletes only — other actions execute immediately (or show stub toast)

### Keybinding Design
- `:` opens command palette
- `e` opens current context in $EDITOR
- `?` shows full keybinding help overlay
- Space toggles todo checkbox (stubbed)
- Footer hints show ↑/↓ arrows (not j/k) for up/down navigation
- Remove 1/2/3 jump hints from footer
- j/k still work as Vim bindings, just not displayed in footer
- Avoid modifier keys (Ctrl, Alt) — plain keys only
- Unique keys per action — no modal/context switching needed

### External Editor Integration
- `e` opens file related to current selection
- If unambiguous (only one file), open directly
- If multiple options (PLAN.md + CONTEXT.md), show picker
- TUI suspends while editor runs, resumes on exit (research will confirm Ink approach)
- Rely on Phase 2 file watcher for refresh after edit
- If $EDITOR unset, prompt user to choose editor and suggest setting $EDITOR

### Claude's Discretion
- Toast animation timing and styling
- Fuzzy search algorithm choice
- Picker UI design when multiple files exist
- Help overlay layout and content

</decisions>

<specifics>
## Specific Ideas

- Command palette feel: Vim's `:` command mode, not VS Code's Ctrl+P
- Footer should be cleaner — only essential hints, not cluttered with all options
- Stub behavior should be clear: user knows the UI works but execution is Phase 4

</specifics>

<deferred>
## Deferred Ideas

- Actual command execution via OpenCode — Phase 4
- Direct file manipulation (TUI writes files) — considered but deferred to keep Phase 3 focused on UI

</deferred>

---

*Phase: 03-actions-and-editing*
*Context gathered: 2026-01-24*
