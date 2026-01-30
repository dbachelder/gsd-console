/**
 * useToast Hook
 * Provides toast notification state management with auto-dismiss.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastType = 'info' | 'success' | 'warning';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

export interface UseToastResult {
	toasts: Toast[];
	show: (message: string, type?: ToastType) => void;
}

export function useToast(dismissMs = 3000): UseToastResult {
	const [toasts, setToasts] = useState<Toast[]>([]);
	const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

	// Cleanup all timeouts on unmount
	useEffect(() => {
		const refs = timeoutRefs.current;
		return () => {
			for (const timeout of refs.values()) {
				clearTimeout(timeout);
			}
			refs.clear();
		};
	}, []);

	const show = useCallback(
		(message: string, type: ToastType = 'info') => {
			const id = Date.now().toString();
			const toast: Toast = { id, message, type };

			setToasts((prev) => [...prev, toast]);

			// Schedule auto-dismiss
			const timeout = setTimeout(() => {
				setToasts((prev) => prev.filter((t) => t.id !== id));
				timeoutRefs.current.delete(id);
			}, dismissMs);

			timeoutRefs.current.set(id, timeout);
		},
		[dismissMs],
	);

	return { toasts, show };
}
