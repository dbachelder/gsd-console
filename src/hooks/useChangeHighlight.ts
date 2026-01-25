/**
 * useChangeHighlight Hook
 * Track which items are currently highlighted (recently changed) with auto-clear.
 *
 * Items are highlighted for holdDurationMs (default 5000ms) then fade for
 * fadeDurationMs (default 500ms) before being removed from tracking.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseChangeHighlightOptions {
	holdDurationMs?: number; // Time before fade starts (default 5000ms)
	fadeDurationMs?: number; // Fade animation duration (default 500ms)
}

export interface UseChangeHighlightResult {
	markChanged: (itemIds: string[]) => void;
	isHighlighted: (itemId: string) => boolean;
	isFading: (itemId: string) => boolean;
	changedItems: Map<string, number>;
}

/**
 * Hook to track recently changed items with timed highlight and fade.
 *
 * @param options.holdDurationMs - Time to hold highlight before fading (default 5000ms)
 * @param options.fadeDurationMs - Duration of fade animation (default 500ms)
 *
 * @returns Object with markChanged, isHighlighted, isFading functions and changedItems Map
 */
export function useChangeHighlight(
	options: UseChangeHighlightOptions = {},
): UseChangeHighlightResult {
	const { holdDurationMs = 5000, fadeDurationMs = 500 } = options;

	// Map of itemId -> timestamp when marked as changed
	const [changedItems, setChangedItems] = useState<Map<string, number>>(() => new Map());

	// Timers for auto-clearing items (doesn't need to trigger re-render)
	const timersRef = useRef<Map<string, Timer>>(new Map());

	/**
	 * Mark items as changed, starting highlight timers.
	 * If an item is already highlighted, its timer is reset.
	 */
	const markChanged = useCallback(
		(itemIds: string[]) => {
			const now = Date.now();
			const totalDuration = holdDurationMs + fadeDurationMs;

			setChangedItems((prev) => {
				const next = new Map(prev);

				for (const itemId of itemIds) {
					// Clear existing timer for this item
					const existingTimer = timersRef.current.get(itemId);
					if (existingTimer) {
						clearTimeout(existingTimer);
					}

					// Add/update item with current timestamp
					next.set(itemId, now);

					// Set timer to remove item after hold + fade duration
					const timer = setTimeout(() => {
						setChangedItems((current) => {
							const updated = new Map(current);
							updated.delete(itemId);
							return updated;
						});
						timersRef.current.delete(itemId);
					}, totalDuration);

					timersRef.current.set(itemId, timer);
				}

				return next;
			});
		},
		[holdDurationMs, fadeDurationMs],
	);

	/**
	 * Check if an item is currently highlighted (either solid or fading).
	 */
	const isHighlighted = useCallback(
		(itemId: string): boolean => {
			return changedItems.has(itemId);
		},
		[changedItems],
	);

	/**
	 * Check if an item has passed holdDurationMs and is now fading.
	 */
	const isFading = useCallback(
		(itemId: string): boolean => {
			const timestamp = changedItems.get(itemId);
			if (!timestamp) return false;

			const elapsed = Date.now() - timestamp;
			return elapsed >= holdDurationMs;
		},
		[changedItems, holdDurationMs],
	);

	// Cleanup all timers on unmount
	useEffect(() => {
		return () => {
			for (const timer of timersRef.current.values()) {
				clearTimeout(timer);
			}
			timersRef.current.clear();
		};
	}, []);

	return {
		markChanged,
		isHighlighted,
		isFading,
		changedItems,
	};
}

export default useChangeHighlight;
