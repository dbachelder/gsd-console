# Features Research: OpenCode Extension Capabilities

**Domain:** OpenCode Plugin/Extension System
**Researched:** 2026-01-24
**Confidence:** HIGH (verified from source code and official docs)

## Executive Summary

OpenCode has a comprehensive plugin system built on TypeScript/JavaScript that provides hooks into virtually all aspects of the application lifecycle. Plugins can define custom tools, intercept events, modify behavior through pre/post hooks, and execute shell commands. However, **plugins cannot add custom UI components** - the TUI is built with a proprietary rendering system (opentui) that has no plugin extension points for the sidebar or other UI elements.

For building a GSD status panel, the most viable approach is creating a **custom tool + event subscription** combo rather than trying to add visual UI elements.

---

## Documented Capabilities

These capabilities are explicitly documented in official sources.

### Plugin Context (What Plugins Receive)

| Property | Type | Purpose |
|----------|------|---------|
| `project` | `Project` | Project info (id, worktree, vcsDir, vcs type) |
| `directory` | `string` | Current working directory |
| `worktree` | `string` | Git worktree path |
| `client` | `OpencodeClient` | Full SDK client for API access |
| `$` | `BunShell` | Bun's shell API for command execution |
| `serverUrl` | `URL` | OpenCode server URL |

**Confidence: HIGH** - Verified from `/Users/dan/src/opencode/packages/plugin/src/index.ts`

### Event Subscription

Plugins can subscribe to all system events via the `event` hook:

**Command Events:**
- `command.executed` - When a slash command is run

**File Events:**
- `file.edited` - When a file is edited by OpenCode
- `file.watcher.updated` - When external file changes detected (add/change/unlink)

**Session Events:**
- `session.created` / `session.updated` / `session.deleted`
- `session.idle` - When session becomes idle (response complete)
- `session.compacted` - When session is summarized
- `session.status` - Status changes (idle/busy/retry)
- `session.diff` - File diffs in session
- `session.error` - Errors occurred

**Message Events:**
- `message.updated` / `message.removed`
- `message.part.updated` / `message.part.removed`

**Tool Events:**
- `tool.execute.before` - Before tool runs (can modify args)
- `tool.execute.after` - After tool completes (can modify output)

**TUI Events:**
- `tui.prompt.append` - Text appended to prompt
- `tui.command.execute` - UI command triggered
- `tui.toast.show` - Toast notification shown

**Permission Events:**
- `permission.updated` / `permission.replied`

**Confidence: HIGH** - Verified from official docs and source code

### Custom Tool Definition

Plugins can add custom tools using the `tool` helper:

```typescript
import { type Plugin, tool } from "@opencode-ai/plugin"

export const GSDPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      gsd_status: tool({
        description: "Check GSD planning document status",
        args: {
          path: tool.schema.string().describe("Path to .planning directory"),
        },
        async execute(args, toolCtx) {
          // Can use ctx.$ for shell commands
          // Can access files via Bun file APIs
          // Can call ctx.client for SDK operations
          return `Status: ...`
        },
      }),
    },
  }
}
```

**Confidence: HIGH** - Verified from source and existing tools in `.opencode/tool/`

### Hook System (Lifecycle Interception)

| Hook | Purpose | Can Modify |
|------|---------|------------|
| `chat.message` | New message received | Output parts |
| `chat.params` | LLM call parameters | temperature, topP, topK, options |
| `chat.headers` | LLM request headers | headers object |
| `tool.execute.before` | Before tool runs | args object |
| `tool.execute.after` | After tool completes | title, output, metadata |
| `permission.ask` | Permission prompt | status (ask/deny/allow) |
| `command.execute.before` | Before command | parts array |
| `experimental.session.compacting` | Session compaction | context array, prompt |
| `experimental.chat.messages.transform` | Message transformation | messages array |
| `experimental.chat.system.transform` | System prompt | system strings |

**Confidence: HIGH** - Verified from Hooks interface in `/Users/dan/src/opencode/packages/plugin/src/index.ts`

### SDK Client Capabilities

The plugin's `client` object provides full API access:

**Session Management:**
- `session.create()` - Create new session
- `session.prompt({ path: { id }, body: { parts } })` - Send message
- `session.list()` - List sessions
- `session.get({ path: { id } })` - Get session
- `session.abort({ sessionID })` - Abort running session

**File Operations:**
- `file.read({ query: { path } })` - Read file content
- `file.list({ query: { path } })` - List directory
- `file.status()` - Get file modification status

**Search:**
- `find.text({ query: { pattern } })` - Grep-like search
- `find.files({ query: { query } })` - Fuzzy file search
- `find.symbols({ query: { query } })` - Symbol search

**TUI Interaction:**
- `tui.appendPrompt({ body: { text } })` - Add text to prompt
- `tui.showToast({ body: { message, variant } })` - Show notification
- `tui.executeCommand({ body: { command } })` - Trigger UI command

**Confidence: HIGH** - Verified from SDK types

### Shell Execution

Full Bun shell access via `$`:

```typescript
const result = await ctx.$`gsd status`.quiet().text()
const exitCode = (await ctx.$`gsd check`.nothrow()).exitCode
```

**Confidence: HIGH** - BunShell interface documented in source

---

## Architectural Capabilities

These are possible based on code architecture, even if not explicitly documented.

### File Watching (.planning/ files)

**CAN DO:** Subscribe to `file.watcher.updated` events to detect changes in `.planning/` directory.

```typescript
event: async ({ event }) => {
  if (event.type === "file.watcher.updated") {
    const file = event.properties.file
    if (file.includes(".planning/")) {
      // React to planning doc changes
    }
  }
}
```

**Caveat:** File watcher requires `OPENCODE_EXPERIMENTAL_FILEWATCHER=true` flag based on source code analysis.

**Confidence: MEDIUM** - Implementation exists, feature flag uncertain

### Agent Spawning (Secondary Sessions)

**CAN DO:** Create child sessions and send prompts via SDK:

```typescript
const session = await ctx.client.session.create({
  body: { parentID: currentSessionID }
})

await ctx.client.session.prompt({
  path: { id: session.data.id },
  body: {
    agent: "gsd-agent",  // Custom agent defined in config
    parts: [{ type: "text", text: "Run GSD workflow..." }]
  }
})
```

**Confidence: HIGH** - SDK example demonstrates this pattern

### Command Execution

**CAN DO:** Run arbitrary shell commands including GSD CLI:

```typescript
// Execute GSD commands
const result = await ctx.$`gsd new-milestone "Add feature X"`.text()

// Or with error handling
const proc = await ctx.$`gsd status`.nothrow()
if (proc.exitCode === 0) {
  // Success
}
```

**Confidence: HIGH** - Bun shell is first-class capability

### Custom Slash Commands

**CAN DO:** Define commands via config that trigger plugin behavior:

```json
{
  "command": {
    "gsd": {
      "template": "Check GSD status and suggest next actions",
      "description": "GSD workflow helper",
      "agent": "gsd-agent"
    }
  }
}
```

**Confidence: HIGH** - Documented feature

---

## Limitations

These capabilities are **explicitly NOT possible** with the current architecture.

### No Custom UI Components

**CANNOT DO:** Add sidebar panels, widgets, or custom UI elements.

The TUI is built with opentui (Solid.js-based terminal renderer) with hardcoded components. The sidebar is a fixed React-like component in `/packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx` with no plugin extension points.

**Evidence:**
- Sidebar displays: session title, context tokens, cost, MCP status, LSP status, todos, modified files
- No `plugin.ui` or similar hook in the Hooks interface
- No slot/widget system for custom components

**Confidence: HIGH** - Verified from complete source review

### No UI Event Interception

**CANNOT DO:** Intercept keystrokes or render custom views.

While `tui.*` events exist, they only allow:
- Appending to prompt
- Showing toasts
- Executing existing commands

No events for:
- Custom keyboard shortcuts in plugins
- Rendering custom dialogs
- Injecting custom UI elements

**Confidence: HIGH** - API surface is complete in types

### No Persistent Background Process

**CANNOT DO:** Run continuous background tasks independent of session.

Plugins are initialized per-project and tied to session lifecycle. No mechanism for:
- Persistent file watchers outside session
- Background daemons
- Cross-session state

**Confidence: MEDIUM** - Implied by architecture

---

## Relevant for GSD Panel

### File Watching

**Status:** PARTIALLY POSSIBLE

- Can subscribe to `file.watcher.updated` events
- Events include file path and event type (add/change/unlink)
- Requires experimental feature flag
- Cannot filter by directory at subscription level (must filter in handler)

**Recommended approach:**
```typescript
event: async ({ event }) => {
  if (event.type === "file.watcher.updated") {
    const { file, event: evtType } = event.properties
    if (file.startsWith(ctx.directory + "/.planning/")) {
      // Handle planning doc changes
      await updateGSDStatus(file, evtType)
    }
  }
}
```

### UI Components

**Status:** NOT POSSIBLE

- Cannot add custom sidebar panels
- Cannot add custom widgets or status indicators
- Sidebar is hardcoded in opentui components

**Alternative approaches:**
1. **Toast notifications** - Show status via `tui.showToast()`
2. **Custom tool output** - Return formatted status in tool response
3. **System prompt injection** - Add GSD context to assistant via hooks
4. **Separate TUI** - Build standalone terminal app that runs alongside

### Agent Spawning

**Status:** FULLY POSSIBLE

- Create child sessions with `session.create({ body: { parentID } })`
- Send prompts to sessions with specific agents
- Monitor session events for completion
- Define custom agents in config

**Example flow:**
```typescript
// 1. Create GSD worker session
const gsdSession = await ctx.client.session.create({
  body: { title: "GSD Workflow" }
})

// 2. Send GSD prompt
await ctx.client.session.prompt({
  path: { id: gsdSession.data.id },
  body: {
    agent: "gsd",  // Custom agent from config
    parts: [{ type: "text", text: "Execute /gsd:new-milestone" }]
  }
})

// 3. Monitor for completion
ctx.client.event.on("session.idle", ({ sessionID }) => {
  if (sessionID === gsdSession.data.id) {
    // GSD workflow complete
  }
})
```

### Command Execution

**Status:** FULLY POSSIBLE

- Full shell access via Bun's `$`
- Can run `gsd` CLI commands directly
- Capture stdout/stderr
- Check exit codes

```typescript
// Run GSD CLI
const status = await ctx.$`gsd status`.quiet().text()
const result = await ctx.$`gsd new-project "My Project"`.text()
```

---

## Existing Extensions

### Built-in Plugins (in opencode repo)

| Plugin | Purpose | Location |
|--------|---------|----------|
| `CodexAuthPlugin` | OpenAI Codex OAuth | `/packages/opencode/src/plugin/codex.ts` |
| `CopilotAuthPlugin` | GitHub Copilot auth | `/packages/opencode/src/plugin/copilot.ts` |
| `opencode-anthropic-auth` | Anthropic OAuth | npm package (builtin) |
| `@gitlab/opencode-gitlab-auth` | GitLab auth | npm package (builtin) |

### Example Custom Tools (in opencode repo)

| Tool | Purpose | Pattern |
|------|---------|---------|
| `github-pr-search` | Search GitHub PRs | API integration, uses `fetch()` |
| `github-triage` | Assign/label issues | API integration, uses env vars |

**Key patterns observed:**
1. Use `fetch()` for external APIs
2. Access environment variables via `process.env`
3. Return formatted strings for LLM consumption
4. Use tool.schema for argument validation

### Community Plugins

Mentioned in docs but not found in source:
- `opencode-helicone-session` - Helicone integration
- `opencode-wakatime` - WakaTime integration

---

## Recommendations for GSD Panel

Given the limitations, here's the recommended architecture:

### Option 1: Plugin-Only (Within OpenCode)

**Approach:** Build a plugin that adds:
1. Custom tool `gsd_status` - Check planning doc status
2. Custom tool `gsd_trigger` - Trigger GSD workflows
3. Event handler for file changes
4. Toast notifications for status updates

**Pros:**
- Native integration
- No external process
- Uses existing infrastructure

**Cons:**
- No persistent visual panel
- Status only visible when tool is called
- Cannot show real-time status

### Option 2: External TUI + Plugin (Hybrid)

**Approach:**
1. Build standalone TUI (e.g., with Ratatui/Rust or Ink/Node)
2. TUI watches `.planning/` files directly
3. TUI communicates with OpenCode via SDK or REST API
4. Optional plugin for deeper integration

**Pros:**
- Full UI control
- Persistent status display
- Can run in separate terminal pane

**Cons:**
- Separate process to manage
- More complex architecture

### Option 3: MCP Server

**Approach:** Build GSD as an MCP server that OpenCode can connect to.

**Pros:**
- Standard protocol
- Tools available to all MCP-compatible clients
- Separate lifecycle

**Cons:**
- No UI integration
- Additional server process

**Recommendation:** Start with **Option 1** (pure plugin) to validate the workflow, then consider **Option 2** if persistent visual status becomes essential.

---

## Sources

- OpenCode Source: `/Users/dan/src/opencode/`
- Plugin System: `/packages/plugin/src/index.ts`
- SDK Types: `/packages/sdk/js/src/gen/types.gen.ts`
- Official Docs: https://opencode.ai/docs/plugins/
- TUI Sidebar: `/packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx`
- Example Tools: `/.opencode/tool/`
