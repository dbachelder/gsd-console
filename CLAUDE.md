# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GSD Status TUI - Terminal UI for viewing GSD (Get Shit Done) project status. Displays roadmap progress, phase details, and todos in a keyboard-navigable interface built with Ink (React for terminals).

## Commands

```bash
# Development
bun run dev           # Run with hot reload
bun start             # Run once
bun start --only roadmap  # Single view mode

# Validation
bun run typecheck     # TypeScript check (tsc --noEmit)
bun run lint          # Biome linting
bun run lint:fix      # Auto-fix lint issues

# Testing
bun test              # Run all tests
bun test test/lib/parser.test.ts  # Run single test file
bun run test:coverage # Run with coverage
```

## Architecture

### Data Flow

```
.planning/ files → parser.ts → useGsdData hook → App → TabLayout → Views
                                    ↑
                        useFileWatcher (auto-refresh)
```

- `lib/parser.ts` - Parses ROADMAP.md, STATE.md, and phase directories
- `hooks/useGsdData.ts` - Loads and caches parsed data
- `hooks/useFileWatcher.ts` - Watches .planning/ for changes, triggers refresh
- `hooks/useChangeHighlight.ts` - Tracks recently changed items for visual highlighting

### Component Hierarchy

```
App.tsx
├── Header (project name, progress)
├── TabLayout (tab switching: 1/2/3 or Tab)
│   ├── RoadmapView (phase list with expand/collapse)
│   ├── PhaseView (single phase detail)
│   └── TodosView (todo list)
├── Footer (context-sensitive keybindings)
├── CommandPalette (Ctrl+P fuzzy search)
├── FilePicker (multi-file selection for editor)
└── ToastContainer (notifications)
```

### Navigation Hooks

- `useVimNav` - Vim-style navigation (j/k, gg/G, Ctrl+d/u) for any list
- `useTabNav` - Tab key and number key (1/2/3) switching between views
- `useTabState` - Ref-based per-tab state persistence (no re-renders on save)

### Key Patterns

**Input handling:** Use Ink's `useInput` hook with `isActive` flag to prevent overlapping handlers. Only one component should handle input at a time.

**State lifting:** Selection state (phase number, todo ID) is lifted to App.tsx for editor integration. Tab-specific state (expanded phases, scroll) uses `useTabState` ref storage.

**Overlays:** Command palette and file picker render with `position="absolute"` and disable underlying input handlers via `isActive` prop drilling.

## Code Style

- **Formatting:** Biome with tabs, single quotes, semicolons, 100 char line width
- **Commits:** Conventional commits with lowercase subject (`feat(scope): add feature`)
- **Unused vars:** Prefix with underscore (`_unusedParam`) or use `void expression`
- **Git hooks:** Lefthook runs biome check and typecheck on pre-commit, commitlint on commit-msg

## Avoiding Flicker

Terminal UI flicker typically comes from unnecessary re-renders. Key lessons:

1. **Use refs for cross-component state that doesn't need to trigger re-renders.** `useTabState` uses `useRef` instead of `useState` so that saving tab state on unmount doesn't cause parent re-renders.

2. **Don't use controlled components with callbacks on every keystroke.** Instead of `onIndexChange` firing on every j/k press, pass initial state via props and save on unmount only.

3. **Avoid updating parent state during navigation.** Callbacks like `onPhaseNavigate` that fire on every selection change will re-render the entire App tree. Only update parent state on explicit user actions (Enter key, tab switch).

4. **Pattern for persisted component state:**
   ```tsx
   // Initialize from props
   const [state, setState] = useState(() => new Set(initialProp ?? []));

   // Track in ref for unmount
   const stateRef = useRef(state);
   stateRef.current = state;

   // Save only on unmount (to ref-based storage, no re-renders)
   useEffect(() => {
     return () => onSaveState?.(stateRef.current);
   }, [onSaveState]);
   ```

## Key Dependencies

- **ink** - React renderer for terminals
- **@inkjs/ui** - Spinner, TextInput components
- **@nozbe/microfuzz** - Lightweight fuzzy search for command palette
- **gray-matter** - YAML frontmatter parsing
- **fullscreen-ink** - Alternate screen buffer management
