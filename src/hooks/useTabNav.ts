/**
 * useTabNav Hook
 * Handles tab navigation with Tab key and number keys (1/2/3).
 */

import { useInput } from 'ink';
import { useCallback, useState } from 'react';

export interface TabNavConfig<T extends string> {
	tabs: T[];
	initialTab?: T;
	isActive: boolean;
	onTabChange?: (tab: T) => void;
}

export interface TabNavState<T extends string> {
	activeTab: T;
	setActiveTab: (tab: T) => void;
	tabIndex: number;
}

export function useTabNav<T extends string>(config: TabNavConfig<T>): TabNavState<T> {
	const { tabs, initialTab, isActive, onTabChange } = config;

	// Ensure we have a valid initial tab
	const defaultTab = initialTab ?? tabs[0];
	if (!defaultTab) {
		throw new Error('useTabNav: tabs array must not be empty');
	}

	const [activeTab, setActiveTabState] = useState<T>(defaultTab);

	// Set tab with callback notification
	const setActiveTab = useCallback(
		(tab: T) => {
			setActiveTabState(tab);
			onTabChange?.(tab);
		},
		[onTabChange],
	);

	// Get current tab index
	const tabIndex = tabs.indexOf(activeTab);

	// Cycle to next tab
	const nextTab = useCallback(() => {
		const currentIndex = tabs.indexOf(activeTab);
		const nextIndex = (currentIndex + 1) % tabs.length;
		const nextTabValue = tabs[nextIndex];
		if (nextTabValue !== undefined) {
			setActiveTab(nextTabValue);
		}
	}, [activeTab, tabs, setActiveTab]);

	// Cycle to previous tab
	const prevTab = useCallback(() => {
		const currentIndex = tabs.indexOf(activeTab);
		const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
		const prevTabValue = tabs[prevIndex];
		if (prevTabValue !== undefined) {
			setActiveTab(prevTabValue);
		}
	}, [activeTab, tabs, setActiveTab]);

	// Jump to tab by index (1-based)
	const jumpToTab = useCallback(
		(index: number) => {
			const zeroBasedIndex = index - 1;
			if (zeroBasedIndex >= 0 && zeroBasedIndex < tabs.length) {
				const targetTab = tabs[zeroBasedIndex];
				if (targetTab !== undefined) {
					setActiveTab(targetTab);
				}
			}
		},
		[tabs, setActiveTab],
	);

	// Input handler
	useInput(
		(input, key) => {
			// Tab - next tab
			if (key.tab && !key.shift) {
				nextTab();
				return;
			}

			// Shift+Tab - previous tab
			if (key.tab && key.shift) {
				prevTab();
				return;
			}

			// Number keys 1-9 for direct tab access
			const num = Number.parseInt(input, 10);
			if (!Number.isNaN(num) && num >= 1 && num <= 9) {
				jumpToTab(num);
				return;
			}
		},
		{ isActive },
	);

	return {
		activeTab,
		setActiveTab,
		tabIndex,
	};
}
