# Session Activity Monitoring

Tracks OpenCode sessions to detect active work and display current commands.

## Files

- `src/lib/sessionActivity.ts` - Core utilities for monitoring sessions
- `src/hooks/useSessionActivity.ts` - React hook for components
- `src/components/layout/Footer.session-activity.example.tsx` - Usage examples
- `demo-session-activity.ts` - Standalone demo script

## API

### `getActiveSession()`

Get the most recently active session from OpenCode server.

```typescript
import { getActiveSession } from './lib/sessionActivity.ts';

const activity = await getActiveSession();
console.log(activity?.title);       // "Verify Phase 05 plans (@gsd-plan-checker subagent)"
console.log(activity?.isActive);      // true if updated within last 60 seconds
console.log(activity?.currentActivity); // "gsd-plan-checker: running"
```

Returns:
- `SessionActivity | null` - Activity info or null if no sessions

### `monitorSessionActivity(callback)`

Listen to session events and track real-time activity.

```typescript
import { monitorSessionActivity } from './lib/sessionActivity.ts';

const cleanup = monitorSessionActivity((activity) => {
  console.log(`Activity: ${activity.currentActivity}`);
});

// Stop listening when done
cleanup();
```

Callback receives:
- `SessionActivity` - Current activity state

Returns:
- `() => void` - Cleanup function to stop listening

### `useSessionActivity()`

React hook for tracking session activity in components.

```tsx
import { useSessionActivity } from './hooks/useSessionActivity.ts';

function MyComponent() {
  const activity = useSessionActivity();

  if (!activity) return <Text>No sessions</Text>;

  if (activity.isActive) {
    return <Text color="cyan">● {activity.currentActivity}</Text>;
  }

  return <Text>○ Idle</Text>;
}
```

## Usage Examples

### Footer Integration

Display running command in the TUI footer:

```tsx
import { Box, Text } from 'ink';
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
        Tab: tabs | q: quit
      </Text>
    </Box>
  );
}
```

### Standalone Status Indicator

Show session status as a dedicated component:

```tsx
import { Text } from 'ink';
import { useSessionActivity } from '../hooks/useSessionActivity.ts';

export function SessionStatus() {
  const activity = useSessionActivity();

  if (!activity) return <Text dimColor>No sessions</Text>;
  if (!activity.isActive) return <Text dimColor>○ Idle</Text>;

  return <Text>● {activity.currentActivity}</Text>;
}
```

### Demo Script

Run standalone demo to see real-time activity:

```bash
bun demo-session-activity.ts
```

Output:
```
🔍 OpenCode Session Activity Monitor
Press Ctrl+C to stop

📊 Current: Verify Phase 05 plans (@gsd-plan-checker subagent)
   Active: yes
   Activity: gsd-plan-checker: running

[1:54:19 PM] ● Active
   Verify Phase 05 plans (@gsd-plan-checker subagent)
   → gsd-plan-checker: running
```

## Activity Detection

Active sessions are detected by:
1. Checking `time.updated` from `session.list()`
2. Sessions updated within 60 seconds are considered "active"
3. Current activity extracted from session title parsing

Title patterns detected:
- `Phase XX: Description` → "Working on Phase XX"
- `@subagent-name` → "subagent running"
- `Verb something` → "verifying / planning / executing"

## Real-time Updates

The monitor listens to OpenCode SSE events:
- `message.part.updated` with `type="task"` → Shows subagent name and status
- `message.part.updated` with `type="tool"` → Shows tool name and status
- `message.part.updated` with `type="reasoning"` → Shows reasoning preview

## Requirements

- `opencode serve --port 4096` must be running
- `@opencode-ai/sdk` package installed
- For TUI integration: Ink component

## Notes

- Session activity is cached per minute to avoid excessive API calls
- Uses 60-second threshold for "active" status
- Events are filtered to current session to avoid noise from other sessions
- SDK types don't include all event fields → uses `any` with biome-ignore comments
