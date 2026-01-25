/**
 * useVimNav Hook
 * Provides Vim-style keyboard navigation for lists.
 * Handles j/k, gg/G, Ctrl+d/u, and Page Up/Down.
 */

import { useInput } from 'ink';
import { useCallback, useEffect, useState } from 'react';

export interface VimNavConfig {
	itemCount: number;
	pageSize: number;
	isActive: boolean;
	onSelect?: () => void;
	onBack?: () => void;
	/** Initial selected index (for state restoration) */
	initialIndex?: number;
	/** Callback when selected index changes (for controlled components) */
	onIndexChange?: (index: number) => void;
}

export interface VimNavState {
	selectedIndex: number;
	scrollOffset: number;
	setSelectedIndex: (index: number | ((prev: number) => number)) => void;
	setScrollOffset: (offset: number | ((prev: number) => number)) => void;
}

interface LastKey {
	key: string;
	time: number;
}

const DOUBLE_KEY_TIMEOUT = 300; // ms for double-key detection (gg)

export function useVimNav(config: VimNavConfig): VimNavState {
	const {
		itemCount,
		pageSize,
		isActive,
		onSelect,
		onBack,
		initialIndex = 0,
		onIndexChange,
	} = config;

	const [selectedIndex, setSelectedIndex] = useState(initialIndex);
	const [scrollOffset, setScrollOffset] = useState(0);
	const [lastKey, setLastKey] = useState<LastKey>({ key: '', time: 0 });

	// Clamp selected index when item count changes
	useEffect(() => {
		if (itemCount > 0 && selectedIndex >= itemCount) {
			setSelectedIndex(itemCount - 1);
		}
	}, [itemCount, selectedIndex]);

	// Notify parent of index changes
	useEffect(() => {
		onIndexChange?.(selectedIndex);
	}, [selectedIndex, onIndexChange]);

	// Auto-scroll to keep selection visible
	const adjustScroll = useCallback(
		(newIndex: number) => {
			// If selection is above visible area, scroll up
			if (newIndex < scrollOffset) {
				setScrollOffset(newIndex);
			}
			// If selection is below visible area, scroll down
			else if (newIndex >= scrollOffset + pageSize) {
				setScrollOffset(newIndex - pageSize + 1);
			}
		},
		[pageSize, scrollOffset],
	);

	// Move selection with clamping and auto-scroll
	const moveSelection = useCallback(
		(delta: number) => {
			setSelectedIndex((prev) => {
				const next = Math.max(0, Math.min(itemCount - 1, prev + delta));
				adjustScroll(next);
				return next;
			});
		},
		[itemCount, adjustScroll],
	);

	// Jump to specific index
	const jumpTo = useCallback(
		(index: number) => {
			const clamped = Math.max(0, Math.min(itemCount - 1, index));
			setSelectedIndex(clamped);
			adjustScroll(clamped);
		},
		[itemCount, adjustScroll],
	);

	// Page movement (half or full page)
	const pageMove = useCallback(
		(direction: 'up' | 'down') => {
			const delta = direction === 'down' ? pageSize : -pageSize;
			moveSelection(delta);
		},
		[pageSize, moveSelection],
	);

	// Input handler
	useInput(
		(input, key) => {
			const now = Date.now();

			// Check for double-g (gg)
			if (input === 'g' && !key.shift) {
				if (lastKey.key === 'g' && now - lastKey.time < DOUBLE_KEY_TIMEOUT) {
					// gg - jump to top
					jumpTo(0);
					setLastKey({ key: '', time: 0 }); // Reset to prevent triple-g issues
					return;
				}
				// First g - record and wait
				setLastKey({ key: 'g', time: now });
				return;
			}

			// Reset last key for non-g inputs
			setLastKey({ key: '', time: 0 });

			// G (shift+g) - jump to bottom
			if (input === 'G' || (input === 'g' && key.shift)) {
				jumpTo(itemCount - 1);
				return;
			}

			// j or down arrow - move down
			if (input === 'j' || key.downArrow) {
				moveSelection(1);
				return;
			}

			// k or up arrow - move up
			if (input === 'k' || key.upArrow) {
				moveSelection(-1);
				return;
			}

			// h or left arrow - go back/collapse (callback)
			if (input === 'h' || key.leftArrow) {
				onBack?.();
				return;
			}

			// l, right arrow, or Enter - select/expand (callback)
			if (input === 'l' || key.rightArrow || key.return) {
				onSelect?.();
				return;
			}

			// Ctrl+d - page down
			if (key.ctrl && input === 'd') {
				pageMove('down');
				return;
			}

			// Ctrl+u - page up
			if (key.ctrl && input === 'u') {
				pageMove('up');
				return;
			}

			// Page Down
			if (key.pageDown) {
				pageMove('down');
				return;
			}

			// Page Up
			if (key.pageUp) {
				pageMove('up');
				return;
			}
		},
		{ isActive },
	);

	return {
		selectedIndex,
		scrollOffset,
		setSelectedIndex,
		setScrollOffset,
	};
}
