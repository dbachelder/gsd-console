/**
 * useFileWatcher Hook
 * Watch a directory for file changes with debounced batch emission.
 *
 * Uses Node's fs.watch with recursive option (Bun compatible).
 * Accumulates changes during rapid saves and emits batched results
 * after a quiet period (default 300ms).
 */

import { type FSWatcher, watch } from 'node:fs';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseFileWatcherOptions {
	path: string;
	debounceMs?: number;
	onError?: (error: Error) => void;
}

export interface UseFileWatcherResult {
	changedFiles: string[];
	isRefreshing: boolean;
	lastRefresh: number | null;
}

/**
 * Hook to watch a directory for file changes with debouncing.
 *
 * @param options.path - Directory path to watch recursively
 * @param options.debounceMs - Wait-until-quiet debounce delay (default 300ms)
 * @param options.onError - Error callback for watcher errors
 *
 * @returns Object with changedFiles array, isRefreshing state, and lastRefresh timestamp
 */
export function useFileWatcher(options: UseFileWatcherOptions): UseFileWatcherResult {
	const { path, debounceMs = 300, onError } = options;

	const [changedFiles, setChangedFiles] = useState<string[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [lastRefresh, setLastRefresh] = useState<number | null>(null);

	// Refs for tracking pending changes and timer
	const pendingFiles = useRef<Set<string>>(new Set());
	const timerRef = useRef<Timer | null>(null);
	const watcherRef = useRef<FSWatcher | null>(null);

	// Cleanup function
	const cleanup = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		if (watcherRef.current) {
			watcherRef.current.close();
			watcherRef.current = null;
		}
	}, []);

	useEffect(() => {
		// Clean up any previous watcher
		cleanup();

		try {
			// Create recursive watcher
			const watcher = watch(path, { recursive: true }, (_eventType, filename) => {
				if (!filename) return;

				// Add to pending set
				pendingFiles.current.add(filename);

				// Set refreshing state
				setIsRefreshing(true);

				// Clear existing timer (wait-until-quiet pattern)
				if (timerRef.current) {
					clearTimeout(timerRef.current);
				}

				// Set new timer for debounce
				timerRef.current = setTimeout(() => {
					// Emit batched changes
					const files = Array.from(pendingFiles.current);
					pendingFiles.current.clear();

					setChangedFiles(files);
					setLastRefresh(Date.now());
					setIsRefreshing(false);
					timerRef.current = null;
				}, debounceMs);
			});

			// Handle watcher errors
			watcher.on('error', (error) => {
				if (onError) {
					onError(error instanceof Error ? error : new Error(String(error)));
				}
			});

			watcherRef.current = watcher;
		} catch (error) {
			if (onError) {
				onError(error instanceof Error ? error : new Error(String(error)));
			}
		}

		// Return cleanup function
		return cleanup;
	}, [path, debounceMs, onError, cleanup]);

	return {
		changedFiles,
		isRefreshing,
		lastRefresh,
	};
}

export default useFileWatcher;
