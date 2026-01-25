# GSD Status TUI

Terminal UI for viewing GSD project status. Displays roadmap progress, phase details, and todos in a keyboard-navigable interface.

## Installation

### Local Development

```bash
bun install
```

### Global Installation

To run `gsd-tui` from any directory:

**Option 1: Install globally (recommended for production use)**

```bash
bun install -g .
```

Then run from anywhere:
```bash
gsd-tui
```

**Option 2: Use `bun link` (for development)**

```bash
bun link
```

This creates a symlink so you can run `gsd-tui` from anywhere while still using the local source code.

**To uninstall:**

```bash
bun uninstall -g gsd-tui
# or
bun unlink
```

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
