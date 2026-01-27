# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GSD Console - Terminal UI for viewing GSD (Get Shit Done) project status. Displays roadmap progress, phase details, and todos in a keyboard-navigable interface built with Ink (React for terminals).

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
├── TabLayout (tab switching: 1/2/3/4 or Tab)
│   ├── RoadmapView (phase list with expand/collapse)
│   ├── PhaseView (single phase detail)
│   ├── TodosView (todo list)
│   └── BackgroundView (job queue status)
├── Footer (context-sensitive keybindings)
├── CommandPalette (: key, fuzzy search with Tab completion)
├── ExecutionModePrompt (headless/interactive/primary selection)
├── SessionPicker (c key, connect to OpenCode sessions)
├── FilePicker (e key, multi-file selection for editor)
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

## Testing Approach

**Philosophy:** Use real data instead of mocks where possible, test behavior rather than hardcoded values.

### Test Data Strategy

- **`.planning/` directory is read-only test data** - Use actual planning files instead of memfs mocking
  - Parser tests use memfs for isolated filesystem testing
  - Hook tests read from real `.planning/` directory to test integration
  - Tests won't break when adding phases/plans to the project

### Mocking Guidelines

- **Mock only what's necessary** - Most tests use real data, mocks only for error cases
  - Don't mock parser functions in hook tests - let them read from `.planning/`
  - Mock `node:fs` only for specific error scenarios (missing directory)
  - Avoid mock conflicts between test files (e.g., parser tests vs hook tests)

### Flexible Assertions

- **Test behavior, not exact values** - Use `toBeGreaterThan(0)` instead of `toBe(5)`
  - Tests remain valid when adding more phases: `expect(phases.length).toBeGreaterThan(0)`
  - Tests remain valid when adding more plans: `expect(state.progress).toBeGreaterThanOrEqual(0)`
  - Verify structure exists: `expect(phase).toHaveProperty('number')`

### Example: Resilient Hook Test

```tsx
// ✅ Good: Flexible to project growth
test('loads and parses planning documents successfully', async () => {
  const data = useGsdData('.planning');
  
  // These assertions won't break when adding phases
  expect(data.phases.length).toBeGreaterThan(0);
  expect(data.phases[0]).toHaveProperty('number');
  expect(data.phases[0]).toHaveProperty('name');
});

// ❌ Bad: Brittle to project growth
test('loads 5 phases', async () => {
  const data = useGsdData('.planning');
  
  // This breaks when you add a 6th phase
  expect(data.phases).toBe(5);
});
```

### Example: Parser Test with memfs

```tsx
// Parser tests use memfs for isolated testing
import { fs } from 'memfs';
vi.mock('node:fs', () => fs);

test('parses phase from markdown', () => {
  vol.fromJSON({
    '.planning/ROADMAP.md': '### Phase 1: Test\n**Goal**: Build',
  });
  
  const phases = parseRoadmap(content, '.planning/phases');
  expect(phases).toHaveLength(1);
});
```

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

## OpenCode Integration

### Architecture

- **`opencode`** (TUI) - Standalone terminal app, no HTTP API
- **`opencode serve --port 4096`** - Headless server with HTTP API
- **`opencode attach http://localhost:4096`** - TUI connected to serve

Sessions are stored in `~/.local/share/opencode/storage/session/`. Both TUI and serve read/write to same storage, but don't communicate in real-time unless using attach.

### Key Insight: Use Attach for API Injection

To send commands to a running TUI session via API:
1. Run `opencode serve --port 4096` (required for SDK)
2. Run `opencode attach http://localhost:4096` (not plain `opencode`)
3. Now API calls show up in the TUI because both use the same server

**Without attach:** API calls go to session storage but TUI doesn't poll for external changes.

### SDK Gotchas

- **Timestamps are milliseconds** - `s.time.created` and `s.time.updated` are already in ms, don't multiply by 1000
- **SDK requires serve running** - All SDK calls fail with ConnectionRefused if `opencode serve` isn't running
- **Session list from SDK** - Returns active sessions only (not all historical like local storage)

### Execution Modes

| Mode | What it does |
|------|--------------|
| Headless | Adds to background job queue, runs via SDK |
| Interactive | Spawns `opencode attach` with initial prompt |
| Primary | Sends prompt to connected session via SDK |

### Default Model Configuration

Background jobs use OpenCode's default model setting. GLM4.7 is the recommended model for background GSD commands:

**Configure in `~/.opencode/opencode.json`:**
```json
{
  "defaultModel": "glm-4.7"
}
```

This is a server-side OpenCode configuration — the TUI uses whatever model OpenCode defaults to.

### Session Activity Monitoring

Track active OpenCode sessions and display what they're currently doing.

**Architecture:**
- `lib/sessionActivity.ts` - Core utilities for detecting and monitoring sessions
- `hooks/useSessionActivity.ts` - React hook for real-time updates in components
- Uses OpenCode SDK's `session.list()` and SSE event stream

**Key Functions:**

```typescript
// Get most recently active session
import { getActiveSession } from './lib/sessionActivity.ts';

const activity = await getActiveSession();
// Returns:
// {
//   sessionId: string;
//   title: string;           // "Verify Phase 05 plans (@gsd-plan-checker subagent)"
//   isActive: boolean;        // true if updated within 60 seconds
//   currentActivity?: string;  // "gsd-plan-checker: running"
//   lastUpdated: number;       // timestamp in ms
// }

// Monitor real-time activity
import { monitorSessionActivity } from './lib/sessionActivity.ts';

const cleanup = monitorSessionActivity((activity) => {
  console.log(`Active: ${activity.currentActivity}`);
});

cleanup(); // Stop listening

// React hook for components
import { useSessionActivity } from './hooks/useSessionActivity.ts';

function MyComponent() {
  const activity = useSessionActivity();

  if (activity?.isActive) {
    return <Text>Running: {activity.currentActivity}</Text>;
  }
  return null;
}
```

**Activity Detection:**
- Sessions updated within 60 seconds are considered "active"
- Current activity extracted from session title parsing:
  - `Phase XX: Description` → "Working on Phase XX"
  - `@subagent-name` → "subagent running"
  - `Verb something` → "verifying / planning / executing"
- Real-time updates from SSE events:
  - `type="task"` → Shows subagent name and status
  - `type="tool"` → Shows tool name and status
  - `type="reasoning"` → Shows reasoning preview

**Usage in Footer:**

```tsx
import { useSessionActivity } from '../hooks/useSessionActivity.ts';

export function Footer() {
  const activity = useSessionActivity();

  return (
    <Box>
      <Text dimColor>
        {activity?.isActive && activity.currentActivity && (
          <Text color="cyan" bold>
            ● {activity.currentActivity} |{' '}
          </Text>
        )}
        Tab: tabs | c: connect | q: quit
      </Text>
    </Box>
  );
}
```

**Demo Script:**
Run standalone demo to see real-time activity:
```bash
bun demo-session-activity.ts
```

**Requirements:**
- `opencode serve --port 4096` must be running
- Uses SDK `session.list()` for detection
- Event stream filters by current session ID

**See Also:** `SESSION-ACTIVITY.md` for full documentation

## Custom Controlled Input

`@inkjs/ui` TextInput is uncontrolled (no `value` prop). For Tab completion, replace with custom input:

```tsx
const [inputValue, setInputValue] = useState('');

useInput((input, key) => {
  if (key.tab) {
    // Handle Tab completion
    setInputValue(completed + ' ');
    return;
  }
  if (key.backspace) {
    setInputValue(prev => prev.slice(0, -1));
    return;
  }
  if (input && !key.ctrl && !key.meta) {
    setInputValue(prev => prev + input);
  }
});

// Render manually
<Text>{inputValue}</Text>
```

## Overlay Styling

For readable overlays, add solid background:
```tsx
// biome-ignore lint/suspicious/noExplicitAny: Ink types incomplete
{...({ backgroundColor: 'black' } as any)}
```

## Key Dependencies

- **ink** - React renderer for terminals
- **@inkjs/ui** - Spinner, TextInput components
- **@opencode-ai/sdk** - OpenCode API client
- **@nozbe/microfuzz** - Lightweight fuzzy search for command palette
- **gray-matter** - YAML frontmatter parsing
- **fullscreen-ink** - Alternate screen buffer management
