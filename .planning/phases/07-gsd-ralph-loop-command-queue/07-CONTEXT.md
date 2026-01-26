# Phase 7: GSD Ralph Loop Command Queue - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a Work Queue system for sequential GSD command execution in connected OpenCode sessions. Users can add commands to a queue via intelligent shortcuts, remove commands, and view queue status in a dedicated tab. Commands are sent to the primary OpenCode session with status tracking.

</domain>

<decisions>
## Implementation Decisions

### Queue editing operations
- Basic operations only: add commands, remove items (no reordering or editing)
- Add commands via 'w' shortcut with intelligent behavior based on phase state:
  - If phase unplanned and unexecuted: `/gsd-plan-phase {N}`, `/clear`, `/gsd-execute-phase {N}`, `/clear`
  - If phase planned but not executed: `/gsd-execute-phase {N}`, `/clear`
- Remove commands via delete key
- Queue displayed in new "Work Queue" tab showing all commands sent to primary session

### Claude's Discretion
- Queue persistence (auto-save on changes, or session-only?)
- Visual styling of Work Queue tab
- Keyboard shortcuts for queue navigation

</decisions>

<specifics>
## Specific Ideas

- Work Queue should be intelligent - context-aware based on what phase you're on when you hit 'w'
- The '/clear' commands are intentional - fresh context window for each phase operation
- Queue shows "all commands sent to primary session" - includes executed and pending

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

---

*Phase: 07-gsd-ralph-loop-command-queue*
*Context gathered: 2026-01-26*
