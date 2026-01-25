# GSD Status TUI

Terminal UI for viewing GSD project status. Displays roadmap progress, phase details, and todos in a keyboard-navigable interface.

## Compatibility

**Works with any GSD `.planning/` directory.** If you have a project using the [GSD workflow](https://github.com/glittercowboy/get-shit-done), this TUI will display its roadmap, phases, and todos with live updates as files change.

**For coding agent integration**, GSD TUI supports [opencode](https://github.com/sst/opencode). With opencode installed, you can:
- Spawn opencode sessions directly from the TUI
- Queue GSD commands for sequential execution
- Connect to existing opencode sessions

Without opencode, the TUI works as a standalone viewer — you can still execute GSD CLI commands and edit planning files in your `$EDITOR`.

## Installation

### Prerequisites

- **Bun** (required) — [install bun](https://bun.sh/)
- **opencode** (optional) — [install opencode](https://opencode.ai/) for coding agent integration

### From npm

```bash
bun install -g gsd-tui
```

### From Source

```bash
git clone https://github.com/dnakov/gsd-tui.git
cd gsd-tui
bun install
bun install -g .
```

### For Development

Use `bun link` to run `gsd-tui` from anywhere while using the local source code:

```bash
bun link
```

To unlink: `bun unlink`

## Usage

```bash
# Run the TUI (local)
bun run dev

# Run globally
gsd-tui

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
gsd-tui
# or
bun start

# Roadmap view only (great for tmux panes)
gsd-tui --only roadmap

# Phase 2 detail view
gsd-tui --only phase -p 2

# Todos view only
gsd-tui --only todos
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
