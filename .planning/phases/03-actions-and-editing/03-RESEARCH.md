# Phase 3: Actions and Editing - Research

**Researched:** 2026-01-24
**Domain:** Command palette, external editor spawning, toast notifications, fuzzy search
**Confidence:** HIGH

## Summary

This phase requires implementing command palette UX, external editor integration, inline editing stubs, and toast notifications. The codebase already uses `fullscreen-ink` which manages alternate screen buffers. The key challenge is suspending the Ink app to spawn an external editor, then resuming cleanly.

The recommended approach uses `@nozbe/microfuzz` for fuzzy search (2KB, zero deps, React hooks included), custom toast implementation using React state with timeouts, and `spawnSync` with `stdio: 'inherit'` for editor spawning. The command palette pattern combines `TextInput` from `@inkjs/ui` with a filtered list component.

**Primary recommendation:** Build command palette with TextInput + filtered list, use spawnSync for editor with alternate screen buffer exit/re-enter, implement toasts as positioned Box with fade timeout.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ink` | ^6.6.0 | React TUI framework | Already in use, provides useInput, useApp |
| `@inkjs/ui` | ^2.0.0 | UI components | Already in use, has TextInput, Select |
| `fullscreen-ink` | ^0.1.0 | Alternate screen buffer | Already in use, manages fullscreen mode |

### To Add
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nozbe/microfuzz` | ^1.0.0 | Fuzzy search | 2KB gzipped, zero deps, React hooks, designed for command palettes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@nozbe/microfuzz` | `fzf` (npm package) | fzf is 70KB unpacked, more sophisticated but overkill for ~10 commands |
| `@nozbe/microfuzz` | `fuse.js` | Fuse.js is larger, more features than needed |
| Custom toast | `ink-status-message` | StatusMessage from @inkjs/ui could work but lacks auto-dismiss |

**Installation:**
```bash
npm install @nozbe/microfuzz
```

## Architecture Patterns

### Recommended Component Structure
```
src/
├── components/
│   ├── palette/
│   │   ├── CommandPalette.tsx    # Main palette component
│   │   ├── CommandItem.tsx       # Individual command row
│   │   └── types.ts              # Command interface
│   ├── toast/
│   │   ├── Toast.tsx             # Single toast display
│   │   └── ToastContainer.tsx    # Manages toast stack
│   └── layout/
│       └── ...existing...
├── hooks/
│   ├── useCommandPalette.ts      # Palette state/actions
│   ├── useToast.ts               # Toast management
│   └── useExternalEditor.ts      # Editor spawning logic
└── lib/
    └── commands.ts               # Command definitions
```

### Pattern 1: Command Palette State Machine
**What:** Manage palette visibility and input state with explicit modes
**When to use:** When implementing modal UI that captures input
**Example:**
```typescript
// Source: Pattern derived from Ink useInput documentation
type PaletteMode = 'closed' | 'open' | 'executing';

function useCommandPalette() {
  const [mode, setMode] = useState<PaletteMode>('closed');
  const [query, setQuery] = useState('');

  useInput((input, key) => {
    if (mode === 'closed' && input === ':') {
      setMode('open');
      setQuery('');
      return;
    }
    if (mode === 'open' && key.escape) {
      setMode('closed');
      return;
    }
  }, { isActive: mode !== 'executing' });

  return { mode, query, setQuery, setMode };
}
```

### Pattern 2: Fuzzy Filtered List with Microfuzz
**What:** Filter command list as user types
**When to use:** Command palette filtering
**Example:**
```typescript
// Source: @nozbe/microfuzz documentation
import { useFuzzySearchList } from '@nozbe/microfuzz/react';

interface Command {
  name: string;
  description: string;
  action: () => void;
}

function CommandList({ commands, query }: { commands: Command[], query: string }) {
  const filteredCommands = useFuzzySearchList({
    list: commands,
    queryText: query,
    getText: (cmd) => [cmd.name, cmd.description],
    mapResultItem: ({ item, matches }) => ({ item, matches }),
  });

  return (
    <Box flexDirection="column">
      {filteredCommands.map(({ item }) => (
        <CommandItem key={item.name} command={item} />
      ))}
    </Box>
  );
}
```

### Pattern 3: Toast with Auto-Dismiss
**What:** Temporary notification that fades after timeout
**When to use:** Feedback for stubbed actions, confirmations
**Example:**
```typescript
// Source: Custom pattern for Ink
interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

function useToast(dismissMs = 3000) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, dismissMs);
  }, [dismissMs]);

  return { toasts, show };
}
```

### Pattern 4: External Editor Spawn with fullscreen-ink
**What:** Exit fullscreen, spawn editor, re-enter fullscreen
**When to use:** Opening files in $EDITOR
**Example:**
```typescript
// Source: Node.js child_process docs + fullscreen-ink source analysis
import { spawnSync } from 'child_process';

function openInEditor(filePath: string): boolean {
  const editor = process.env.EDITOR || process.env.VISUAL || 'vim';

  // Exit alternate screen buffer (fullscreen-ink uses \x1b[?1049h/l)
  process.stdout.write('\x1b[?1049l');

  try {
    const result = spawnSync(editor, [filePath], { stdio: 'inherit' });
    return result.status === 0;
  } finally {
    // Re-enter alternate screen buffer
    process.stdout.write('\x1b[?1049h');
  }
}
```

### Anti-Patterns to Avoid
- **Using async spawn for editors:** Editors need synchronous terminal control. Use `spawnSync`, not `spawn`.
- **Trying to render Ink during editor session:** Ink and the editor cannot share the terminal. Fully suspend Ink rendering.
- **Complex toast animation libraries:** React-toastify etc. are for web. Build simple timeout-based toast for TUI.
- **Controlled TextInput for palette:** @inkjs/ui TextInput is uncontrolled by design. Use `onChange`/`onSubmit`, not `value` prop.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy search | Custom substring matching | `@nozbe/microfuzz` | Handles scoring, case-insensitivity, highlight ranges |
| Text input | Raw useInput character handling | `@inkjs/ui TextInput` | Handles cursor, backspace, paste, suggestions |
| Alternate screen | Manual escape sequences | `fullscreen-ink` (already using) | Handles cleanup on exit, resize events |

**Key insight:** The codebase already has fullscreen-ink handling the alternate screen buffer. The challenge is temporarily exiting and re-entering it for editor spawning.

## Common Pitfalls

### Pitfall 1: Not Releasing Terminal for Editor
**What goes wrong:** Editor launches but terminal input doesn't work, display is garbled
**Why it happens:** Ink still owns stdin/stdout, or alternate screen buffer is still active
**How to avoid:**
1. Exit alternate screen buffer before spawn (`\x1b[?1049l`)
2. Use `spawnSync` with `stdio: 'inherit'`
3. Re-enter alternate screen buffer after spawn (`\x1b[?1049h`)
**Warning signs:** Editor shows but keys don't work, or terminal shows Ink + editor overlapping

### Pitfall 2: @inkjs/ui TextInput is Uncontrolled
**What goes wrong:** Trying to use `value` prop like React web input, component doesn't update
**Why it happens:** @inkjs/ui TextInput manages its own state, only accepts `defaultValue`
**How to avoid:** Use `onChange` to track value externally, use `onSubmit` for final value
**Warning signs:** Input doesn't show typed characters, or value doesn't update on change

### Pitfall 3: useInput Conflicts Between Palette and Main App
**What goes wrong:** Key presses handled by both palette and main navigation
**Why it happens:** Multiple useInput hooks all active simultaneously
**How to avoid:** Use `isActive` parameter on useInput: `useInput(handler, { isActive: !paletteOpen })`
**Warning signs:** Pressing 'j' in palette also moves main list selection

### Pitfall 4: Toast Cleanup on Unmount
**What goes wrong:** Memory leaks or state updates on unmounted component
**Why it happens:** setTimeout callback runs after component unmounts
**How to avoid:** Clear timeouts in useEffect cleanup, or use useRef to track mount state
**Warning signs:** React warnings about state updates on unmounted components

### Pitfall 5: $EDITOR Not Set
**What goes wrong:** Spawn fails or uses wrong fallback
**Why it happens:** Not all users have $EDITOR configured
**How to avoid:** Check `process.env.EDITOR || process.env.VISUAL`, prompt user if neither set
**Warning signs:** Spawns `undefined` as command, or opens wrong editor

## Code Examples

Verified patterns from official sources:

### TextInput with onChange (from @inkjs/ui docs)
```typescript
// Source: https://github.com/vadimdemedes/ink-ui/blob/main/docs/text-input.md
import { TextInput } from '@inkjs/ui';
import { useState } from 'react';

function PaletteInput() {
  const [value, setValue] = useState('');

  return (
    <TextInput
      placeholder="Type command..."
      onChange={setValue}
      onSubmit={(finalValue) => {
        // Execute command
      }}
    />
  );
}
```

### Microfuzz Basic Usage
```typescript
// Source: https://github.com/Nozbe/microfuzz#readme
import createFuzzySearch from '@nozbe/microfuzz';

const commands = [
  { name: 'add-todo', description: 'Add a new todo' },
  { name: 'add-phase', description: 'Add a new phase' },
  { name: 'progress', description: 'Mark task progress' },
];

const fuzzySearch = createFuzzySearch(commands, {
  getText: (item) => [item.name, item.description],
});

const results = fuzzySearch('todo'); // Returns matching commands
```

### Microfuzz with React Hook
```typescript
// Source: https://github.com/Nozbe/microfuzz#react-integration
import { useFuzzySearchList, Highlight } from '@nozbe/microfuzz/react';

function FilteredList({ items, query }) {
  const filtered = useFuzzySearchList({
    list: items,
    queryText: query,
    getText: (item) => [item.name],
    mapResultItem: ({ item, matches: [ranges] }) => ({ item, ranges }),
  });

  return filtered.map(({ item, ranges }) => (
    <Box key={item.name}>
      <Highlight text={item.name} ranges={ranges} />
    </Box>
  ));
}
```

### spawnSync for Editor (from Node.js docs)
```typescript
// Source: https://nodejs.org/api/child_process.html
import { spawnSync } from 'child_process';

function editFile(path: string) {
  const editor = process.env.EDITOR || 'vim';
  const result = spawnSync(editor, [path], {
    stdio: 'inherit', // Critical: gives editor control of terminal
  });
  return result.status === 0;
}
```

### fullscreen-ink Alternate Screen Control
```typescript
// Source: Derived from fullscreen-ink source code analysis
// The library uses these escape sequences:
const ENTER_ALT_SCREEN = '\x1b[?1049h';
const EXIT_ALT_SCREEN = '\x1b[?1049l';

// To temporarily exit fullscreen for editor:
process.stdout.write(EXIT_ALT_SCREEN);
spawnSync(editor, [file], { stdio: 'inherit' });
process.stdout.write(ENTER_ALT_SCREEN);
// Note: May need to trigger Ink re-render after returning
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `ink-text-input` (controlled) | `@inkjs/ui TextInput` (uncontrolled) | @inkjs/ui 2.0 | Use onChange/onSubmit, not value prop |
| `external-editor` package | `@inquirer/external-editor` or raw spawnSync | 2025 | external-editor unmaintained, @inquirer version has security fixes |
| Manual ANSI sequences | `fullscreen-ink` | 2024 | Already using, handles cleanup automatically |

**Deprecated/outdated:**
- `ink-text-input`: Superseded by `@inkjs/ui` TextInput, different API
- `external-editor` (v3.1.0): Last published 6 years ago, security issues. Use raw spawnSync or `@inquirer/external-editor`

## Open Questions

Things that couldn't be fully resolved:

1. **Ink Re-render After Editor Exit**
   - What we know: fullscreen-ink manages alternate screen, spawnSync blocks
   - What's unclear: Whether Ink automatically re-renders after returning from editor, or needs manual trigger
   - Recommendation: Test during implementation; may need to force state update or call instance.rerender()

2. **Toast Positioning with Fullscreen**
   - What we know: fullscreen-ink uses FullScreenBox wrapper
   - What's unclear: Best way to position toasts (top-right? bottom? overlay?)
   - Recommendation: Start with bottom-right, use absolute positioning via Box props

3. **Multiple File Picker UX**
   - What we know: When phase has PLAN.md + CONTEXT.md, need picker before editor
   - What's unclear: Best UX pattern (modal overlay, inline select, mini-menu)
   - Recommendation: Use simple numbered list with number key selection (1 for PLAN.md, 2 for CONTEXT.md)

## Sources

### Primary (HIGH confidence)
- Node.js v25.3.0 child_process documentation - spawnSync API, stdio: 'inherit'
- @inkjs/ui GitHub README and docs - TextInput API, uncontrolled component pattern
- @nozbe/microfuzz GitHub - fuzzy search API, React hooks
- fullscreen-ink source code (dist/esm/withFullScreen.js) - alternate screen escape sequences

### Secondary (MEDIUM confidence)
- Ink GitHub issue #263 - fullscreen pattern discussion, alternate screen buffer approach
- Various 2025 blog posts on Ink TUI development

### Tertiary (LOW confidence)
- WebSearch results on toast patterns - verified against Node.js/React patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - using existing project dependencies + well-documented microfuzz
- Architecture: HIGH - patterns derived from official docs and source code analysis
- Pitfalls: HIGH - verified against official documentation and common issues
- Editor spawning: MEDIUM - pattern is clear but fullscreen-ink re-render after spawn needs testing

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable libraries, clear patterns)
