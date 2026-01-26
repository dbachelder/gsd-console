# Phase 7: GSD Ralph Loop Command Queue - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a Work Queue system for sequential GSD command execution in connected OpenCode sessions. Users can add commands via intelligent shortcuts, remove commands, view queue status in a dedicated tab, and track execution progress. Queue is ephemeral - lives only during TUI session.

</domain>

<decisions>
## Implementation Decisions

### Execution error handling
- Stop execution immediately when a command fails
- Show full details + suggestion when execution stops (command, error, retry hint)
- Mark failed command in queue (don't clear queue or keep remaining)
- Retry method: Claude's discretion (fits best with TUI patterns)

### Status display granularity
- Each queued command shows: status icon + command text (e.g., "/gsd-plan-phase 7")
- Queue list with status icons per item is sufficient (no separate progress display needed)
- No command output shown during execution (only status icons update)
- Keep all commands in queue after completion (full history with status icons)

### Queue persistence
- No persistence - queue is session-only (dies when TUI exits)
- No export capability needed
- Queue lives in memory only during TUI session

### Claude's Discretion
- Retry method after fixing error
- Visual styling of Work Queue tab
- Keyboard shortcuts for queue navigation and control

</decisions>

<specifics>
## Specific Ideas

- Queue is a list with status icons (pending, running, completed, failed) in front of each item
- The 'w' shortcut is intelligent based on phase state (planning vs execution)
- /clear commands are intentional - fresh context window for each phase operation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

---

*Phase: 07-gsd-ralph-loop-command-queue*
*Context gathered: 2026-01-26*
