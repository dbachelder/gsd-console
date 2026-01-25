# Phase 4: OpenCode Integration - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

TUI can spawn and coordinate with OpenCode sessions — launching sessions, connecting to existing ones, and queuing commands for execution. Three execution modes: headless (background), interactive (terminal handoff), and primary (send to existing session).

</domain>

<decisions>
## Implementation Decisions

### Execution Modes
- Three modes available: headless, interactive, primary
- Always prompt user for mode choice when running a command
- Headless: runs in background, TUI shows status in Background tab + toasts
- Interactive: spawns new session, hands off terminal, TUI resumes when session exits
- Primary: sends command to an existing connected session

### Session Spawn
- When spawning interactive session, TUI stays running in background
- OpenCode takes over terminal
- When OpenCode exits, TUI returns to same state (same tab, same selection)
- Data refreshed via file watcher (existing behavior)

### Session Picker
- Display: session ID, directory, and last command run
- Filter: only show sessions in the directory tree containing .planning/
- No sessions: offer to spawn a new one
- After sending command to session: toast confirmation, stay in TUI

### Background Panel
- Fourth tab in TabLayout (alongside Roadmap/Phase/Todos)
- Expandable entries: collapsed by default, expand to see full output
- Keep last 5 successful jobs and last 5 errors (auto-prune older)
- Toast on command start and completion
- Jobs cancelable with confirmation prompt

### Claude's Discretion
- Exact key binding for cancel action
- Output truncation/scrolling within expanded entries
- How to display "running" vs "pending" distinction
- Error formatting and display

</decisions>

<specifics>
## Specific Ideas

- "Background" naming instead of "queue" — less intimidating, clearer purpose
- Simple start: exit interactive session to return to TUI (no fancy switching initially)
- Could add session cycling/switching later if needed

</specifics>

<deferred>
## Deferred Ideas

- Session switcher with keyboard shortcuts (Ctrl+0/1/2) — add if single-exit-to-return feels limiting
- Toggle between TUI and active sessions without exiting
- Persistent job history across TUI restarts

</deferred>

---

*Phase: 04-opencode-integration*
*Context gathered: 2026-01-24*
