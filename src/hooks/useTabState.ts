/**
 * useTabState Hook
 * Manages per-tab state storage for session persistence.
 * State persists only for the current session (not across TUI restarts).
 */

import { useCallback, useRef } from 'react';

export type TabId = 'roadmap' | 'phase' | 'todos';

export interface TabState {
	selectedPhaseNumber?: number;
	detailLevel?: number; // 1-3 for PhaseView
	scrollOffset?: number;
	selectedTodoId?: string;
	// Roadmap state
	expandedPhases?: number[]; // Array of expanded phase numbers
	selectedIndex?: number; // Currently selected row index
}

const defaultTabState: Record<TabId, TabState> = {
	roadmap: { expandedPhases: [], selectedIndex: 0, scrollOffset: 0 },
	phase: { selectedPhaseNumber: undefined, detailLevel: 1, scrollOffset: 0 },
	todos: { selectedTodoId: undefined, detailLevel: undefined, scrollOffset: 0 },
};

export function useTabState() {
	// Use ref instead of state to avoid re-renders when saving tab state
	const tabStateRef = useRef<Record<TabId, TabState>>({
		...defaultTabState,
	});

	const setTab = useCallback((tab: TabId, state: Partial<TabState>) => {
		// Mutate ref directly - no re-render triggered
		tabStateRef.current = {
			...tabStateRef.current,
			[tab]: { ...tabStateRef.current[tab], ...state },
		};
	}, []);

	const getTab = useCallback((tab: TabId): TabState => {
		return tabStateRef.current[tab] ?? {};
	}, []);

	return { tabState: tabStateRef.current, setTab, getTab };
}
