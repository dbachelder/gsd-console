/**
 * useTabState Hook
 * Manages per-tab state storage for session persistence.
 * State persists only for the current session (not across TUI restarts).
 */

import { useCallback, useState } from 'react';

export type TabId = 'roadmap' | 'phase' | 'todos';

export interface TabState {
	selectedPhaseNumber?: number;
	detailLevel?: number; // 1-3 for PhaseView
	scrollOffset?: number;
	selectedTodoId?: string;
}

const defaultTabState: Record<TabId, TabState> = {
	roadmap: { selectedPhaseNumber: undefined, detailLevel: undefined, scrollOffset: 0 },
	phase: { selectedPhaseNumber: undefined, detailLevel: 1, scrollOffset: 0 },
	todos: { selectedTodoId: undefined, detailLevel: undefined, scrollOffset: 0 },
};

export function useTabState() {
	const [tabState, setTabState] = useState<Record<TabId, TabState>>({
		...defaultTabState,
	});

	const setTab = useCallback((tab: TabId, state: Partial<TabState>) => {
		setTabState((prev) => ({
			...prev,
			[tab]: { ...prev[tab], ...state },
		}));
	}, []);

	const getTab = useCallback(
		(tab: TabId): TabState => {
			return tabState[tab] ?? {};
		},
		[tabState],
	);

	return { tabState, setTab, getTab };
}
