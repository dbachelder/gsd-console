#!/usr/bin/env bun
/**
 * GSD TUI CLI Entry Point
 * Parses command-line arguments and renders the main app.
 */

import { render } from 'ink';
import App from './app.tsx';
import type { CliFlags } from './lib/types.ts';

// Parse command line arguments
function parseArgs(): CliFlags {
	const args = process.argv.slice(2);
	const flags: CliFlags = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === '--only' || arg === '-o') {
			const value = args[++i] as 'roadmap' | 'phase' | 'todos' | undefined;
			if (value === 'roadmap' || value === 'phase' || value === 'todos') {
				flags.only = value;
			}
		} else if (arg === '--phase' || arg === '-p') {
			const value = args[++i];
			if (value) {
				flags.phase = parseInt(value, 10);
			}
		} else if (arg === '--dir' || arg === '-d') {
			flags.dir = args[++i];
		} else if (arg === '--help' || arg === '-h') {
			showHelp();
			process.exit(0);
		}
	}

	return flags;
}

function showHelp(): void {
	console.log(`
GSD Status TUI - View project status in the terminal

Usage:
  gsd-tui [options]

Options:
  --only, -o <view>    Show only one view (roadmap|phase|todos)
  --phase, -p <num>    Phase number for --only phase mode (default: 1)
  --dir, -d <path>     Path to .planning directory (default: .planning)
  --help, -h           Show this help

Examples:
  gsd-tui                    # Full TUI with tabs
  gsd-tui --only roadmap     # Roadmap view only
  gsd-tui --only phase -p 2  # Phase 2 detail view only
  gsd-tui --only todos       # Todos view only
`);
}

const flags = parseArgs();
render(<App flags={flags} />);
