/**
 * OpenCode SDK Client Wrapper
 * Factory functions for creating SDK clients and detecting server availability.
 *
 * Session detection uses local storage directly since SDK requires `opencode serve`.
 */

import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
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

/** Cached default model from OpenCode config */
let cachedDefaultModel: string | null = null;

/** Debug logging to file (enabled via GSD_DEBUG env var) */
const debugEnabled = process.env.GSD_DEBUG === '1';
const debugFile = process.env.GSD_DEBUG_FILE ?? '/tmp/gsd-tui-debug.log';

/** Debug logging function - exported for use in other modules */
export function debugLog(message: string, data?: unknown): void {
	if (!debugEnabled) return;

	const timestamp = new Date().toISOString();
	let dataStr = '';
	if (data !== undefined) {
		if (typeof data === 'string') {
			dataStr = ` ${data}`;
		} else if (data && typeof data === 'object') {
			const keys = Object.keys(data).slice(0, 3);
			dataStr = ` {${keys.join(', ')}${Object.keys(data).length > 3 ? ', ...' : ''}}`;
		} else {
			dataStr = ` ${String(data)}`;
		}
	}
	const logLine = `[${timestamp}] ${message}${dataStr}\n`;

	try {
		appendFileSync(debugFile, logLine);
	} catch {
		// Ignore file write errors
	}
}

/**
 * Enable debug logging by setting GSD_DEBUG=1 environment variable.
 * Logs will be written to /tmp/gsd-tui-debug.log (or GSD_DEBUG_FILE).
 *
 * Usage:
 *   GSD_DEBUG=1 bun run dev
 *   GSD_DEBUG=1 GSD_DEBUG_FILE=./debug.log bun start
 */

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
 * Uses `opencode run` CLI flags to send prompt directly, no fake stdin needed.
 * Exits TUI alternate screen, runs OpenCode, then returns.
 *
 * @param initialPrompt - Optional prompt to send
 * @returns true if OpenCode exited successfully (status 0)
 */
export async function spawnOpencodeSession(initialPrompt?: string): Promise<boolean> {
	const serverUrl = `http://127.0.0.1:${DEFAULT_PORT}`;

	// Exit alternate screen (same pattern as useExternalEditor)
	process.stdout.write('\x1b[?1049l');
	process.stdout.write('\x1b[2J\x1b[H');

	try {
		// Use opencode run with attach flag - sends prompt directly via CLI
		const args = ['run'];
		if (initialPrompt) {
			args.push(initialPrompt);
		}
		args.push('--attach', serverUrl);

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
 * Get default model from OpenCode config.
 * Model format is "provider/model" (e.g., "anthropic/claude-2").
 */
async function getDefaultModel(): Promise<string | null> {
	if (cachedDefaultModel !== null) {
		return cachedDefaultModel;
	}

	try {
		const client = createClient();
		const response = await client.config.get();
		debugLog('OpenCode config response', response);
		if (!response.error && response.data?.model) {
			cachedDefaultModel = response.data.model ?? null;
			debugLog('Default model from config', cachedDefaultModel);
			return cachedDefaultModel;
		}
	} catch {
		// Server not running or config not available
	}
	return null;
}

/**
 * Parse model string into provider and model ID.
 * @param modelString - Model in format "provider/model" (e.g., "anthropic/claude-2")
 * @returns Object with providerID and modelID, or null if invalid format
 */
function parseModel(modelString: string): { providerID: string; modelID: string } | null {
	const parts = modelString.split('/');
	if (parts.length === 2 && parts[0] && parts[1]) {
		const [providerID, modelID] = parts;
		return { providerID, modelID };
	}
	return null;
}

/**
 * Send a prompt to an OpenCode session.
 * Returns true if prompt was sent successfully.
 */
export async function sendPrompt(sessionId: string, text: string): Promise<boolean> {
	try {
		const client = createClient();
		const defaultModel = await getDefaultModel();

		const body: {
			parts: Array<{ type: 'text'; text: string }>;
			model?: { providerID: string; modelID: string };
		} = {
			parts: [{ type: 'text', text }],
		};

		// If we have a default model, include it in prompt
		if (defaultModel) {
			const parsed = parseModel(defaultModel);
			if (parsed) {
				body.model = parsed;
				debugLog('Including model in prompt', body.model);
			} else {
				debugLog('Failed to parse model string', defaultModel);
			}
		} else {
			debugLog('No default model found in config');
		}

		debugLog('Sending prompt body', body);

		await client.session.prompt({
			path: { id: sessionId },
			body,
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
