# Phase 2: Real-time Updates - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

TUI automatically refreshes when .planning/ files change. Users see updates without restarting. Recently changed items are visually highlighted.

</domain>

<decisions>
## Implementation Decisions

### Change indicators
- Subtle background highlight that fades over time
- Highlight persists for 5 seconds, then animated fade to normal
- No icons or badges — just the highlight effect

### Debounce behavior
- Show subtle spinner/indicator while updates are pending during rapid saves
- Errors during refresh appear in status bar, don't disrupt main view
- No "last updated" timestamp — rely on change highlights instead

### Refresh scope
- Full re-parse of all planning files on any change (keep it simple)
- Preserve all navigation state across refreshes: expanded phases, cursor position, scroll
- Watch all files in .planning/ directory (no filtering)
- Deleted files simply disappear from view

### Edge cases
- Git bulk operations handled same as normal — debounce catches them
- If no .planning/ directory exists, show message in UI and keep watching until it appears
- If file watcher fails (inotify limit, etc.), show warning banner and fall back to polling

### Claude's Discretion
- Debounce strategy (wait-until-quiet vs throttle)
- Highlight color that fits existing palette
- Exact spinner placement and style
- File watcher library choice

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-real-time-updates*
*Context gathered: 2026-01-24*
