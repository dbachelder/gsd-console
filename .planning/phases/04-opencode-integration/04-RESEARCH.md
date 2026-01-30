# Phase 4: OpenCode Integration - Research

**Researched:** 2026-01-24
**Domain:** OpenCode SDK integration, session management, command queuing
**Confidence:** HIGH

## Summary

Phase 4 requires integrating the GSD TUI with OpenCode, an AI coding agent that runs in the terminal. The TUI needs to spawn OpenCode sessions, queue GSD commands for sequential execution, and connect to existing sessions.

OpenCode provides a comprehensive SDK (`@opencode-ai/sdk`) with full TypeScript support for session management, prompt execution, and event streaming via Server-Sent Events (SSE). The architecture supports running a persistent server (`opencode serve`) that external applications can connect to via HTTP/WebSocket.

The key technical challenges are: (1) detecting existing OpenCode instances, (2) managing the TUI/OpenCode lifecycle, and (3) implementing a command queue with proper session monitoring.

**Primary recommendation:** Use the `@opencode-ai/sdk` to connect to OpenCode's HTTP server, with fallback to spawning a new session via CLI when no server is available.

## Standard Stack

The established libraries/tools for OpenCode integration:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@opencode-ai/sdk` | 1.1.23+ | Type-safe SDK for OpenCode HTTP/WebSocket API | Official SDK, auto-generated from OpenAPI spec |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:child_process` | built-in | Spawning OpenCode CLI | Fallback when no server running |
| `node:net` | built-in | Port detection | Check if OpenCode server is running |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SDK client | Direct HTTP fetch | SDK provides type safety, handles SSE streaming properly |
| Spawning CLI | Forking process | CLI spawn is simpler, better for terminal handoff |

**Installation:**
```bash
bun add @opencode-ai/sdk
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   ├── useOpencodeConnection.ts  # Connection management
│   ├── useCommandQueue.ts        # Queue management
│   └── useSessionEvents.ts       # SSE event handling
├── lib/
│   ├── opencode.ts              # SDK client wrapper
│   └── commands.ts              # Updated command definitions
└── components/
    └── palette/
        └── CommandPalette.tsx    # Updated with queue status
```

### Pattern 1: Server Detection with Fallback

**What:** Check for running OpenCode server before deciding approach
**When to use:** On command execution
**Example:**
```typescript
// Source: OpenCode SDK docs - https://opencode.ai/docs/sdk/
import { createOpencodeClient } from "@opencode-ai/sdk";

async function detectOpencodeServer(port = 4096): Promise<boolean> {
  try {
    const client = createOpencodeClient({ baseUrl: `http://127.0.0.1:${port}` });
    const health = await client.global.health();
    return !!health.data?.version;
  } catch {
    return false;
  }
}
```

### Pattern 2: Event-Driven Command Queue

**What:** Queue commands and process sequentially using SSE events
**When to use:** For ACT-05 (sequential command execution)
**Example:**
```typescript
// Source: OpenCode SDK docs - https://opencode.ai/docs/sdk/
interface QueuedCommand {
  id: string;
  command: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
}

async function processQueue(
  client: OpencodeClient,
  sessionId: string,
  queue: QueuedCommand[]
) {
  for await (const event of await client.event.subscribe()) {
    if (event.type === 'session.idle' && event.sessionID === sessionId) {
      const next = queue.find(c => c.status === 'pending');
      if (next) {
        next.status = 'running';
        await client.session.prompt({
          path: { id: sessionId },
          body: { parts: [{ type: 'text', text: next.command }] }
        });
      }
    }
  }
}
```

### Pattern 3: Terminal Handoff for Session Spawn

**What:** Exit TUI alternate screen, spawn OpenCode, return to TUI
**When to use:** When spawning new OpenCode session from TUI
**Example:**
```typescript
// Source: Existing useExternalEditor.ts pattern
import { spawnSync } from 'node:child_process';

function spawnOpencodeSession(initialPrompt?: string): boolean {
  // Exit alternate screen
  process.stdout.write('\x1b[?1049l');
  process.stdout.write('\x1b[2J\x1b[H');

  try {
    const args = initialPrompt ? ['run', initialPrompt] : [];
    const result = spawnSync('opencode', args, {
      stdio: 'inherit',
      env: process.env,
    });

    // Return to TUI alternate screen
    process.stdout.write('\x1b[?1049h');
    process.stdout.write('\x1b[2J\x1b[H');

    return result.status === 0;
  } catch {
    process.stdout.write('\x1b[?1049h');
    process.stdout.write('\x1b[2J\x1b[H');
    return false;
  }
}
```

### Anti-Patterns to Avoid
- **Polling for session completion:** Use SSE `session.idle` events instead of polling status
- **Blocking the TUI on command execution:** Queue commands and show status, don't block UI
- **Hardcoding port 4096:** Allow port configuration, check common ports
- **Ignoring session permissions:** OpenCode may prompt for tool permissions that block execution

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP client for OpenCode | Custom fetch wrapper | `@opencode-ai/sdk` | Type-safe, handles auth, SSE streaming |
| Event streaming | Manual EventSource | SDK's `event.subscribe()` | Proper backpressure, typed events |
| Session management | Manual state tracking | SDK's session methods | Handles lifecycle, forking, compaction |
| Port detection | Custom socket probe | `net.connect()` with timeout | Built-in, reliable |

**Key insight:** The OpenCode SDK provides 80+ typed endpoints auto-generated from OpenAPI spec. Using it ensures compatibility with future OpenCode versions.

## Common Pitfalls

### Pitfall 1: Assuming OpenCode is Always Available
**What goes wrong:** TUI crashes or hangs when OpenCode isn't installed or running
**Why it happens:** No graceful fallback for missing dependency
**How to avoid:** Check for `opencode` binary before attempting operations; show clear error messages
**Warning signs:** Commands silently fail or hang indefinitely

### Pitfall 2: SSE Stream Resource Leaks
**What goes wrong:** Memory leaks from uncleared event subscriptions
**Why it happens:** SSE streams continue indefinitely; forgetting to abort
**How to avoid:** Store AbortController, call `stream.controller.abort()` on unmount
**Warning signs:** Growing memory usage, duplicate event handlers

### Pitfall 3: Permission Prompts Blocking Queue
**What goes wrong:** Command queue stalls waiting for permission approval
**Why it happens:** OpenCode asks for tool permissions (write files, run commands)
**How to avoid:** Either spawn in permissive mode or handle `permission.asked` events
**Warning signs:** Queue shows "running" forever, session never becomes idle

### Pitfall 4: Port Conflicts
**What goes wrong:** Can't connect to OpenCode server even when running
**Why it happens:** OpenCode TUI uses random port by default, server uses 4096
**How to avoid:** Check multiple common ports (4096-4100), provide manual port config
**Warning signs:** "Connection refused" when user says OpenCode is running

### Pitfall 5: Session Context Mismatch
**What goes wrong:** Commands run in wrong project context
**Why it happens:** OpenCode sessions are project-scoped; connecting to wrong session
**How to avoid:** Filter sessions by project directory, create new session if needed
**Warning signs:** Commands affect files in different project

## Code Examples

Verified patterns from official sources:

### Creating SDK Client
```typescript
// Source: https://opencode.ai/docs/sdk/
import { createOpencodeClient } from "@opencode-ai/sdk";

const client = createOpencodeClient({
  baseUrl: "http://127.0.0.1:4096",
  timeout: 5000,
});
```

### Creating and Prompting a Session
```typescript
// Source: https://opencode.ai/docs/sdk/
const session = await client.session.create({
  body: { title: "GSD Workflow" }
});

await client.session.prompt({
  path: { id: session.data.id },
  body: {
    parts: [{ type: "text", text: "/gsd:plan-phase 4" }],
  }
});
```

### Subscribing to Events
```typescript
// Source: https://opencode.ai/docs/sdk/
const eventStream = await client.event.subscribe();

for await (const event of eventStream) {
  switch (event.type) {
    case 'session.idle':
      // Session completed processing
      break;
    case 'session.error':
      // Handle error
      break;
    case 'message.part.updated':
      // Streaming response update
      break;
  }
}
```

### Listing Sessions
```typescript
// Source: https://opencode.ai/docs/sdk/
const sessions = await client.session.list();

// Filter to current project
const projectDir = process.cwd();
const projectSessions = sessions.data?.filter(
  s => s.info?.projectID?.includes(projectDir)
);
```

### Checking Server Health
```typescript
// Source: https://opencode.ai/docs/sdk/
try {
  const health = await client.global.health();
  console.log(`OpenCode v${health.data?.version}`);
} catch {
  console.log("OpenCode server not running");
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct CLI invocation | SDK + Server API | 2025 | Programmatic control, no terminal takeover |
| No queue support | Event-driven queue | Feature request stage | Sequential execution still custom |
| Single session | Multi-session TUI | 2025 | Can manage multiple concurrent sessions |

**Deprecated/outdated:**
- GitHub repo `opencode-ai/opencode` archived Sept 2025; project continues as anomalyco/opencode
- Old SDK patterns using class instantiation (`new Opencode()`) replaced with factory function (`createOpencodeClient()`)

## Open Questions

Things that couldn't be fully resolved:

1. **Queue Feature Native Support**
   - What we know: Feature request exists for sequential queue execution (issue #6470)
   - What's unclear: Whether native queue support will ship, making our implementation redundant
   - Recommendation: Build custom queue now; adapt if native support appears

2. **TUI Control API Stability**
   - What we know: `/tui/control/*` endpoints exist for driving TUI
   - What's unclear: How stable these endpoints are, whether they're intended for external use
   - Recommendation: Prefer spawning new sessions over controlling existing TUI

3. **Permission Handling in Headless Mode**
   - What we know: `permission.asked` events fire, `permission.replied` can respond
   - What's unclear: Whether auto-approval is safe for GSD workflows
   - Recommendation: Start with user confirmation, consider config option for auto-approve

## Integration Architecture Decision

Based on the research, there are two viable approaches:

### Approach A: SDK Client (Recommended)

Connect to OpenCode server, manage sessions via API:
- **Pros:** Full control, type-safe, non-blocking UI, can show progress
- **Cons:** Requires running server, more complex state management
- **Use for:** ACT-05 (queue commands), connecting to existing sessions

### Approach B: Terminal Handoff (Fallback)

Spawn OpenCode CLI, hand over terminal:
- **Pros:** Simple, works without server, familiar UX
- **Cons:** Loses TUI state, can't queue commands
- **Use for:** ACT-04 (spawn session for complex workflows)

**Recommended hybrid:** Use SDK when server detected, fall back to terminal handoff.

## Sources

### Primary (HIGH confidence)
- [OpenCode SDK docs](https://opencode.ai/docs/sdk/) - Core SDK usage, client creation
- [OpenCode CLI docs](https://opencode.ai/docs/cli/) - CLI commands, attach mode
- [OpenCode Server docs](https://opencode.ai/docs/server/) - Server mode, API endpoints
- [OpenCode TUI docs](https://opencode.ai/docs/tui/) - Keybindings, session management

### Secondary (MEDIUM confidence)
- [DeepWiki sst/opencode](https://deepwiki.com/sst/opencode/6.1-command-line-interface-(cli)) - CLI command reference
- [DeepWiki session management](https://deepwiki.com/sst/opencode/7-message-and-session-management) - Session API details

### Tertiary (LOW confidence)
- [GitHub issue #6470](https://github.com/anomalyco/opencode/issues/6470) - Queue execution feature request
- [npm @opencode-ai/sdk](https://www.npmjs.com/package/@opencode-ai/sdk) - Package info

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official SDK, well-documented
- Architecture: MEDIUM - Patterns derived from SDK docs, not battle-tested
- Pitfalls: MEDIUM - Based on similar integrations, not OpenCode-specific experience

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - OpenCode actively developed, may change)
