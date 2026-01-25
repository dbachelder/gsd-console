/**
 * React Hook: Use Session Activity
 * Tracks OpenCode session activity in React components.
 */

import { useEffect, useState } from 'react';
import {
	getActiveSession,
	monitorSessionActivity,
	type SessionActivity,
} from '../lib/sessionActivity.ts';

/**
 * Hook to track OpenCode session activity.
 * Updates in real-time as sessions create/complete tasks.
 *
 * @returns Current session activity or null if no active session
 *
 * @example
 * ```tsx
 * const activity = useSessionActivity();
 *
 * if (activity?.isActive) {
 *   return <Text>Running: {activity.currentActivity}</Text>;
 * }
 * ```
 */
export function useSessionActivity(): SessionActivity | null {
	const [activity, setActivity] = useState<SessionActivity | null>(null);

	useEffect(() => {
		// Get initial state
		getActiveSession().then(setActivity);

		// Monitor for changes
		const cleanup = monitorSessionActivity((newActivity) => {
			setActivity(newActivity);
		});

		return cleanup;
	}, []);

	return activity;
}
