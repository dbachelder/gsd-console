# Phase 2: Real-time Updates - Research

**Researched:** 2026-01-24
**Domain:** File watching, React state management, TUI animations
**Confidence:** HIGH

## Summary

This phase adds automatic TUI refresh when `.planning/` files change, with debouncing to prevent flicker and visual indicators for recently changed items. The implementation involves three main concerns: file watching, debounced state updates, and fade-out highlight animations.

The standard approach is to use Bun's native `fs.watch` with `recursive: true` (simpler, zero dependencies) or `chokidar` (more robust, better cross-platform behavior). Given the project already uses Bun and the watch scope is limited to a single directory, native `fs.watch` is recommended as the primary approach with polling fallback if needed.

For debouncing, a custom `useEffect`-based debounce pattern is cleaner than adding lodash. For highlight animations, track changed item IDs with timestamps in a `Map`, then use `setTimeout` to clear them after the fade period.

**Primary recommendation:** Use Bun's native `fs.watch` with `recursive: true`, implement debounce via `useEffect` + `setTimeout` pattern, track changes with a `Map<itemId, timestamp>` for highlight state.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:fs` (via Bun) | native | File watching | Built into Bun, zero dependencies, sufficient for single-directory watch |
| React hooks | 19.x | State management | Already in project, standard React patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `chokidar` | 4.x+ | File watching | Fallback if native fs.watch proves unreliable |
| `@inkjs/ui` Spinner | 2.x | Loading indicator | Already in project, use for debounce spinner |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `fs.watch` | `chokidar` | Chokidar handles edge cases (atomic writes, editor behaviors) but adds dependency |
| Custom debounce | `lodash.debounce` | Lodash is battle-tested but adds dependency; custom is simpler for this use case |
| `Map` for timestamps | React state array | Map is more efficient for lookup/deletion by key |

**Installation:**
```bash
# No new dependencies needed for primary approach
# If chokidar fallback is desired:
bun add chokidar
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   ├── useFileWatcher.ts      # File watching with debounce
│   ├── useChangeHighlight.ts  # Track and fade changed items
│   └── useGsdData.ts          # Modified to accept refresh trigger
├── components/
│   └── layout/
│       └── Header.tsx         # Add refresh spinner indicator
└── lib/
    └── types.ts               # Add change tracking types
```

### Pattern 1: File Watcher Hook with Debounce
**What:** Custom hook that watches a directory and triggers callbacks with debouncing
**When to use:** When you need to watch files and debounce rapid changes
**Example:**
```typescript
// Source: Bun docs + React debounce patterns
import { watch } from 'node:fs';
import { useEffect, useRef, useState } from 'react';

interface UseFileWatcherOptions {
  path: string;
  debounceMs?: number;
  onError?: (error: Error) => void;
}

interface UseFileWatcherResult {
  changedFiles: string[];
  isRefreshing: boolean;
  lastRefresh: number | null;
}

export function useFileWatcher({
  path,
  debounceMs = 300,
  onError,
}: UseFileWatcherOptions): UseFileWatcherResult {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [changedFiles, setChangedFiles] = useState<string[]>([]);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const timeoutRef = useRef<Timer | null>(null);
  const pendingFilesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const watcher = watch(path, { recursive: true }, (event, filename) => {
      if (!filename) return;

      // Accumulate changed files
      pendingFilesRef.current.add(filename);
      setIsRefreshing(true);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new debounced callback
      timeoutRef.current = setTimeout(() => {
        const files = Array.from(pendingFilesRef.current);
        pendingFilesRef.current.clear();
        setChangedFiles(files);
        setLastRefresh(Date.now());
        setIsRefreshing(false);
      }, debounceMs);
    });

    watcher.on('error', (err) => {
      onError?.(err);
    });

    return () => {
      watcher.close();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [path, debounceMs, onError]);

  return { changedFiles, isRefreshing, lastRefresh };
}
```

### Pattern 2: Change Highlight Tracking
**What:** Track which items recently changed and auto-clear after fade duration
**When to use:** When items need temporary visual highlighting
**Example:**
```typescript
// Source: React patterns for timed state
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseChangeHighlightOptions {
  fadeDurationMs?: number;
  holdDurationMs?: number;
}

export function useChangeHighlight({
  fadeDurationMs = 500,
  holdDurationMs = 5000,
}: UseChangeHighlightOptions = {}) {
  // Map of itemId -> timestamp when change detected
  const [changedItems, setChangedItems] = useState<Map<string, number>>(new Map());
  const timersRef = useRef<Map<string, Timer>>(new Map());

  // Mark items as changed
  const markChanged = useCallback((itemIds: string[]) => {
    const now = Date.now();
    setChangedItems((prev) => {
      const next = new Map(prev);
      for (const id of itemIds) {
        next.set(id, now);

        // Clear existing timer for this item
        const existingTimer = timersRef.current.get(id);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Set new timer to remove highlight
        const timer = setTimeout(() => {
          setChangedItems((current) => {
            const updated = new Map(current);
            updated.delete(id);
            return updated;
          });
          timersRef.current.delete(id);
        }, holdDurationMs + fadeDurationMs);

        timersRef.current.set(id, timer);
      }
      return next;
    });
  }, [holdDurationMs, fadeDurationMs]);

  // Check if item is in highlight state
  const isHighlighted = useCallback((itemId: string): boolean => {
    return changedItems.has(itemId);
  }, [changedItems]);

  // Check if item is in fade-out state (past hold duration)
  const isFading = useCallback((itemId: string): boolean => {
    const timestamp = changedItems.get(itemId);
    if (!timestamp) return false;
    return Date.now() - timestamp > holdDurationMs;
  }, [changedItems, holdDurationMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  return { markChanged, isHighlighted, isFading, changedItems };
}
```

### Pattern 3: Integration with useGsdData
**What:** Modify existing data hook to support external refresh triggers
**When to use:** When data loading needs to be triggered by file changes
**Example:**
```typescript
// Source: Existing useGsdData.ts pattern
export function useGsdData(planningDir = '.planning', refreshTrigger?: number): GsdData {
  const [data, setData] = useState<GsdData>(defaultData);

  useEffect(() => {
    const loadData = async () => {
      // Existing loading logic...
    };
    loadData();
  }, [planningDir, refreshTrigger]); // Add refreshTrigger to deps

  return data;
}
```

### Anti-Patterns to Avoid
- **Polling when native watching works:** Don't default to `setInterval` polling; use native `fs.watch` first
- **Re-parsing unchanged files:** For now, full re-parse is fine per CONTEXT.md decision, but don't add complexity trying to optimize
- **Leaking timers:** Always cleanup `setTimeout`/`setInterval` in `useEffect` cleanup functions
- **Watching node_modules:** Always exclude or scope watch paths narrowly

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File watching | Custom polling loop | `fs.watch` or `chokidar` | Edge cases with atomic writes, editor temp files, symlinks |
| Spinner animation | ASCII spinner with setInterval | `@inkjs/ui` Spinner | Already in project, handles frame timing |
| Debounce logic | Inline setTimeout | Extract to reusable hook | Cleanup is tricky, easy to leak timers |
| Background colors in terminal | ANSI escape codes | Ink `<Text backgroundColor>` | Cross-terminal compatibility |

**Key insight:** File watching seems simple but has many edge cases (atomic writes where editors write to temp file then rename, rapid saves, editor backup files). Using established patterns avoids these pitfalls.

## Common Pitfalls

### Pitfall 1: Duplicate Events from fs.watch
**What goes wrong:** `fs.watch` often fires multiple events for a single file save
**Why it happens:** Editors often write to temp file, then rename; OS may report multiple events
**How to avoid:** Debounce is essential (the 300ms default catches most duplicates)
**Warning signs:** Seeing 2-3 refreshes per save instead of 1

### Pitfall 2: Timer Leaks on Unmount
**What goes wrong:** setTimeout callbacks fire after component unmounts, causing state update errors
**Why it happens:** Forgetting to clear timers in useEffect cleanup
**How to avoid:** Store timer refs and clear them in cleanup function
**Warning signs:** "Can't perform a React state update on an unmounted component" warnings

### Pitfall 3: State Lost on Refresh
**What goes wrong:** Navigation state (expanded phases, cursor position) resets when data refreshes
**Why it happens:** Passing new data object triggers full re-render
**How to avoid:** Keep navigation state in separate hooks, only update data state
**Warning signs:** Cursor jumps to top, expanded sections collapse after file save

### Pitfall 4: EMFILE/ENOSPC on Large Directories
**What goes wrong:** "Too many open files" or "System limit for file watchers reached"
**Why it happens:** Watching too many files, or watching node_modules
**How to avoid:** Scope watch to `.planning/` only (which is small), never watch node_modules
**Warning signs:** Errors on startup or after running for a while

### Pitfall 5: Watcher Fails Silently
**What goes wrong:** File changes stop being detected without any error
**Why it happens:** Some filesystems or edge cases can cause watcher to stop
**How to avoid:** Add error handler to watcher, consider adding heartbeat/polling fallback
**Warning signs:** UI stops updating even though files are being saved

## Code Examples

Verified patterns for this implementation:

### Bun fs.watch with Recursive Option
```typescript
// Source: https://bun.com/docs/guides/read-file/watch
import { watch } from 'node:fs';

const watcher = watch('.planning', { recursive: true }, (event, filename) => {
  console.log(`Detected ${event} in ${filename}`);
});

// Cleanup
process.on('SIGINT', () => {
  watcher.close();
  process.exit(0);
});
```

### Spinner in Header/Status Bar
```typescript
// Source: @inkjs/ui documentation
import { Spinner } from '@inkjs/ui';
import { Box, Text } from 'ink';

function Header({ isRefreshing }: { isRefreshing: boolean }) {
  return (
    <Box>
      <Text>GSD Status</Text>
      {isRefreshing && (
        <Box marginLeft={1}>
          <Spinner label="" />
        </Box>
      )}
    </Box>
  );
}
```

### Highlight with Background Color
```typescript
// Source: Ink documentation
import { Text } from 'ink';

interface HighlightTextProps {
  children: React.ReactNode;
  isHighlighted: boolean;
  isFading: boolean;
}

function HighlightText({ children, isHighlighted, isFading }: HighlightTextProps) {
  // Subtle highlight: dim yellow background
  // Fading: transition to normal (terminals don't support CSS transitions,
  // so we just remove the highlight after the hold period)
  const bgColor = isHighlighted && !isFading ? '#3d3d00' : undefined;

  return (
    <Text backgroundColor={bgColor}>
      {children}
    </Text>
  );
}
```

### Error Display in Status Bar
```typescript
// Source: @inkjs/ui StatusMessage
import { StatusMessage } from '@inkjs/ui';
import { Box } from 'ink';

function StatusBar({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <Box marginTop={1}>
      <StatusMessage variant="warning">{error}</StatusMessage>
    </Box>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `chokidar` for all file watching | Native `fs.watch` with `recursive: true` | Node 19.1+ / Bun 1.3+ | Fewer dependencies, simpler setup |
| `lodash.debounce` | Custom hook with `useEffect` | React 18+ patterns | More control, cleaner cleanup |
| Polling with `setInterval` | Event-based watching | Always preferred | Lower CPU usage |

**Deprecated/outdated:**
- `fs.watchFile`: Uses polling, less efficient than `fs.watch`
- `chokidar` globs: Removed in v4, use native `glob()` from `node:fs/promises` if needed

## Open Questions

Things that couldn't be fully resolved:

1. **Exact highlight color that fits palette**
   - What we know: Ink supports hex colors via chalk
   - What's unclear: Best subtle highlight color for the existing cyan/green/yellow palette
   - Recommendation: Start with dim yellow (`#3d3d00`) or dim cyan (`#003d3d`), adjust based on appearance

2. **Spinner placement in header vs footer**
   - What we know: Header has available space on the right side
   - What's unclear: Whether header or a dedicated status line is better UX
   - Recommendation: Add to header next to project name, it's already the "status" area

3. **Terminal animation limitations**
   - What we know: Terminals don't support CSS transitions; only discrete state changes
   - What's unclear: Whether the "fade" effect is truly achievable
   - Recommendation: Implement as two states (highlighted -> normal) after timeout; true fade would require rapidly cycling colors which may cause flicker

## Sources

### Primary (HIGH confidence)
- [Bun fs.watch documentation](https://bun.com/docs/guides/read-file/watch) - Native file watching API
- [Bun Node.js compatibility](https://bun.com/docs/runtime/nodejs-compat) - fs module 92% test pass rate
- [Ink GitHub](https://github.com/vadimdemedes/ink) - React for CLI, Text component props
- [@inkjs/ui GitHub](https://github.com/vadimdemedes/ink-ui) - Spinner, StatusMessage components

### Secondary (MEDIUM confidence)
- [Chokidar GitHub](https://github.com/paulmillr/chokidar) - Robust file watching alternative
- [React debounce patterns](https://www.developerway.com/posts/debouncing-in-react) - useEffect cleanup patterns
- [useEffect cleanup guide](https://refine.dev/blog/useeffect-cleanup/) - Timer cleanup patterns

### Tertiary (LOW confidence)
- WebSearch results on Bun + chokidar compatibility - some users report issues, but Bun 1.3+ should work

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native Bun APIs verified, @inkjs/ui already in project
- Architecture: HIGH - React patterns are well-established
- Pitfalls: HIGH - Well-documented issues with fs.watch and timer cleanup
- Highlight animation: MEDIUM - Terminal limitations may require simplified approach

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable domain)
