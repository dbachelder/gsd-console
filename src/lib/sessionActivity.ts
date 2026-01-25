/**
 * Session Activity Tracker
 * Monitors OpenCode sessions to detect active work and current commands.
 */

import { createOpencodeClient } from '@opencode-ai/sdk';

/** Activity state for a session */
export interface SessionActivity {
	sessionId: string;
	title: string;
	directory: string;
	isActive: boolean;
	currentActivity?: string;
	lastUpdated: number;
}

/** Event listener callback type */
export type ActivityCallback = (activity: SessionActivity) => void;

/**
 * Get the most recently active session.
 * Uses time.updated from session.list() to find current work.
 *
 * @returns SessionActivity or null if no sessions exist
 */
export async function getActiveSession(): Promise<SessionActivity | null> {
	try {
		const client = createOpencodeClient({ baseUrl: 'http://127.0.0.1:4096' });
		const result = await client.session.list();

		if (result.error || !result.data || result.data.length === 0) {
			return null;
		}

		// Sort by most recently updated
		const sessions = result.data.sort((a, b) => b.time.updated - a.time.updated);
		const session = sessions[0];

		if (!session) return null;

		// Check if still active (updated within last minute)
		const now = Date.now();
		const ageMs = now - session.time.updated;
		const isActive = ageMs < 60000; // 60 seconds threshold

		// Extract current activity from title
		const currentActivity = extractActivityFromTitle(session.title);

		return {
			sessionId: session.id,
			title: session.title,
			directory: session.directory || '',
			isActive,
			currentActivity,
			lastUpdated: session.time.updated,
		};
	} catch {
		return null;
	}
}

/**
 * Listen to session events and track activity.
 * Calls callback with current session activity on relevant events.
 *
 * @param callback - Called when session activity changes
 * @returns Cleanup function to stop listening
 */
export function monitorSessionActivity(callback: ActivityCallback): () => void {
	let mounted = true;
	let activeSessionId: string | undefined;
	let currentActivity: SessionActivity | null = null;

	const init = async () => {
		if (!mounted) return;

		const activity = await getActiveSession();
		if (activity) {
			activeSessionId = activity.sessionId;
			currentActivity = activity;
			callback(activity);
		}
	};

	// Start by getting current state
	init();

	const listen = async () => {
		try {
			const client = createOpencodeClient({ baseUrl: 'http://127.0.0.1:4096' });
			const result = await client.event.subscribe({ signal: new AbortController().signal });

			for await (const event of result.stream) {
				if (!mounted) break;

				// Track active session from task events
				if (event.type === 'message.part.updated' && event.properties?.part?.sessionID) {
					const sessionID = event.properties.part.sessionID;
					const part = event.properties.part;

					// If this is our active session or first activity, update
					if (!activeSessionId || sessionID === activeSessionId) {
						activeSessionId = sessionID;

						// Get updated session info
						const activity = await getActiveSession();
						if (activity && activity.sessionId === sessionID) {
							currentActivity = activity;

							// Update activity description from events
							if (part.type === 'tool') {
								// biome-ignore lint/suspicious/noExplicitAny: SDK types don't include this field
								const tool = (part as any).tool;
								// biome-ignore lint/suspicious/noExplicitAny: SDK types don't include this field
								const state = (part as any).state;
								// biome-ignore lint/suspicious/noExplicitAny: SDK types don't include this field
								if (tool === 'task' && (part as any).subagent_type) {
									// biome-ignore lint/suspicious/noExplicitAny: SDK types don't include this field
									currentActivity.currentActivity = `${(part as any).subagent_type}: ${state?.status}`;
								} else {
									currentActivity.currentActivity = `${tool}: ${state?.status}`;
								}
							} else if (part.type === 'reasoning') {
								// biome-ignore lint/suspicious/noExplicitAny: SDK types don't include this field
								if ((part as any).text) {
									// biome-ignore lint/suspicious/noExplicitAny: SDK types don't include this field
									currentActivity.currentActivity = (part as any).text.slice(0, 50);
								}
							}

							callback(currentActivity);
						}
					}
				}
			}
		} catch (err) {
			// biome-ignore lint/suspicious/noExplicitAny: Error type from event stream
			if (mounted && (err as any).name !== 'AbortError') {
				console.error('Session monitor error:', err);
			}
		}
	};

	listen();

	return () => {
		mounted = false;
	};
}

/**
 * Extract activity description from session title.
 * Parses common patterns like "Plan Phase 05 test coverage" or "@gsd-planner subagent".
 */
function extractActivityFromTitle(title: string): string {
	// Pattern: "Phase XX: Description" or "Action Description"
	const phaseMatch = /Phase\s+(\d+[:.]?\d*)/i.exec(title);
	if (phaseMatch) {
		return `Working on Phase ${phaseMatch[1]}`;
	}

	// Pattern: "@subagent-name"
	const subagentMatch = /@(\w+)\s+subagent/i.exec(title);
	if (subagentMatch) {
		return `${subagentMatch[1]} running`;
	}

	// Pattern: "Verb something"
	const verbMatch = /^(Plan|Research|Verify|Execute|Test|Fix|Add|Remove|Update)\s+/i.exec(title);
	if (verbMatch?.[1]) {
		return `${verbMatch[1].toLowerCase()}ing`;
	}

	// Fallback: first 40 chars
	return title.slice(0, 40);
}
