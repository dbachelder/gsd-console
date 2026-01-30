#!/usr/bin/env bun
/**
 * GSD CLI Commands Handler
 * Handles standalone GSD commands outside of the TUI.
 */

import { command as addTodoCommand } from '../lib/commands/gsd-add-todo.ts';

const command = process.argv[2];
// const args = process.argv.slice(3); // Unused for now

async function main(): Promise<void> {
	switch (command) {
		case '/gsd-add-todo': {
			await addTodoCommand();
			break;
		}

		default:
			if (command?.startsWith('/gsd-')) {
				console.error(`❌ Unknown GSD command: ${command}`);
				console.error('Available commands:');
				console.error('  /gsd-add-todo [title] [--files="path:lines"] [--area="area"]');
				process.exit(1);
			} else {
				console.error('❌ This script handles GSD commands starting with /gsd-');
				console.error('Usage: bun run cli/commands.ts /gsd-add-todo "Todo title"');
				process.exit(1);
			}
	}
}

main().catch((error) => {
	console.error('❌ Command failed:', error.message);
	process.exit(1);
});
