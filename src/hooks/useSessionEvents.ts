/**
 * Session Events Hook
 * Subscribes to OpenCode SSE events for a specific session.
 */

import type { Event as OpencodeEvent } from '@opencode-ai/sdk';
import { useCallback, useEffect, useRef } from 'react';
import { createClient } from '../lib/opencode.ts';

interface UseSessionEventsProps {
	sessionId?: string;
	onIdle?: () => void;
	onOutput?: (text: string) => void; // Capture output for expandable display
	onError?: (error: string) => void;
	enabled?: boolean;
}

/**
 * Subscribe to OpenCode SSE events for a specific session.
 * Calls onIdle when session becomes idle (ready for next command).
 * Calls onOutput when text output events received.
 * Calls onError when session error events received.
 */
export function useSessionEvents({
	sessionId,
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

	const subscribe = useCallback(async () => {
		if (!sessionId || !enabled) return;

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

				// Filter events by sessionId
				if (typedEvent.type === 'session.idle') {
					if (typedEvent.properties.sessionID === sessionId) {
						onIdleRef.current?.();
					}
				} else if (typedEvent.type === 'session.error') {
					if (typedEvent.properties.sessionID === sessionId) {
						const error = typedEvent.properties.error;
						const errorMsg =
							error && typeof error === 'object' && 'message' in error
								? String(error.message)
								: 'Unknown error';
						onErrorRef.current?.(errorMsg);
					}
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
				onErrorRef.current?.(err instanceof Error ? err.message : 'Subscription failed');
			}
		}
	}, [sessionId, enabled]);

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
