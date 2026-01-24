# Architecture Research: OpenCode Structure

**Project:** GSD Status Panel for OpenCode
**Researched:** 2026-01-24
**Confidence:** HIGH (direct source code analysis)

## Executive Summary

OpenCode is a TypeScript monorepo using Bun as runtime, with a client-server architecture where the server exposes a REST/SSE API that multiple UI clients (terminal TUI, web UI, desktop app) can connect to. This architecture is explicitly designed for extensibility, making it well-suited for a GSD status panel.

The key insight is that **OpenCode has TWO distinct TUI systems**:
1. **Web-based TUI** (`packages/app/`) - Solid.js app served via Vite, used in desktop and browser
2. **Terminal TUI** (`packages/opencode/src/cli/cmd/tui/`) - Native terminal UI using `@opentui/solid`, the primary CLI experience

For a GSD panel, we can integrate at multiple levels: server-side plugin (backend data), web UI component (browser/desktop), or terminal TUI component (CLI). The most impactful approach is **all three** - plugin provides data, UIs consume it.

## Codebase Organization

```
opencode/
  packages/
    opencode/           # Core backend (server, session, agents, tools)
      src/
        agent/          # Agent definitions (build, plan, explore, etc.)
        bus/            # Event bus for inter-component communication
        cli/            # CLI commands and TUI (terminal-based)
          cmd/
            tui/        # Terminal TUI using @opentui/solid
              component/
              context/
              routes/
                session/  # Session view with sidebar
        config/         # Configuration management
        mcp/            # MCP server integration
        permission/     # Permission system
        plugin/         # Plugin loading and lifecycle
        project/        # Project instance management
        provider/       # LLM provider integrations
        server/         # HTTP server (Hono framework)
          routes/       # REST API endpoints
        session/        # Session management, messages, prompts
        tool/           # Built-in tools (read, write, bash, etc.)

    plugin/             # Plugin SDK (npm: @opencode-ai/plugin)
      src/
        index.ts        # Plugin types, hooks interface
        tool.ts         # Custom tool definitions
        shell.ts        # Shell integration

    app/                # Web TUI (Solid.js, served via Vite)
      src/
        components/     # UI components (prompt, dialogs, settings)
        context/        # React-like context providers
        pages/          # Route pages (home, session, layout)

    ui/                 # Shared UI components (npm: @opencode-ai/ui)
      src/
        components/     # Reusable components (diff, code, message-part)
        context/        # Shared context providers
        theme/          # Theming system

    sdk/                # Client SDK (npm: @opencode-ai/sdk)
      js/               # JavaScript/TypeScript client

    desktop/            # Desktop app (Tauri wrapper around web UI)
    web/                # Marketing/docs website (Astro)
    docs/               # Documentation source
```

## Server Architecture

**Framework:** Hono (lightweight, fast HTTP framework)
**Runtime:** Bun
**Port:** Default 4096

### API Structure

```
/global              - Global settings (auth, theme)
/project             - Project management
/session             - Session CRUD, messages, prompts
/session/:id/message - Send prompts, stream responses
/permission          - Permission requests/responses
/question            - Question/answer interactions
/provider            - LLM provider management
/config              - Configuration
/mcp                 - MCP server management
/tui                 - TUI-specific endpoints
/file                - File operations
/pty                 - Terminal sessions
/event               - SSE event stream (real-time updates)
```

### Event Bus System

```typescript
// Core event types (from bus/bus-event.ts)
Bus.publish(Event, properties)     // Publish to local subscribers
Bus.subscribe(Event, callback)     // Subscribe to specific event type
Bus.subscribeAll(callback)         // Subscribe to all events

// Key events for GSD integration:
- session.created / session.updated / session.deleted
- session.idle / session.error
- message.part.updated
- permission.asked / permission.replied
- todo.updated
```

The `/event` endpoint streams ALL events via SSE, which is how clients stay synchronized.

## TUI Architecture

### Terminal TUI (Primary CLI)

**Framework:** `@opentui/solid` (custom Solid.js terminal renderer)
**Entry:** `packages/opencode/src/cli/cmd/tui/app.tsx`

```typescript
// Provider hierarchy (from app.tsx)
<ArgsProvider>
  <ExitProvider>
    <KVProvider>
      <ToastProvider>
        <RouteProvider>
          <SDKProvider>              // API client
            <SyncProvider>           // Real-time data sync
              <ThemeProvider>
                <LocalProvider>      // Local state
                  <KeybindProvider>
                    <DialogProvider>
                      <CommandProvider>
                        <App />
                      </CommandProvider>
                    </DialogProvider>
                  </KeybindProvider>
                </LocalProvider>
              </ThemeProvider>
            </SyncProvider>
          </SDKProvider>
        </RouteProvider>
      </ToastProvider>
    </KVProvider>
  </ExitProvider>
</ArgsProvider>
```

**Key Components:**
- `routes/home.tsx` - Landing page with prompt
- `routes/session/index.tsx` - Main session view
- `routes/session/sidebar.tsx` - **Existing sidebar** showing context, MCP status, todo, diffs

**Sidebar Structure (sidebar.tsx):**
```tsx
<box width={42} backgroundColor={theme.backgroundPanel}>
  <scrollbox>
    - Session title
    - Context (tokens, percentage, cost)
    - Todo list (collapsible)
    - Diff summary (collapsible)
    - MCP status (collapsible)
    - LSP status (collapsible)
    - Getting started (dismissible)
  </scrollbox>
</box>
```

### Web TUI (Browser/Desktop)

**Framework:** Solid.js + Vite + TailwindCSS
**Entry:** `packages/app/src/app.tsx`

```typescript
// Provider hierarchy (from app.tsx)
<MetaProvider>
  <ThemeProvider>
    <LanguageProvider>
      <DialogProvider>
        <MarkedProvider>
          <ServerProvider>
            <GlobalSDKProvider>
              <GlobalSyncProvider>
                <Router>
                  <SettingsProvider>
                    <LayoutProvider>
                      <Layout>
                        {children}
                      </Layout>
                    </LayoutProvider>
                  </SettingsProvider>
                </Router>
              </GlobalSyncProvider>
            </GlobalSDKProvider>
          </ServerProvider>
        </MarkedProvider>
      </DialogProvider>
    </LanguageProvider>
  </ThemeProvider>
</MetaProvider>
```

**Layout System (context/layout.tsx):**
- Sidebar state (opened, width, workspaces)
- Terminal panel (height, opened)
- Review panel (diff style, opened)
- Session tabs (active, all)
- Per-session view state (scroll, review open)

## Plugin Architecture

### Plugin Loading (from plugin/index.ts)

```typescript
// Plugin input context
type PluginInput = {
  client: OpencodeClient     // SDK client for API calls
  project: Project           // Current project info
  directory: string          // Working directory
  worktree: string           // Git worktree path
  serverUrl: URL             // Server URL
  $: BunShell                // Shell for commands
}

// Plugin function signature
type Plugin = (input: PluginInput) => Promise<Hooks>

// Loading order:
1. Internal plugins (CodexAuthPlugin, CopilotAuthPlugin)
2. Built-in npm plugins (anthropic-auth, gitlab-auth)
3. Config-specified plugins
4. Local file plugins (.opencode/plugins/)
```

### Available Hooks

```typescript
interface Hooks {
  // Event subscription (all bus events)
  event?: (input: { event: Event }) => Promise<void>

  // Configuration changes
  config?: (input: Config) => Promise<void>

  // Custom tools
  tool?: { [key: string]: ToolDefinition }

  // Authentication providers
  auth?: AuthHook

  // Message lifecycle
  "chat.message"?: (input, output) => Promise<void>
  "chat.params"?: (input, output) => Promise<void>
  "chat.headers"?: (input, output) => Promise<void>

  // Tool lifecycle
  "tool.execute.before"?: (input, output) => Promise<void>
  "tool.execute.after"?: (input, output) => Promise<void>

  // Permission handling
  "permission.ask"?: (input, output) => Promise<void>

  // Command execution
  "command.execute.before"?: (input, output) => Promise<void>

  // Experimental
  "experimental.chat.messages.transform"?: (input, output) => Promise<void>
  "experimental.chat.system.transform"?: (input, output) => Promise<void>
  "experimental.session.compacting"?: (input, output) => Promise<void>
}
```

### Plugin Trigger Mechanism

```typescript
// From plugin/index.ts
export async function trigger<Name extends keyof Hooks>(
  name: Name,
  input: Input,
  output: Output
): Promise<Output> {
  for (const hook of await state().then(x => x.hooks)) {
    const fn = hook[name]
    if (!fn) continue
    await fn(input, output)  // Hooks can mutate output
  }
  return output
}
```

## Agent/Conversation System

### Built-in Agents (from agent/agent.ts)

| Agent | Mode | Purpose |
|-------|------|---------|
| `build` | primary | Default development agent |
| `plan` | primary | Read-only planning/analysis |
| `general` | subagent | Multi-step task execution |
| `explore` | subagent | Codebase exploration |
| `compaction` | hidden | Session summarization |
| `title` | hidden | Title generation |
| `summary` | hidden | Summary generation |

### Subagent Spawning

Subagents are invoked via `@agent` syntax in messages:
```
@explore find all React components
@general research the best testing framework
```

The agent system uses the permission framework to control what each agent can do.

### Session/Message Flow

```
User Input
    |
    v
SessionPrompt.prompt()
    |
    v
Message created (Bus: message.updated)
    |
    v
LLM stream processing (processor.ts)
    |
    v
Tool calls (tool.execute.before hook)
    |
    v
Tool execution
    |
    v
Tool results (tool.execute.after hook)
    |
    v
Continue or complete
    |
    v
Session idle (Bus: session.idle)
```

## Integration Points for GSD Panel

### Option 1: Server-Side Plugin (Backend Data)

Create a plugin that:
1. Subscribes to events to track GSD state
2. Exposes custom API endpoints via plugin tools
3. Integrates with GSD file system

```typescript
// Example GSD plugin
export const GSDPlugin: Plugin = async ({ project, client, directory }) => {
  const gsdState = await loadGSDState(directory)

  return {
    event: async ({ event }) => {
      // Track session changes relevant to GSD
      if (event.type === 'session.idle') {
        await updateGSDProgress(event.properties.sessionID)
      }
    },

    tool: {
      gsd_status: {
        description: "Get GSD planning status",
        args: z.object({}),
        execute: async () => {
          return formatGSDStatus(gsdState)
        }
      }
    }
  }
}
```

### Option 2: Terminal TUI Component

Add to the existing sidebar (`routes/session/sidebar.tsx`):

```tsx
// New section in sidebar
<Show when={gsdEnabled()}>
  <CollapsibleSection title="GSD Status" expanded={expanded.gsd}>
    <GSDStatusPanel sessionID={props.sessionID} />
  </CollapsibleSection>
</Show>
```

Or create a new panel alongside the sidebar:
```tsx
// In session/index.tsx
<box flexDirection="row">
  <Sidebar />
  <MainContent />
  <GSDPanel />  // New right-side panel
</box>
```

### Option 3: Web UI Component

Add to the layout system (`app/src/context/layout.tsx`):

```typescript
// Add GSD panel state
gsdPanel: {
  opened: false,
  width: 300,
}

// Add to Layout component
<Show when={layout.gsdPanel.opened()}>
  <GSDPanel width={layout.gsdPanel.width()} />
</Show>
```

### Option 4: Custom Command/Tool

Register a `/gsd` command that opens a status overlay:

```typescript
Command.register({
  name: 'gsd',
  description: 'Show GSD planning status',
  execute: async (args, session) => {
    // Show GSD status in a dialog or panel
  }
})
```

## Recommended Integration Approach

**Phase 1: Plugin + Custom Tool**
- Create `@opencode-ai/gsd` plugin
- Read `.planning/` directory structure
- Provide `gsd_status` tool for agents
- Emit custom events for GSD state changes

**Phase 2: Terminal TUI Panel**
- Add GSD section to existing sidebar
- Show milestone progress, current phase
- Keyboard shortcut to open detailed view

**Phase 3: Web UI Panel**
- Add resizable right panel to layout
- Rich visualization of planning docs
- Interactive milestone/phase navigation

**Phase 4: Agent Integration**
- Inform agents of GSD context via system prompt injection
- Auto-trigger GSD workflows on certain events

## Component Diagram

```
                              +------------------+
                              |   GSD Planning   |
                              |      Files       |
                              | (.planning/*.md) |
                              +--------+---------+
                                       |
                                       v
+------------------+          +------------------+
|   GSD Plugin     |<-------->|    OpenCode      |
|  (@opencode-ai/  |          |     Server       |
|      gsd)        |          |   (Hono/Bun)     |
+------------------+          +--------+---------+
        |                              |
        | events/tools                 | REST/SSE
        |                              |
        v                              v
+------------------+          +------------------+
|  GSD Status API  |          |     Event Bus    |
| /gsd/status      |          | (session, msg,   |
| /gsd/milestones  |          |  permission...)  |
+------------------+          +--------+---------+
                                       |
                    +------------------+------------------+
                    |                  |                  |
                    v                  v                  v
           +---------------+  +---------------+  +---------------+
           | Terminal TUI  |  |   Web TUI     |  |  Desktop App  |
           | (@opentui/    |  | (Solid.js/    |  | (Tauri +      |
           |    solid)     |  |    Vite)      |  |  Web TUI)     |
           +---------------+  +---------------+  +---------------+
                    |                  |                  |
                    v                  v                  v
           +---------------+  +---------------+  +---------------+
           | GSD Sidebar   |  | GSD Panel     |  | GSD Panel     |
           | Section       |  | Component     |  | Component     |
           +---------------+  +---------------+  +---------------+
```

## Technology Stack Summary

| Layer | Technology | Notes |
|-------|------------|-------|
| Runtime | Bun 1.3.5 | Fast JS runtime, native TypeScript |
| Server | Hono | Lightweight HTTP framework |
| Terminal TUI | @opentui/solid | Custom Solid.js terminal renderer |
| Web TUI | Solid.js + Vite | SPA with reactive UI |
| Desktop | Tauri | Native wrapper for web TUI |
| State | solid-js/store | Reactive state management |
| Styling | TailwindCSS 4.x | Web UI styling |
| Build | Turbo | Monorepo build orchestration |
| Package Manager | Bun workspaces | Fast dependency management |

## Build Order Recommendation

Based on dependencies:

1. **GSD Plugin SDK** - Define types, file parsing utilities
2. **GSD Server Plugin** - Event handling, API endpoints
3. **GSD Terminal TUI** - Sidebar integration (most immediate value)
4. **GSD Web UI** - Rich panel for browser/desktop
5. **Agent Integration** - Context injection, workflow triggers

## Sources

- Direct source code analysis of `/Users/dan/src/opencode/`
- OpenCode plugin documentation: https://opencode.ai/docs/plugins/
- Package.json files for dependency versions
- TypeScript interfaces for type information
