# GSD Console

Terminal UI for viewing GSD project status. Displays roadmap progress, phase details, and todos in a keyboard-navigable interface.

## Compatibility

**Works with any GSD `.planning/` directory.** If you have a project using the [GSD workflow](https://github.com/glittercowboy/get-shit-done), this TUI will display its roadmap, phases, and todos with live updates as files change.

**For coding agent integration**, GSD Console supports [opencode](https://github.com/sst/opencode). With opencode installed, you can:
- Spawn opencode sessions directly from the TUI
- Queue GSD commands for sequential execution
- Connect to existing opencode sessions

Without opencode, the TUI works as a standalone viewer — you can still execute GSD CLI commands and edit planning files in your `$EDITOR`.

## OpenCode Integration

### Architecture

GSD Console integrates with OpenCode for coding agent execution:

| Component | Description |
|-----------|-------------|
| `opencode` | Standalone TUI, no HTTP API |
| `opencode serve --port 4096` | Headless server with HTTP API |
| `opencode attach http://localhost:4096` | TUI connected to server |

Sessions are stored in `~/.local/share/opencode/storage/session/`. Both TUI and serve read/write to the same storage, but don't communicate in real-time unless using attach.

### Connecting for Primary Mode

To execute commands via the "primary" mode (sending prompts to a connected TUI session):

1. **Start the OpenCode server:**
   ```bash
   opencode serve --port 4096
   ```

2. **Attach the TUI to the server:**
   ```bash
   opencode attach http://localhost:4096
   ```

3. **Now API commands appear in the TUI** — both use the same server

**Key insight:** Without `attach`, API calls go to session storage but the TUI doesn't poll for external changes. Use `attach` to connect the TUI to the HTTP server for real-time communication.

### Configuring Default Model

Background jobs use OpenCode's default model setting. To configure GLM4.7 as the default model for background GSD commands:

1. **Create or edit `~/.opencode/opencode.json`:**
   ```json
   {
     "defaultModel": "glm-4.7"
   }
   ```

2. **Restart OpenCode** if it's currently running

This is a server-side OpenCode configuration — the TUI uses whatever model OpenCode defaults to.

### SDK Gotchas

- **Timestamps are milliseconds** — `s.time.created` and `s.time.updated` are already in ms, don't multiply by 1000
- **SDK requires serve running** — All SDK calls fail with ConnectionRefused if `opencode serve` isn't running
- **Session list from SDK** — Returns active sessions only (not all historical like local storage)

### Execution Modes

| Mode | What it does |
|------|--------------|
| Headless | Adds to background job queue, runs via SDK |
| Interactive | Spawns `opencode attach` with initial prompt |
| Primary | Sends prompt to connected session via SDK (requires `opencode serve` + `attach`) |

## Installation

### Prerequisites

- **Bun** (required) — [install bun](https://bun.sh/)
- **opencode** (optional) — [install opencode](https://opencode.ai/) for coding agent integration

### From npm

```bash
bun install -g gsd-console
```

### From Source

```bash
git clone https://github.com/dnakov/gsd-console.git
cd gsd-console
bun install
bun install -g .
```

### For Development

Use `bun link` to run `gsd-console` from anywhere while using the local source code:

```bash
bun link
```

To unlink: `bun unlink`

## Usage

```bash
# Run the TUI (local)
bun run dev

# Run globally
gsd-console

# Or directly with bun
bun start

# Show help
bun start --help
```

### CLI Options

| Flag | Short | Description |
|------|-------|-------------|
| `--only <view>` | `-o` | Show only one view (roadmap, phase, todos) |
| `--phase <num>` | `-p` | Phase number for `--only phase` mode |
| `--dir <path>` | `-d` | Path to .planning directory |
| `--help` | `-h` | Show help |

### Examples

```bash
# Full TUI with tabs
gsd-console
# or
bun start

# Roadmap view only (great for tmux panes)
gsd-console --only roadmap

# Phase 2 detail view
gsd-console --only phase -p 2

# Todos view only
gsd-console --only todos
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Switch between tabs |
| `1/2/3` | Jump to Roadmap/Phase/Todos tab |
| `j/k` | Navigate up/down (Vim-style) |
| `q` | Quit |
| `?` | Show help |

## Development

```bash
# Run with hot reload
bun run dev

# Type checking
bun run typecheck

# Linting
bun run lint

# Auto-fix lint issues
bun run lint:fix

# Run tests
bun test

# Run tests with coverage
bun run test:coverage
```

## Project Structure

```
src/
  cli.tsx              # Entry point with CLI parsing
  app.tsx              # Main app component
  components/
    layout/
      Header.tsx       # Project name and progress
      TabLayout.tsx    # Tab navigation
      Footer.tsx       # Keybinding hints
  hooks/
    useGsdData.ts      # Load and parse planning docs
  lib/
    types.ts           # TypeScript interfaces
    parser.ts          # Markdown/YAML parsing
    icons.ts           # Status icons and colors
```

## Tech Stack

- **Runtime:** Bun
- **UI Framework:** Ink (React for terminals)
- **Language:** TypeScript (strict mode)
- **Linting:** Biome
- **Git Hooks:** Lefthook
- **Testing:** Bun test runner
