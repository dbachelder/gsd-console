/**
 * useFileWatcher Hook
 * Watch a directory for file changes with debounced batch emission.
 *
 * Uses Node's fs.watch with recursive option (Bun compatible).
 * Accumulates changes during rapid saves and emits batched results
 * after a quiet period (default 300ms).
 *
 * Special handling: If the target directory doesn't exist, watches the parent
 * directory to detect when the target is created.
 */

import { existsSync, type FSWatcher, watch } from 'node:fs';
import { dirname } from 'node:path';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseFileWatcherOptions {
	path: string;
	debounceMs?: number;
	onError?: (error: Error) => void;
	onDirCreated?: () => void;
}

export interface UseFileWatcherResult {
	changedFiles: string[];
	isRefreshing: boolean;
	lastRefresh: number | null;
	targetExists: boolean;
}

/**
 * Hook to watch a directory for file changes with debouncing.
 *
 * @param options.path - Directory path to watch recursively
 * @param options.debounceMs - Wait-until-quiet debounce delay (default 300ms)
 * @param options.onError - Error callback for watcher errors
 * @param options.onDirCreated - Callback when the target directory is created
 *
 * @returns Object with changedFiles array, isRefreshing state, lastRefresh timestamp, and targetExists flag
 */
export function useFileWatcher(options: UseFileWatcherOptions): UseFileWatcherResult {
	const { path, debounceMs = 300, onError, onDirCreated } = options;

	const [changedFiles, setChangedFiles] = useState<string[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [lastRefresh, setLastRefresh] = useState<number | null>(null);
	const [targetExists, setTargetExists] = useState(() => existsSync(path));

	// Refs for tracking pending changes and timer
	const pendingFiles = useRef<Set<string>>(new Set());
	const timerRef = useRef<Timer | null>(null);
	const watcherRef = useRef<FSWatcher | null>(null);
	const pathRef = useRef(path);
	const onDirCreatedRef = useRef(onDirCreated);

	// Keep refs up to date
	pathRef.current = path;
	onDirCreatedRef.current = onDirCreated;

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

	// Effect to watch for target directory creation when it doesn't exist
	useEffect(() => {
		// If target exists, no need for this effect
		if (targetExists) return;

		const checkInterval = setInterval(() => {
			if (existsSync(pathRef.current)) {
				setTargetExists(true);
				if (onDirCreatedRef.current) {
					onDirCreatedRef.current();
				}
				clearInterval(checkInterval);
			}
		}, 1000); // Check every second

		return () => clearInterval(checkInterval);
	}, [targetExists]);

	useEffect(() => {
		// Clean up any previous watcher
		cleanup();

		// Determine what to watch
		let watchPath: string;
		if (targetExists) {
			watchPath = path;
		} else {
			const parentPath = dirname(path);
			// Only watch parent if it exists, otherwise skip watcher
			if (!existsSync(parentPath)) {
				// Parent doesn't exist either, just rely on polling interval
				return;
			}
			watchPath = parentPath;
		}
		const targetBasename = path.split('/').pop() || path.split('\\').pop();

		try {
			// Create recursive watcher
			const watcher = watch(watchPath, { recursive: true }, (_eventType, filename) => {
				if (!filename) return;

				// If watching parent (target doesn't exist), check if target was created
				if (!targetExists && filename === targetBasename) {
					// Target directory was created
					setTargetExists(true);
					if (onDirCreatedRef.current) {
						onDirCreatedRef.current();
					}
					return;
				}

				// Only track changes if target exists
				if (!targetExists) return;

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
	}, [path, debounceMs, onError, cleanup, targetExists]);

	return {
		changedFiles,
		isRefreshing,
		lastRefresh,
		targetExists,
	};
}

export default useFileWatcher;
