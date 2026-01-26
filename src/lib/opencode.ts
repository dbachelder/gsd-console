/**
 * OpenCode SDK Client Wrapper
 * Factory functions for creating SDK clients and detecting server availability.
 *
 * Session detection uses local storage directly since SDK requires `opencode serve`.
 */

import { spawnSync } from 'node:child_process';
import { createOpencodeClient } from '@opencode-ai/sdk';
import type { ExecutionTarget } from './types.ts';

/** Default port for OpenCode server */
export const DEFAULT_PORT = 4096;

/** Session info for display in picker */
export interface SessionInfo {
	id: string;
	directory?: string; // Project directory
	lastCommand?: string; // Last prompt/command run
	createdAt?: string;
	updatedAt?: number; // Timestamp for sorting/filtering
}

/**
 * Format a GSD command for the specified execution target.
 *
 * @param command - The command name and args (e.g., "add-todo foo bar")
 * @param target - Execution target (opencode or claude-code)
 * @returns Formatted command with appropriate prefix
 *
 * @example
 * formatGsdCommand("add-todo foo bar", "opencode") // "/gsd-add-todo foo bar"
 * formatGsdCommand("add-todo foo bar", "claude-code") // "/gsd:add-todo foo bar"
 */
export function formatGsdCommand(command: string, target: ExecutionTarget): string {
	const prefix = target === 'opencode' ? '/gsd-' : '/gsd:';
	return `${prefix}${command}`;
}

/** Default base URL for OpenCode server */
const DEFAULT_BASE_URL = `http://127.0.0.1:${DEFAULT_PORT}`;

/**
 * Create an OpenCode SDK client.
 *
 * @param baseUrl - Base URL for the OpenCode server (default: http://127.0.0.1:4096)
 * @returns Configured SDK client instance
 */
export function createClient(baseUrl = DEFAULT_BASE_URL) {
	return createOpencodeClient({
		baseUrl,
	});
}

/**
 * Detect if an OpenCode server is running.
 * Attempts to list sessions to verify server availability.
 *
 * @param port - Port to check (default: 4096)
 * @returns true if server is responding, false otherwise
 */
export async function detectServer(port = DEFAULT_PORT): Promise<boolean> {
	try {
		const client = createClient(`http://127.0.0.1:${port}`);
		// Try to list sessions - if this succeeds, server is running
		const result = await client.session.list();
		return !result.error;
	} catch {
		return false;
	}
}

/**
 * List all OpenCode sessions via SDK.
 * Requires `opencode serve --port 4096` to be running.
 * Returns empty array if server not available.
 */
export async function listSessions(): Promise<SessionInfo[]> {
	try {
		const client = createClient();
		const response = await client.session.list();
		if (!response.error && response.data) {
			return response.data.map((s) => ({
				id: s.id,
				directory: s.directory,
				lastCommand: s.title,
				createdAt: new Date(s.time.created).toISOString(),
				updatedAt: s.time.updated,
			}));
		}
	} catch {
		// Server not running
	}
	return [];
}

/**
 * Get sessions for this project directory.
 * Filters to sessions in the same directory tree, sorted by most recent.
 */
export async function getProjectSessions(projectDir: string): Promise<SessionInfo[]> {
	const sessions = await listSessions();

	// Normalize paths: remove trailing slashes for consistent comparison
	const normalizedProjectDir = projectDir.replace(/\/+$/, '');

	// Filter by directory match
	const filtered = sessions.filter((s) => {
		if (!s.directory) return false;
		const normalizedSessionDir = s.directory.replace(/\/+$/, '');

		// Session is in project tree OR project is in session tree
		return (
			normalizedSessionDir.startsWith(normalizedProjectDir) ||
			normalizedProjectDir.startsWith(normalizedSessionDir)
		);
	});

	// Sort by most recently updated
	return filtered.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

/**
 * Spawn an OpenCode session attached to the serve.
 * Uses `opencode attach` so the session can receive API calls.
 * Exits TUI alternate screen, runs OpenCode, then returns.
 *
 * @param initialPrompt - Optional prompt to send after attaching
 * @returns true if OpenCode exited successfully (status 0)
 */
export async function spawnOpencodeSession(initialPrompt?: string): Promise<boolean> {
	const serverUrl = `http://127.0.0.1:${DEFAULT_PORT}`;
	let sessionId: string | undefined;

	// If we have an initial prompt, create a session and send it first
	if (initialPrompt) {
		const newSessionId = await createSession(initialPrompt);
		if (newSessionId) {
			sessionId = newSessionId;
			// Send the prompt to the new session
			await sendPrompt(newSessionId, initialPrompt);
		}
	}

	// Exit alternate screen (same pattern as useExternalEditor)
	process.stdout.write('\x1b[?1049l');
	process.stdout.write('\x1b[2J\x1b[H');

	try {
		// Use opencode attach to connect to serve (enables API injection)
		const args = ['attach', serverUrl];
		if (sessionId) {
			args.push('-s', sessionId);
		}

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

/**
 * Send a prompt to an OpenCode session.
 * Returns true if prompt was sent successfully.
 */
export async function sendPrompt(sessionId: string, text: string): Promise<boolean> {
	try {
		const client = createClient();
		await client.session.prompt({
			path: { id: sessionId },
			body: {
				parts: [{ type: 'text', text }],
			},
		});
		return true;
	} catch {
		return false;
	}
}

/**
 * Create a new OpenCode session for background jobs.
 * Returns session ID or null on failure.
 */
export async function createSession(title?: string): Promise<string | null> {
	try {
		const client = createClient();
		const response = await client.session.create({
			body: { title: title ?? 'GSD Background' },
		});
		return response.data?.id ?? null;
	} catch {
		return null;
	}
}
