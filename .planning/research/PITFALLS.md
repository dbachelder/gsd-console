# Pitfalls Research: OpenCode Extension Gotchas

**Domain:** OpenCode plugin/extension development
**Researched:** 2026-01-24
**Confidence:** HIGH (verified from source code and GitHub issues)

## Known Limitations

### No UI Panel API (Critical for GSD Panel)

**What:** OpenCode plugins CANNOT render custom UI panels, sidebars, or persistent visual elements.

**Source:** [GitHub Issue #5971](https://github.com/anomalyco/opencode/issues/5971), [Issue #10400](https://github.com/anomalyco/opencode/issues/10400), [Issue #6521](https://github.com/anomalyco/opencode/issues/6521)

**Current plugin capabilities:**
- Register tools (AI-callable functions)
- Register commands (slash commands)
- Hook into events
- Transform system prompts
- Log to console/files

**NOT possible:**
- Render persistent UI panels
- Create sidebars or split views
- Display interactive trees, lists, or forms
- Show real-time status widgets

**Impact on GSD Panel:** This is THE critical limitation. A sidebar showing planning docs status is currently **impossible** via the plugin API. There is an open feature request (#5971) with a proposed `sidebar` hook, but it is NOT implemented.

**Workarounds considered:**
1. Inject status into system prompt (invisible to user, wastes context tokens)
2. Create a custom tool the agent can call (adds latency, uses context)
3. Log to file + tail in separate terminal (poor UX)

**Phase impact:** Phase 1 must NOT assume UI panel capability. Either:
- Wait for #5971 to be implemented
- Build a standalone TUI that runs alongside OpenCode
- Fork OpenCode TUI to add sidebar support

### No StatusLine Hook

**What:** No native way to display context-free status information in the TUI.

**Source:** [GitHub Issue #8619](https://github.com/anomalyco/opencode/issues/8619)

**Problem:** Any content injected via hooks becomes part of conversation context sent to LLM. A statusline displaying on every message consumes ~30 tokens per message (3,000 tokens wasted on 100-message session).

**The `ignored: true` flag does NOT work** for display-only content:
- With `ignored: true` without IDs: Validation error
- With `ignored: true` with proper IDs: Part displays but user message text disappears

**Impact on GSD Panel:** Cannot show GSD status (phase, progress, planning doc health) in a persistent status bar without context cost.

### Plugin Load Order Dependencies

**What:** Plugins are loaded in a specific order, with potential shadowing issues.

**Source:** [GitHub Issue #10063](https://github.com/anomalyco/opencode/issues/10063), [Issue #8759](https://github.com/anomalyco/opencode/issues/8759)

**Load order:**
1. Global config (`~/.config/opencode/opencode.json`)
2. Project config (`opencode.json`)
3. Global plugin directory (`~/.config/opencode/plugins/`)
4. Project plugin directory (`.opencode/plugins/`)

**Problems:**
- Multiple plugins registering auth for same provider: first one "shadows" others (OAuth options disappear)
- Multiple `file://` plugins with same filename (e.g., `index.js`) incorrectly deduplicated

**Impact on GSD Panel:** If GSD plugin conflicts with another plugin's event handlers or tool names, behavior is unpredictable. Use unique namespaces (e.g., `gsd_` prefix for tools).

### Experimental Hooks May Break

**What:** Hooks prefixed with `experimental.` are unstable and may change without notice.

**Source:** Source code analysis of `/packages/opencode/src/plugin/index.ts` and related files.

**Experimental hooks currently available:**
- `experimental.chat.system.transform` - Modify system prompt
- `experimental.chat.messages.transform` - Modify message history
- `experimental.session.compacting` - Customize compaction prompts
- `experimental.text.complete` - Post-process text output

**Impact on GSD Panel:** If we rely on experimental hooks for functionality (e.g., modifying system prompts to include GSD context), those hooks may break in future versions.

---

## Common Mistakes

### Silent Plugin Installation Failures

**What:** When npm plugins fail to install, the error is logged but plugin is silently skipped.

**Source:** [GitHub Issue #8297](https://github.com/anomalyco/opencode/issues/8297)

**Root cause:** In `plugin/index.ts`, builtin plugin failures are caught and logged, but execution continues with `return ""` followed by `if (!plugin) continue`.

**Symptoms:**
- OAuth options mysteriously missing
- No indication of what went wrong
- Particularly affects enterprise environments with corporate npm proxies

**Prevention:**
- Test plugin installation in isolated environment
- Check OpenCode logs (`OPENCODE_LOG_LEVEL=DEBUG`)
- Use local `file://` plugins during development to avoid npm issues

### ESM Import Extension Issues

**What:** `@opencode-ai/plugin` has ESM module resolution issues.

**Source:** [GitHub Issue #8006](https://github.com/anomalyco/opencode/issues/8006)

**Problem:** Compiled `dist/index.js` has `export * from "./tool"` without `.js` extension, which fails in ESM.

**Symptoms:**
- "Cannot find module ./tool" errors
- Plugin loads in development but fails when published to npm

**Prevention:**
- Test published plugin in fresh environment
- Use explicit `.js` extensions in imports
- Consider local `file://` plugins to avoid distribution issues

### Assuming Hook Order

**What:** Hooks from multiple plugins run in load order, not guaranteed order.

**Source:** Source code analysis

**Problem:** If two plugins both hook `tool.execute.before`, both run sequentially but order depends on load order (global config, project config, global dir, project dir).

**Prevention:**
- Don't assume other plugin hooks have run
- Don't mutate shared state without checking current state
- Design hooks to be idempotent

### Blocking Event Handlers

**What:** Plugin event handlers run sequentially and can block the event bus.

**Source:** Source code analysis of `/packages/opencode/src/bus/index.ts`

```typescript
for (const sub of match ?? []) {
  pending.push(sub(payload))  // Awaits each handler
}
return Promise.all(pending)
```

**Prevention:**
- Keep event handlers fast
- Offload heavy work to async background tasks
- Don't do I/O in hot paths

---

## Performance Concerns

### File Watcher Resource Usage

**What:** OpenCode uses `@parcel/watcher` for file monitoring with potential for high CPU/IO.

**Source:** [GitHub Issue #8887](https://github.com/anomalyco/opencode/issues/8887), [Issue #9358](https://github.com/anomalyco/opencode/issues/9358)

**Known issues:**
- Snapshot module ignores `watcher.ignore` config, tracking ALL files including large ignored directories
- Can cause 380GB+ disk usage in `~/.local/share/opencode/snapshot/`
- High CPU usage during agent steps as `git add` processes large files

**Impact on GSD Panel:** If GSD plugin adds its own file watching for `.planning/` directory:
- Could compound existing watcher overhead
- Need to use efficient patterns (watch specific files, not directories)
- Consider polling with debounce instead of real-time watching

**Mitigation:**
- Use existing `file.watcher.updated` event instead of new watcher
- Batch file reads (read multiple planning docs in single operation)
- Cache parsed state, invalidate on file change events
- Set `watcher.ignore` properly if adding custom watching

### Snapshot/Diff Tracking Overhead

**What:** Every agent step triggers snapshot tracking via internal git repo.

**Source:** `/packages/opencode/src/snapshot/index.ts`

**Problem:** `git add .` runs on every `Snapshot.track()` call, processing entire worktree.

**Impact on GSD Panel:** Avoid triggering additional snapshot operations. If writing to `.planning/` files, be aware this triggers snapshot overhead.

### Memory from Event Subscriptions

**What:** Bus subscriptions are stored in memory and not automatically cleaned up.

**Source:** `/packages/opencode/src/bus/index.ts`

**Pattern:**
```typescript
const subscriptions = new Map<any, Subscription[]>()
```

**Prevention:**
- Always call unsubscribe function returned by `Bus.subscribe()`
- Clean up subscriptions when plugin unloads
- Don't subscribe in loops or hot paths

---

## Fragile Areas

### TUI Event Types Are Limited

**What:** Plugin interaction with TUI is limited to predefined events.

**Source:** `/packages/opencode/src/cli/cmd/tui/event.ts`

**Available TUI events:**
- `tui.prompt.append` - Append text to prompt input
- `tui.command.execute` - Trigger a command (limited enum)
- `tui.toast.show` - Show a toast notification
- `tui.session.select` - Navigate to a session

**NOT available:**
- Custom keybindings
- Custom UI components
- Sidebar panels
- Status bar entries

**Impact on GSD Panel:** Can only show toasts, not persistent status. Cannot add keybindings for GSD actions.

### No Cleanup Hook

**What:** Plugins have no guaranteed cleanup/dispose hook.

**Source:** Source code analysis - Plugin functions return hooks but no explicit cleanup mechanism.

**Problem:** If plugin allocates resources (file handles, intervals, subscriptions), no guaranteed point to clean them up.

**Prevention:**
- Use Instance.state() dispose callback if available
- Track resources and clean up on Bus.InstanceDisposed event
- Avoid long-lived resources that require cleanup

### Version Compatibility Unknown

**What:** No semantic versioning guarantee for plugin API.

**Source:** Community observation, package versions

**Problem:** Plugin API may change between OpenCode versions without deprecation warnings.

**Prevention:**
- Pin OpenCode version in documentation
- Test with each OpenCode update
- Keep plugin logic minimal, outsource complexity to standalone tools

---

## Mitigations

| Pitfall | Mitigation |
|---------|------------|
| No UI panel API | Build standalone TUI or wait for #5971; use toasts for critical notifications |
| Silent plugin failures | Test in isolated environment, check logs, use `file://` for development |
| ESM import issues | Use local plugins, test published package in fresh environment |
| File watcher overhead | Use existing events, batch reads, cache state |
| Hook order dependence | Design idempotent hooks, use unique namespaces |
| Blocking event handlers | Keep handlers fast, offload to async |
| Memory leaks | Unsubscribe on Bus.InstanceDisposed |
| Version compatibility | Pin versions, test on updates |

---

## Recommendations for GSD Panel

### Architecture Decision: Standalone TUI vs Plugin

Given the **critical limitation** that plugins cannot render UI panels (#5971 not implemented), the GSD panel has two viable architectures:

**Option A: Standalone TUI (Recommended)**
- Separate Bubble Tea application
- Runs alongside OpenCode in a split terminal (tmux/zellij)
- Full control over UI
- Communicates with OpenCode via SDK or file system
- Not dependent on OpenCode plugin API stability

**Option B: Plugin + External TUI**
- Thin OpenCode plugin that:
  - Registers GSD tools (`gsd_status`, `gsd_next_step`)
  - Hooks events to update shared state file
  - Shows toasts for important status changes
- Separate TUI reads shared state file
- Plugin provides "hooks" into OpenCode, TUI provides UI

**Option C: Wait for Sidebar API**
- Monitor #5971 for implementation
- Highest UX integration
- Unknown timeline (feature request since Dec 2025)

### If Building a Plugin

1. **Use unique tool/hook namespaces** - Prefix everything with `gsd_`
2. **Avoid experimental hooks for critical functionality** - They may break
3. **Don't add file watching** - Use existing `file.watcher.updated` event
4. **Keep hooks fast** - Offload parsing/processing to background
5. **Test installation separately** - ESM issues are common
6. **Use toasts for notifications** - Only reliable UI feedback mechanism
7. **Pin OpenCode version** - API may change without notice

### File Watching Strategy

For monitoring `.planning/` directory:

```typescript
// Subscribe to existing file watcher events
Bus.subscribe(FileWatcher.Event.Updated, async ({ file, event }) => {
  if (file.includes('.planning/')) {
    // Update cached state
    // Don't do heavy I/O here, just mark dirty
    gsdState.markDirty(file)
  }
})

// Separate async refresh loop
setInterval(async () => {
  if (gsdState.isDirty()) {
    await gsdState.refresh() // Batch read all dirty files
  }
}, 5000) // 5 second refresh rate, not real-time
```

### Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|----------------|------------|
| Phase 1: Core plugin | No UI capability | Accept toasts only, plan for external TUI |
| Phase 2: File monitoring | Watcher overhead | Use existing events, batch reads |
| Phase 3: TUI (if standalone) | Coordination with OpenCode | Use SDK client, shared state file |
| Phase 4: Agent integration | Tool namespace conflicts | Use `gsd_` prefix consistently |

---

## Sources

**GitHub Issues (verified):**
- [#5971: Plugin API for custom sidebar panels](https://github.com/anomalyco/opencode/issues/5971)
- [#10400: Plugin Status Bar / Widget Area for Real-Time Plugin State](https://github.com/anomalyco/opencode/issues/10400)
- [#6521: Window System as Foundation for UI Plugin Ecosystem](https://github.com/anomalyco/opencode/issues/6521)
- [#8619: Native StatusLine Hook for Plugins](https://github.com/anomalyco/opencode/issues/8619)
- [#8006: ESM imports missing .js extension breaks plugin loading](https://github.com/anomalyco/opencode/issues/8006)
- [#8759: file:// plugins with same filename incorrectly deduplicated](https://github.com/anomalyco/opencode/issues/8759)
- [#8297: Plugin installation failures are silent](https://github.com/anomalyco/opencode/issues/8297)
- [#10063: Plugin OAuth auth methods silently ignored](https://github.com/anomalyco/opencode/issues/10063)
- [#8887: Snapshot module ignores watcher.ignore config](https://github.com/anomalyco/opencode/issues/8887)

**Source Code (verified):**
- `/packages/opencode/src/plugin/index.ts` - Plugin loading, hook triggering
- `/packages/plugin/src/index.ts` - Plugin API types, hook definitions
- `/packages/opencode/src/bus/index.ts` - Event bus implementation
- `/packages/opencode/src/file/watcher.ts` - File watcher implementation
- `/packages/opencode/src/snapshot/index.ts` - Snapshot tracking
- `/packages/opencode/src/cli/cmd/tui/event.ts` - TUI event types
- `/packages/opencode/src/tool/registry.ts` - Tool registration

**Official Documentation:**
- [OpenCode Plugins](https://opencode.ai/docs/plugins/)
- [OpenCode Custom Tools](https://opencode.ai/docs/custom-tools/)
