/**
 * Session Events Hook
 * Subscribes to OpenCode SSE events for a specific session.
 */

import type { Event as OpencodeEvent } from '@opencode-ai/sdk';
import { useCallback, useEffect, useRef } from 'react';
import { createClient } from '../lib/opencode.ts';

interface UseSessionEventsProps {
	sessionIds?: string[]; // Array of session IDs to listen for
	onIdle?: (sessionId: string) => void; // Callback includes which session went idle
	onOutput?: (text: string) => void; // Capture output for expandable display
	onError?: (error: string, sessionId: string) => void; // Callback includes which session errored
	enabled?: boolean;
}

/**
 * Subscribe to OpenCode SSE events for one or more sessions.
 * Calls onIdle when any session becomes idle (ready for next command).
 * Calls onOutput when text output events received from any session.
 * Calls onError when session error events received.
 */
export function useSessionEvents({
	sessionIds,
	onIdle,
	onOutput,
	onError,
	enabled = true,
}: UseSessionEventsProps): void {
	// Track mounted state to break out of async loop
	const mountedRef = useRef(true);
	// Store AbortController for cleanup
	const abortControllerRef = useRef<AbortController | null>(null);

	// Store callbacks in refs to avoid dependency issues
	const onIdleRef = useRef(onIdle);
	const onOutputRef = useRef(onOutput);
	const onErrorRef = useRef(onError);
	onIdleRef.current = onIdle;
	onOutputRef.current = onOutput;
	onErrorRef.current = onError;

	// Create a Set for efficient session ID lookup
	const sessionIdsSet = useRef(new Set(sessionIds ?? []));
	sessionIdsSet.current = new Set(sessionIds ?? []);

	const subscribe = useCallback(async () => {
		if (!sessionIds || sessionIds.length === 0 || !enabled) return;

		// Abort any existing subscription
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// Create new abort controller
		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		try {
			const client = createClient();
			const result = await client.event.subscribe({
				signal: abortController.signal,
			});

			// Iterate over the stream
			for await (const event of result.stream) {
				// Check if we should stop
				if (!mountedRef.current || abortController.signal.aborted) {
					break;
				}

				// Type guard for event types - events have 'type' and 'properties' fields
				const typedEvent = event as OpencodeEvent;

				// For session.idle and session.error, filter by session IDs we care about
				if (typedEvent.type === 'session.idle') {
					const eventSessionId = typedEvent.properties.sessionID;
					if (eventSessionId && sessionIdsSet.current.has(eventSessionId)) {
						onIdleRef.current?.(eventSessionId);
					}
				} else if (typedEvent.type === 'session.error') {
					const eventSessionId = typedEvent.properties.sessionID;
					if (!eventSessionId || !sessionIdsSet.current.has(eventSessionId)) {
						return; // Not one of our sessions
					}

					const error = typedEvent.properties.error;

					// Build informative error message even if error.message is missing
					let errorMsg: string;
					if (error && typeof error === 'object') {
						// OpenCode error structure: { name: string, data: { message: string } }
						// Check for OpenCode's data.message first
						if (
							'data' in error &&
							typeof error.data === 'object' &&
							error.data !== null &&
							'message' in error.data
						) {
							errorMsg = String(error.data.message);
						}
						// Fall back to standard Error.message property
						else if ('message' in error) {
							errorMsg = String(error.message);
						}
						// No message found - include type and available properties
						else {
							const errorType = 'name' in error ? String(error.name) : typeof error;
							const errorKeys = Object.keys(error).slice(0, 3).join(', ');

							errorMsg = errorKeys
								? `Unknown error (${errorType}: ${errorKeys}...)`
								: `Unknown error (${errorType})`;
						}
					} else if (error) {
						errorMsg = String(error);
					} else {
						errorMsg = 'Unknown error (no error object provided)';
					}

					// DEBUG: Log full error object for investigation
					console.error('[DEBUG] session.error event:', {
						sessionId: eventSessionId,
						error,
						errorMsg,
						errorKeys: error && typeof error === 'object' ? Object.keys(error) : 'not an object',
						errorType: typeof error,
					});

					onErrorRef.current?.(errorMsg, eventSessionId);
				} else if (typedEvent.type === 'message.part.updated') {
					// Extract text output if it's a text part with delta
					const delta = typedEvent.properties.delta;
					if (delta) {
						onOutputRef.current?.(delta);
					}
				}
			}
		} catch (err) {
			// Ignore abort errors - they're expected on cleanup
			if (err instanceof Error && err.name === 'AbortError') {
				return;
			}
			// Report other errors
			if (mountedRef.current) {
				onErrorRef.current?.(err instanceof Error ? err.message : 'Subscription failed', '');
			}
		}
	}, [sessionIds, enabled]);

	useEffect(() => {
		mountedRef.current = true;
		subscribe();

		return () => {
			mountedRef.current = false;
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
				abortControllerRef.current = null;
			}
		};
	}, [subscribe]);
}

export default useSessionEvents;
