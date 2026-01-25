/**
 * OpenCode SDK Client Wrapper
 * Factory functions for creating SDK clients and detecting server availability.
 *
 * Session detection uses local storage directly since SDK requires `opencode serve`.
 */

import { spawnSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createOpencodeClient } from '@opencode-ai/sdk';

/** Default port for OpenCode server */
export const DEFAULT_PORT = 4096;

/** Session info for display in picker */
export interface SessionInfo {
	id: string;
	directory?: string; // Project directory
	lastCommand?: string; // Last prompt/command run
	createdAt?: string;
}

/** Local session storage format */
interface LocalSession {
	id: string;
	directory: string;
	title: string;
	time: {
		created: number;
		updated: number;
	};
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
 * Read sessions from local storage.
 * OpenCode stores sessions in ~/.local/share/opencode/storage/session/
 */
async function readLocalSessions(): Promise<SessionInfo[]> {
	const storageDir = join(homedir(), '.local/share/opencode/storage/session');
	const sessions: SessionInfo[] = [];

	try {
		const projectDirs = await readdir(storageDir);

		for (const projectHash of projectDirs) {
			const projectPath = join(storageDir, projectHash);
			let files: string[];
			try {
				files = await readdir(projectPath);
			} catch {
				continue; // Skip if can't read directory
			}

			for (const file of files) {
				if (!file.endsWith('.json')) continue;

				try {
					const content = await readFile(join(projectPath, file), 'utf8');
					const session = JSON.parse(content) as LocalSession;
					sessions.push({
						id: session.id,
						directory: session.directory,
						lastCommand: session.title,
						createdAt: new Date(session.time.created).toISOString(),
					});
				} catch {
					// Skip invalid files
				}
			}
		}
	} catch {
		// Storage dir doesn't exist
	}

	// Sort by most recently updated (createdAt is actually from time.created)
	return sessions;
}

/**
 * List all OpenCode sessions.
 * Tries SDK first (if server running), falls back to local storage.
 */
export async function listSessions(): Promise<SessionInfo[]> {
	// First try SDK (for when `opencode serve` is running)
	try {
		const client = createClient();
		const response = await client.session.list();
		if (!response.error && response.data && response.data.length > 0) {
			return response.data.map((s) => ({
				id: s.id,
				directory: s.directory,
				lastCommand: s.title,
				createdAt: new Date(s.time.created * 1000).toISOString(),
			}));
		}
	} catch {
		// SDK failed, fall through to local storage
	}

	// Fall back to reading local storage directly
	return readLocalSessions();
}

/**
 * Get sessions for directories containing .planning/.
 * Filter to sessions in directory tree containing .planning/
 */
export async function getProjectSessions(projectDir: string): Promise<SessionInfo[]> {
	const sessions = await listSessions();

	// Normalize paths: remove trailing slashes for consistent comparison
	const normalizedProjectDir = projectDir.replace(/\/+$/, '');

	return sessions.filter((s) => {
		if (!s.directory) return false;
		const normalizedSessionDir = s.directory.replace(/\/+$/, '');

		// Session is in project tree OR project is in session tree
		return (
			normalizedSessionDir.startsWith(normalizedProjectDir) ||
			normalizedProjectDir.startsWith(normalizedSessionDir)
		);
	});
}

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
