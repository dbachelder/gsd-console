# Stack Research: OpenCode Extensions

**Researched:** 2025-01-24
**Confidence:** HIGH (based on direct source code analysis)

## OpenCode Technology Stack

### Core Runtime
| Technology | Version | Purpose |
|------------|---------|---------|
| Bun | 1.3.5 | JavaScript runtime, package manager, bundler |
| TypeScript | 5.8.2 | Type system |
| SolidJS | 1.9.10 | Reactive UI framework (both TUI and Web) |

### TUI Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| @opentui/core | 0.1.74 | Native TUI rendering engine (Zig-backed) |
| @opentui/solid | 0.1.74 | SolidJS reconciler for OpenTUI |

OpenTUI is SST's in-house terminal UI framework. It uses a three-tier architecture: TypeScript API, FFI boundary, Zig native code. The Zig layer handles rendering, text buffers, and hit detection at native speeds. Frame diffing and ANSI generation achieve sub-millisecond frame times (60+ FPS).

### Web UI Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| SolidJS | 1.9.10 | Reactive UI |
| @solidjs/router | 0.15.4 | Client-side routing |
| TailwindCSS | 4.1.11 | Styling |
| Vite | 7.1.4 | Build tool |

### Client/Server Architecture
| Component | Technology | Purpose |
|-----------|------------|---------|
| Server | Hono | HTTP API server with SSE for events |
| SDK | Generated from OpenAPI | Type-safe client library |
| Events | Server-Sent Events (SSE) | Real-time updates |

OpenCode uses a client/server architecture where the server runs locally and exposes an HTTP API. Both TUI and Web UI are clients that consume this API. This enables remote control scenarios (e.g., mobile app driving desktop TUI).

## Extension Mechanisms

### Plugin System (PRIMARY MECHANISM)

**Location:** `packages/plugin/`

**Architecture:**
Plugins are JavaScript/TypeScript modules that export an async function receiving a `PluginInput` context and returning a `Hooks` object.

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    // Hooks implementation
  }
}
```

**Available Hooks (from `packages/plugin/src/index.ts`):**

| Hook | Purpose |
|------|---------|
| `event` | React to any system event |
| `config` | Modify configuration on load |
| `tool` | Add custom tools (LLM-callable functions) |
| `auth` | Custom authentication providers |
| `chat.message` | Intercept new messages |
| `chat.params` | Modify LLM parameters (temperature, etc.) |
| `chat.headers` | Inject custom headers for LLM requests |
| `permission.ask` | Customize permission prompts |
| `command.execute.before` | Hook before slash commands |
| `tool.execute.before` | Hook before tool execution |
| `tool.execute.after` | Hook after tool execution |
| `experimental.chat.messages.transform` | Transform message history |
| `experimental.chat.system.transform` | Transform system prompt |
| `experimental.session.compacting` | Customize session compaction |
| `experimental.text.complete` | Post-process text completions |

**Plugin Loading (from `packages/opencode/src/plugin/index.ts`):**
1. Internal plugins (CodexAuthPlugin, CopilotAuthPlugin)
2. Built-in npm plugins (anthropic-auth, gitlab-auth)
3. User-configured plugins from `opencode.json` config
4. Local file plugins via `file://` URLs

**What Plugins CAN Do:**
- Add custom tools with Zod schema validation
- Hook into events (session created/deleted, messages, etc.)
- Modify LLM parameters and headers
- Implement custom auth providers
- Execute shell commands via Bun's `$` API
- Call OpenCode API via the SDK client

**What Plugins CANNOT Do:**
- Add UI components to the TUI
- Modify the sidebar layout
- Create custom panels or views
- Access or modify the rendering layer
- Inject SolidJS components

### API (HTTP + SSE)

**OpenAPI Spec:** `packages/sdk/openapi.json`

**Key Endpoints:**
| Endpoint | Purpose |
|----------|---------|
| `GET /global/health` | Health check |
| `GET /global/event` | SSE event stream |
| `GET /project/current` | Current project info |
| `GET /session` | List sessions |
| `POST /session` | Create session |
| `POST /session/{id}/chat` | Send message |
| `POST /session/{id}/abort` | Abort generation |
| `GET /session/{id}/event` | Session-specific SSE |

**Event Types (via SSE):**
- `session.created`, `session.updated`, `session.deleted`
- `session.status`, `session.error`, `session.idle`
- `message.updated`, `message.part.updated`
- `permission.updated`, `permission.replied`
- `tool.execute.before`, `tool.execute.after`
- `tui.prompt.append`, `tui.command.execute`, `tui.toast.show`

The `tui.*` events are notable - they allow plugins to trigger TUI actions like showing toasts or executing commands, providing indirect UI control.

### TUI Extensibility

**Assessment: NOT EXTENSIBLE for custom panels**

The TUI architecture in `packages/opencode/src/cli/cmd/tui/` is monolithic:

1. **Fixed Layout:** `app.tsx` renders a fixed component tree with nested providers
2. **Hardcoded Routes:** Two routes: "home" and "session"
3. **No Component Registry:** No mechanism to inject custom components
4. **OpenTUI Limitation:** OpenTUI is a rendering library, not an extensible application framework

The existing sidebar (`routes/session/sidebar.tsx`) is a fixed component showing:
- Session title/share URL
- Context (tokens, cost)
- MCP server status
- LSP status
- Todo list
- Modified files

There is no plugin hook for UI modifications. The TUI events (`tui.toast.show`, `tui.command.execute`) are the only indirect UI interactions available.

### Web UI Extensibility

**Assessment: SLIGHTLY MORE FLEXIBLE but still limited**

The web app (`packages/app/`) uses the same fixed architecture:
- SolidJS with `@solidjs/router`
- Fixed routes: Home, Session
- Shared UI components in `packages/ui/`

The web UI does NOT have a plugin system for UI extensions. However, being a web app, it could theoretically be extended via:
- Browser extensions
- UserScripts (Tampermonkey/Violentmonkey)
- Proxy injection

But these are hacks, not supported extension mechanisms.

## Recommendation

### Primary Approach: Custom MCP Server + Plugin Tool

**Rationale:** Since plugins can add custom tools, the most viable approach is:

1. **Create an MCP Server** that serves GSD planning data
2. **Create an OpenCode Plugin** that:
   - Registers a custom tool for GSD workflows
   - Hooks into session events to track context
   - Uses `tui.toast.show` events for notifications

**What this achieves:**
- GSD tools available to the LLM (can be invoked via `@gsd` or tool calls)
- Toast notifications for status updates
- Session-level context tracking

**What this does NOT achieve:**
- Persistent sidebar panel showing planning doc status
- Visual indicators in the TUI
- Custom UI components

### Alternative Approach: Fork OpenCode TUI

If a proper sidebar/panel is required, the only option is forking OpenCode and modifying:
- `packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx`
- Adding a GSD section to the existing sidebar

**Pros:**
- Full control over UI
- Native integration

**Cons:**
- Maintenance burden (keep up with upstream)
- Not a "plugin" - requires code changes

### Recommended Path Forward

**Phase 1: Plugin + MCP Server (No UI)**
- Build MCP server exposing GSD planning docs
- Build plugin with custom GSD tool
- Use toast events for notifications
- Proof of concept without UI changes

**Phase 2: Evaluate UI Needs**
- If sidebar is essential, fork OpenCode
- Or wait for OpenCode to add UI extensibility (track: https://github.com/anomalyco/opencode/issues)

## Key Dependencies

### For Plugin Development
```json
{
  "dependencies": {
    "@opencode-ai/plugin": "^1.1.34",
    "@opencode-ai/sdk": "^1.1.34",
    "zod": "^4.1.8"
  },
  "devDependencies": {
    "typescript": "^5.8.2",
    "@types/bun": "^1.3.5"
  }
}
```

### For MCP Server
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.25.2"
  }
}
```

### For Forking (if needed)
- Full OpenCode source: https://github.com/anomalyco/opencode
- OpenTUI: https://github.com/sst/opentui
- Zig compiler (for OpenTUI native builds)

## Sources

- OpenCode source code: `/Users/dan/src/opencode/`
- Plugin package: `packages/plugin/src/index.ts`
- Plugin loader: `packages/opencode/src/plugin/index.ts`
- TUI app: `packages/opencode/src/cli/cmd/tui/app.tsx`
- Sidebar: `packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx`
- SDK: `packages/sdk/`
- OpenAPI spec: `packages/sdk/openapi.json`
- OpenTUI GitHub: https://github.com/sst/opentui
- OpenCode docs: https://opencode.ai/docs/plugins/
