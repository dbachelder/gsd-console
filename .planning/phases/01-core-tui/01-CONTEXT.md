# Phase 1: Core TUI - Context

**Gathered:** 2025-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Display GSD project status (roadmap, phases, todos) in a keyboard-navigable terminal interface with Vim-style keybindings. Users can view and navigate but not edit. Real-time updates and editing are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Layout structure
- Tab-based interface with three tabs: Roadmap, Phase, Todos
- Single-tab mode via `--only roadmap|phase|todos` flag for terminal multiplexer pane setups
- In `--only phase` mode: defaults to first incomplete phase, with mechanism to switch phases within the view
- Each instance can run independently (multiple panes showing different views)

### Information density
- Toggleable detail levels throughout (keybinding to increase/decrease shown info)
- Default to moderate detail level on startup
- Roadmap view: option to hide completed phases
- Todos view: flat list with toggleable metadata (source file, related phase)
- Phase detail view: default shows goal + success criteria + plans; toggle to show requirements, dependencies, context notes

### Visual indicators
- Emojis + colors for status indicators (make it visually appealing)
- GSD-aware status set:
  - Not started, In progress, Complete, Blocked
  - Has context, Has plan, Needs verification, Has research
- Progress visualization: progress bar style (no fraction label needed)
- Use terminal's default color scheme (adapts to user's terminal theme)

### Navigation feel
- Tab key cycles between major areas
- Number keys (1/2/3) for direct tab jump
- Cursor indicator + background highlight for current selection
- Smart reset: remember selection within session, reset to "current" phase on restart
- Footer hint bar always visible with common keybindings
- Full help overlay on `?` key

### Claude's Discretion
- Exact emoji choices for each status
- Progress bar character style
- Footer hint bar content/layout
- Specific keybindings beyond Vim basics (hjkl, gg, G, Ctrl+d/u)
- Detail level toggle keybinding choice

</decisions>

<specifics>
## Specific Ideas

- "Make it look cool" — visual polish matters, not just functional
- Multiple instances in tmux/zellij panes showing different views is a key use case
- Terminal multiplexer users want focused single-purpose panes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-core-tui*
*Context gathered: 2025-01-24*
