# Requirements: GSD Status TUI

**Defined:** 2025-01-24
**Core Value:** See and manage GSD project state without leaving the coding context

## v1 Requirements

### Display

- [ ] **DISP-01**: User sees roadmap overview with phases and progress indicators
- [ ] **DISP-02**: User sees current phase details (goal, requirements, success criteria)
- [ ] **DISP-03**: User sees todos list from planning docs

### Navigation

- [ ] **NAV-01**: User can navigate between panels with keyboard (Tab, arrows)
- [ ] **NAV-02**: User can use Vim keybindings (hjkl, gg, G, Ctrl+d/u)
- [ ] **NAV-03**: User can scroll content (page up/down, arrow keys)

### Real-time Updates

- [ ] **RT-01**: TUI watches .planning/ directory and refreshes on file changes
- [ ] **RT-02**: Updates are debounced to avoid flicker on rapid changes
- [ ] **RT-03**: Recently changed items show visual indicator

### Actions

- [ ] **ACT-01**: User can run GSD commands (add-todo, add-phase, progress, etc.)
- [ ] **ACT-02**: User can open planning files in $EDITOR
- [ ] **ACT-03**: User can access command palette with fuzzy search
- [ ] **ACT-04**: User can connect to/spawn OpenCode session for complex workflows
- [ ] **ACT-05**: User can queue multiple GSD commands for sequential execution in OpenCode

### Editing

- [ ] **EDIT-01**: User can add/complete todos inline without leaving TUI
- [ ] **EDIT-02**: User can reorder phases with keyboard shortcuts

### Technical

- [ ] **TECH-01**: Built with Ink (TypeScript/React) TUI framework
- [ ] **TECH-02**: Parses STATE.md, ROADMAP.md, PROJECT.md, REQUIREMENTS.md
- [ ] **TECH-03**: Works in split terminal pane alongside OpenCode

## v2 Requirements

### Display

- **DISP-04**: File tree view of all .planning/ contents
- **DISP-05**: Rich markdown rendering with syntax highlighting
- **DISP-06**: Diff highlighting showing what changed

### Navigation

- **NAV-04**: Fuzzy search/filter across all content
- **NAV-05**: Breadcrumb trail showing current location

### Actions

- **ACT-06**: Quick actions context menu
- **ACT-07**: Macro recording for command sequences

### Editing

- **EDIT-03**: Toggle phase status inline
- **EDIT-04**: Inline editing of phase goals/descriptions

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native OpenCode sidebar | Plugin API doesn't support UI extensions (confirmed via research) |
| Fork/patch OpenCode | Maintenance burden, prefer standalone approach |
| Full GSD reimplementation | Use existing GSD CLI commands |
| Mobile interface | Desktop TUI only |
| Web UI version | Focus on terminal experience first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DISP-01 | Phase 1 | Pending |
| DISP-02 | Phase 1 | Pending |
| DISP-03 | Phase 1 | Pending |
| NAV-01 | Phase 1 | Pending |
| NAV-02 | Phase 1 | Pending |
| NAV-03 | Phase 1 | Pending |
| RT-01 | Phase 2 | Pending |
| RT-02 | Phase 2 | Pending |
| RT-03 | Phase 2 | Pending |
| ACT-01 | Phase 3 | Pending |
| ACT-02 | Phase 3 | Pending |
| ACT-03 | Phase 3 | Pending |
| EDIT-01 | Phase 3 | Pending |
| EDIT-02 | Phase 3 | Pending |
| ACT-04 | Phase 4 | Pending |
| ACT-05 | Phase 4 | Pending |
| TECH-01 | Phase 1 | Pending |
| TECH-02 | Phase 1 | Pending |
| TECH-03 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2025-01-24*
*Last updated: 2025-01-24 after initial definition*
