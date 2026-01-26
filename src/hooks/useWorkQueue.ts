/**
 * useWorkQueue Hook
 * Manages user-managed GSD command queue for sequential execution.
 * Queue lives only in session memory (no persistence).
 */

import { useCallback, useReducer } from 'react';
import type { QueuedCommand } from '../lib/types.ts';

export type QueueAction =
	| { type: 'add'; command: string; args?: string }
	| { type: 'remove'; id: string }
	| { type: 'updateStatus'; id: string; status: QueuedCommand['status']; error?: string }
	| { type: 'start' }
	| { type: 'clear' };

/** Generate unique ID for queued command */
function generateId(): string {
	return `queue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function queueReducer(state: QueuedCommand[], action: QueueAction): QueuedCommand[] {
	switch (action.type) {
		case 'add': {
			return [
				...state,
				{
					id: generateId(),
					command: action.command,
					args: action.args,
					status: 'pending',
					queuedAt: Date.now(),
				},
			];
		}
		case 'remove': {
			return state.filter((cmd) => cmd.id !== action.id);
		}
		case 'updateStatus': {
			return state.map((cmd) =>
				cmd.id === action.id
					? {
							...cmd,
							status: action.status,
							error: action.error,
							...(action.status === 'running' && { startedAt: Date.now() }),
							...(action.status === 'complete' || action.status === 'failed'
								? { completedAt: Date.now() }
								: {}),
						}
					: cmd,
			);
		}
		case 'start': {
			// Mark first pending command as running
			return state.map((cmd) =>
				cmd.status === 'pending' && state.indexOf(cmd) === 0
					? { ...cmd, status: 'running', startedAt: Date.now() }
					: cmd,
			);
		}
		case 'clear': {
			return [];
		}
		default:
			return state;
	}
}

export function useWorkQueue() {
	const [queue, dispatch] = useReducer(queueReducer, []);

	const add = useCallback((command: string, args?: string) => {
		dispatch({ type: 'add', command, args });
	}, []);

	const remove = useCallback((id: string) => {
		dispatch({ type: 'remove', id });
	}, []);

	const updateStatus = useCallback(
		(id: string, status: QueuedCommand['status'], error?: string) => {
			dispatch({ type: 'updateStatus', id, status, error });
		},
		[],
	);

	const start = useCallback(() => {
		dispatch({ type: 'start' });
	}, []);

	const clear = useCallback(() => {
		dispatch({ type: 'clear' });
	}, []);

	return {
		queue,
		add,
		remove,
		updateStatus,
		start,
		clear,
	};
}

export default useWorkQueue;
