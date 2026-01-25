/**
 * OpenCode Integration
 * Functions for spawning and interacting with OpenCode sessions.
 */

import { spawnSync } from 'node:child_process';

/**
 * Spawn an OpenCode session with terminal handoff.
 * Exits TUI alternate screen, runs OpenCode, then returns.
 *
 * @param initialPrompt - Optional prompt to start the session with
 * @returns true if OpenCode exited successfully (status 0)
 */
export function spawnOpencodeSession(initialPrompt?: string): boolean {
	// Exit alternate screen (same pattern as useExternalEditor)
	process.stdout.write('\x1b[?1049l');
	process.stdout.write('\x1b[2J\x1b[H');

	try {
		// Build args: opencode OR opencode run "prompt"
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
		// Restore screen even on error
		process.stdout.write('\x1b[?1049h');
		process.stdout.write('\x1b[2J\x1b[H');
		return false;
	}
}
