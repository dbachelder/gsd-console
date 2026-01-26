# Phase 7: GSD Ralph Loop Command Queue - Research

**Researched:** 2026-01-26
**Domain:** React queue state management, OpenCode SDK integration, command queue UI patterns
**Confidence:** HIGH

## Summary

Phase 7 builds a user-facing Work Queue system for sequential GSD command execution, providing queue management (add/remove commands), status tracking, and integration with existing OpenCode infrastructure. This builds upon Phase 4's BackgroundJob execution engine but adds UI-focused queue operations.

The queue follows React's recommended useReducer pattern for complex state management, reuses the existing OpenCode SDK for execution, and integrates with current TabLayout architecture. Key differentiator from BackgroundJob system: Work Queue is user-managed (add/remove/edit commands), while BackgroundJob is execution-focused (running headless jobs).

**Primary recommendation:** Use React's useReducer for queue state management, reuse BackgroundJob execution engine, add new "WorkQueue" tab to TabLayout, no new dependencies required.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | Component library and state management | Already used, provides useReducer for complex state |
| TypeScript | 5.9.3 | Type safety for queue structures | Already used, prevents runtime errors |
| @opencode-ai/sdk | 1.1.35 | OpenCode API integration | Already integrated in Phase 4, provides command execution |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useReducer (React) | built-in | Complex state transitions | Queue state with add/remove/status updates |
| useState (React) | built-in | Simple state | Queue selection, expansion state |
| useVimNav (custom) | existing | Vim-style navigation | Queue list navigation (j/k, gg/G, Ctrl+d/u) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useReducer | Multiple useState calls | useReducer centralizes logic, easier to extend |
| Custom queue library | useReducer built-in | No need for external library, React patterns suffice |
| New queue system | Extend BackgroundJob | Separates concerns (UI queue vs execution engine) |

**Installation:**
No new dependencies needed - reusing existing stack.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   └── useWorkQueue.ts        # New hook for queue state management
├── lib/
│   └── types.ts               # Extend with WorkQueue types
├── components/
│   ├── queue/
│   │   ├── WorkQueueView.tsx   # New tab component for queue display
│   │   └── QueueEntry.tsx      # Individual queue item with status icon
│   └── layout/
│       └── TabLayout.tsx        # Add 'workqueue' tab
```

### Pattern 1: useReducer for Queue State

**What:** Centralize queue state transitions in a reducer function
**When to use:** Complex state with multiple update operations (add, remove, status change)
**Example:**
```typescript
// Source: React docs - https://react.dev/learn/managing-state
import { useReducer } from 'react';

type QueueAction =
  | { type: 'add'; command: string; args?: string }
  | { type: 'remove'; id: string }
  | { type: 'updateStatus'; id: string; status: 'pending' | 'running' | 'complete' | 'failed' }
  | { type: 'start' }
  | { type: 'stop' };

interface QueuedCommand {
  id: string;
  command: string;
  args?: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  queuedAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

function queueReducer(state: QueuedCommand[], action: QueueAction): QueuedCommand[] {
  switch (action.type) {
    case 'add': {
      return [...state, {
        id: `queue-${Date.now()}`,
        command: action.command,
        args: action.args,
        status: 'pending',
        queuedAt: Date.now(),
      }];
    }
    case 'remove': {
      return state.filter(cmd => cmd.id !== action.id);
    }
    case 'updateStatus': {
      return state.map(cmd =>
        cmd.id === action.id ? { ...cmd, status: action.status } : cmd
      );
    }
    case 'start': {
      // Mark first pending command as running
      return state.map(cmd =>
        cmd.status === 'pending' && state.indexOf(cmd) === 0
          ? { ...cmd, status: 'running', startedAt: Date.now() }
          : cmd
      );
    }
    default: throw new Error(`Unknown action: ${action}`);
  }
}

export function useWorkQueue() {
  const [queue, dispatch] = useReducer(queueReducer, []);
  // ... hook implementation
}
```

### Pattern 2: Status Icons per Queue Item

**What:** Display status indicator in front of each command (pending, running, completed, failed)
**When to use:** Queue list rendering
**Example:**
```typescript
// Status icon mapping
function getStatusIcon(status: QueuedCommand['status']): string {
  switch (status) {
    case 'pending': return '○';  // Hollow circle
    case 'running': return '◐';  // Half-filled circle (spinning indicator)
    case 'complete': return '✓'; // Checkmark
    case 'failed': return '✗';  // X mark
  }
}

// Render queue item
<Box>
  <Text color={statusColor}>{getStatusIcon(command.status)}</Text>
  <Text> {command.command}</Text>
  {command.args && <Text dimColor> {command.args}</Text>}
</Box>
```

### Pattern 3: Integration with BackgroundJob for Execution

**What:** Use existing BackgroundJob system to execute queued commands
**When to use:** Starting queue execution
**Example:**
```typescript
// When queue starts, add first pending command to BackgroundJob
function startQueueExecution() {
  const pendingCommand = queue.find(cmd => cmd.status === 'pending');
  if (!pendingCommand) return; // No commands to execute

  // Dispatch running status
  dispatch({ type: 'start' });

  // Execute via BackgroundJob (already integrated with OpenCode SDK)
  const fullCommand = pendingCommand.args
    ? `${pendingCommand.command} ${pendingCommand.args}`
    : pendingCommand.command;

  addBackgroundJob(fullCommand, activeSessionId);
}

// BackgroundJob completion triggers queue update
onJobComplete((jobId, status) => {
  dispatch({ type: 'updateStatus', id: jobId, status: status });
});
```

### Pattern 4: Stop on Error (Locked Decision)

**What:** Halt queue execution immediately when a command fails
**When to use:** Error handling during execution
**Example:**
```typescript
function handleQueueError(jobId: string, error: string) {
  // Mark failed command with error
  dispatch({ type: 'updateStatus', id: jobId, status: 'failed' });

  // Stop processing remaining commands (do NOT clear queue)
  // Keep all commands in queue for review/retry

  // Show detailed error with suggestion
  showToast(
    `Queue stopped: ${error}\n\nFix error and retry, or remove command from queue`,
    'error'
  );
}
```

### Anti-Patterns to Avoid
- **Don't reimplement BackgroundJob logic:** Reuse existing execution engine, only add UI queue management
- **Don't persist queue:** Queue is session-only (dies when TUI exits) per locked decision
- **Don't show command output during execution:** Only status icons update, per locked decision
- **Don't auto-clear completed commands:** Keep all commands in queue for history, per locked decision

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command execution via OpenCode | Custom SDK wrapper | BackgroundJob hook | Already handles OpenCode SDK, SSE events, error handling |
| Queue state management | Multiple useState | useReducer | Centralized state logic, easier to test and extend |
| Vim navigation | Custom input handling | useVimNav hook | Already tested, handles j/k/gg/G/Ctrl+d/u |
| Status tracking | Custom logic | BackgroundJob status enum | Consistent status values across system |

**Key insight:** Work Queue is UI layer on top of existing BackgroundJob execution engine. Reuse execution logic, only build queue management UI.

## Common Pitfalls

### Pitfall 1: Duplicate Queue Systems
**What goes wrong:** Implementing both Work Queue and BackgroundJob as separate execution engines
**Why it happens:** Confusion about separation of concerns (UI queue vs execution engine)
**How to avoid:** Work Queue manages user-facing queue operations; BackgroundJob handles actual OpenCode execution. Work Queue calls BackgroundJob to execute commands.
**Warning signs:** Two different job types, duplicate status enums, conflicting execution logic

### Pitfall 2: Not Stopping on Error
**What goes wrong:** Queue continues executing after failure, leaving broken state
**Why it happens:** Forgetting to handle error status or auto-starting next command
**How to avoid:** Listen for BackgroundJob errors, immediately stop queue processing, show detailed error message
**Warning signs:** "failed" command still allows next command to start, no error toast shown

### Pitfall 3: Unnecessary Re-renders
**What goes wrong:** Queue flickers or stutters on every status update
**Why it happens:** Updating parent state on every command status change
**How to avoid:** Use useReducer for queue state, use refs for selected index (like useVimNav pattern), avoid controlled components with callbacks on every keystroke
**Warning signs:** Terminal flickers, navigation lags, entire queue re-renders on status change

### Pitfall 4: Persisting Queue to Storage
**What goes wrong:** Queue persists across TUI restarts, confusing users
**Why it happens:** Accidentally using localStorage or writing to files
**How to avoid:** Queue lives in memory only (React state), clear on unmount
**Warning signs:** Old commands appear after restarting TUI, queue files in .planning/

### Pitfall 5: Clearing Queue on Completion
**What goes wrong:** User loses history of executed commands
**Why it happens:** Auto-clearing queue after last command completes
**How to avoid:** Keep all commands in queue with status icons, user can manually clear if needed
**Warning signs:** Empty queue after execution, no way to see what ran

## Code Examples

Verified patterns from official sources:

### useReducer for List State
```typescript
// Source: https://react.dev/learn/managing-state
import { useReducer } from 'react';

function tasksReducer(tasks, action) {
  switch (action.type) {
    case 'added': {
      return [...tasks, {
        id: action.id,
        text: action.text,
        done: false
      }];
    }
    case 'deleted': {
      return tasks.filter(t => t.id !== action.id);
    }
    default: throw Error('Unknown action: ' + action.type);
  }
}

export default function TaskApp() {
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);
  // ...
}
```

### useRef for Non-Re-rendering State
```typescript
// Source: https://react.dev/learn/referencing-values-with-refs
import { useRef } from 'react';

export default function Counter() {
  let ref = useRef(0);

  function handleClick() {
    ref.current = ref.current + 1;
    alert('You clicked ' + ref.current + ' times!');
  }

  return <button onClick={handleClick}>Click me!</button>;
}
```

### BackgroundJob Hook Usage (From Phase 4)
```typescript
// Source: Existing useBackgroundJobs.ts
const {
  jobs: backgroundJobs,
  add: addBackgroundJob,
  cancel: cancelBackgroundJob,
} = useBackgroundJobs({
  sessionId: activeSessionId,
  showToast,
});

// Add command to queue
addBackgroundJob(formattedCommand);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual state spread | useReducer | React 16.8+ | Centralized logic, easier testing |
| Multiple useState | useReducer for complex state | React 16.8+ | Predictable state updates |
| Custom queue libraries | React built-in hooks | Ongoing | No dependency bloat |

**Deprecated/outdated:**
- Class components for state management: Replaced with hooks (React 16.8+)
- Context for global queue state: Unnecessary, queue is local to TUI session

## Open Questions

Things that couldn't be fully resolved:

1. **Work Queue vs BackgroundJob Relationship**
   - What we know: Work Queue is user-facing UI, BackgroundJob is execution engine
   - What's unclear: Whether Work Queue should replace BackgroundView or be separate tab
   - Recommendation: Keep as separate "Work Queue" tab (tab 5), maintain Background tab for existing job visibility

2. **Retry Method After Error (Claude's Discretion)**
   - What we know: Queue stops on error, user can retry failed command
   - What's unclear: Whether retry should re-run single command or continue from that point
   - Recommendation: Allow retry of individual failed command (select and press 'r'), continue execution if success

3. **'w' Shortcut Behavior**
   - What we know: 'w' key is reserved for intelligent queue management
   - What's unclear: What "intelligent based on phase state" means (planning vs execution)
   - Recommendation: 'w' opens Work Queue tab when commands are queued, or adds current phase command to queue if viewing phase

## Sources

### Primary (HIGH confidence)
- [React useReducer docs](https://react.dev/learn/managing-state) - State consolidation patterns
- [React useReducer reference](https://react.dev/reference/react/useReducer) - Hook API and best practices
- [React useRef docs](https://react.dev/learn/referencing-values-with-refs) - Non-rendering state patterns
- [Phase 4 RESEARCH.md](.planning/phases/04-opencode-integration/04-RESEARCH.md) - OpenCode SDK integration patterns
- [useBackgroundJobs.ts](src/hooks/useBackgroundJobs.ts) - Existing queue execution engine
- [TabLayout.tsx](src/components/layout/TabLayout.tsx) - Tab navigation pattern

### Secondary (MEDIUM confidence)
- [React state management best practices](https://react.dev/learn/you-might-not-need-an-effect) - When to use state vs refs
- [useVimNav implementation](src/hooks/useVimNav.ts) - Vim navigation patterns

### Tertiary (LOW confidence)
- None - all sources verified from official docs or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in use, no new dependencies needed
- Architecture: HIGH - Patterns from official React docs, existing codebase patterns
- Pitfalls: HIGH - Based on React best practices and Phase 4 experience

**Research date:** 2026-01-26
**Valid until:** 2026-02-25 (30 days - React patterns stable, OpenCode SDK may update)
