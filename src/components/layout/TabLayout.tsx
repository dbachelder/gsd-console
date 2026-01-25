/**
 * TabLayout Component
 * Manages tab navigation and renders active view.
 */

import { Box, Text } from 'ink';
import { useEffect, useRef } from 'react';
import { useTabNav } from '../../hooks/useTabNav.ts';
import { type TabId, useTabState } from '../../hooks/useTabState.ts';
import type { CliFlags, GsdData } from '../../lib/types.ts';
import { PhaseView } from '../phase/PhaseView.tsx';
import { RoadmapView } from '../roadmap/RoadmapView.tsx';
import { TodosView } from '../todos/TodosView.tsx';

interface TabLayoutProps {
	data: GsdData;
	flags: CliFlags;
	isActive?: boolean;
	onTabChange?: (tab: TabId) => void;
	isPhaseHighlighted?: (phaseNumber: number) => boolean;
	isPhaseFading?: (phaseNumber: number) => boolean;
	isTodoHighlighted?: (todoId: string) => boolean;
	isTodoFading?: (todoId: string) => boolean;
	showToast?: (message: string, type?: 'info' | 'success' | 'warning') => void;
	/** Lifted selection state from App */
	selectedPhaseNumber: number;
	onPhaseSelect: (phaseNumber: number) => void;
	selectedTodoId?: string;
	onTodoSelect?: (todoId: string | undefined) => void;
}

export function TabLayout({
	data,
	flags,
	isActive = true,
	onTabChange,
	isPhaseHighlighted,
	isPhaseFading,
	isTodoHighlighted,
	isTodoFading,
	showToast,
	selectedPhaseNumber,
	onPhaseSelect,
	selectedTodoId: _selectedTodoId,
	onTodoSelect,
}: TabLayoutProps) {
	const isOnlyMode = Boolean(flags.only);

	// Tab state persistence for session
	const { getTab, setTab } = useTabState();
	const prevTabRef = useRef<TabId | null>(null);

	// Tab navigation using hook
	const { activeTab, setActiveTab } = useTabNav<TabId>({
		tabs: ['roadmap', 'phase', 'todos'],
		initialTab: flags.only ?? 'roadmap',
		isActive: isActive && !isOnlyMode,
	});

	// Restore detail level from tab state on mount/tab change
	const phaseTabState = getTab('phase');
	const detailLevel = phaseTabState.detailLevel ?? 1;

	// Handle detail level change from PhaseView
	const handleDetailLevelChange = (level: number) => {
		setTab('phase', { detailLevel: level });
	};

	// Track tab changes for state restoration
	useEffect(() => {
		// Store current tab state before switching away
		if (prevTabRef.current !== null && prevTabRef.current !== activeTab) {
			// State is automatically tracked via setTab calls
		}
		prevTabRef.current = activeTab;
	}, [activeTab]);

	// Notify parent of tab changes
	useEffect(() => {
		onTabChange?.(activeTab);
	}, [activeTab, onTabChange]);

	// Get selected phase object
	const selectedPhase =
		data.phases.find((p) => p.number === selectedPhaseNumber) ?? data.phases[0] ?? null;

	// Handle phase selection from roadmap
	const handleSelectPhase = (phaseNumber: number) => {
		onPhaseSelect(phaseNumber);
		setActiveTab('phase');
	};

	// Single view mode (--only flag) - fill terminal height
	if (flags.only) {
		return (
			<Box flexDirection="column" flexGrow={1}>
				{flags.only === 'roadmap' && (
					<RoadmapView
						phases={data.phases}
						isActive={isActive}
						onSelectPhase={handleSelectPhase}
						onPhaseNavigate={onPhaseSelect}
						isPhaseHighlighted={isPhaseHighlighted}
						isPhaseFading={isPhaseFading}
						showToast={showToast}
					/>
				)}
				{flags.only === 'phase' && (
					<PhaseView
						phase={selectedPhase}
						allPhases={data.phases}
						isActive={isActive}
						onPhaseChange={onPhaseSelect}
						detailLevel={detailLevel}
						onDetailLevelChange={handleDetailLevelChange}
					/>
				)}
				{flags.only === 'todos' && (
					<TodosView
						todos={data.todos}
						isActive={isActive}
						isTodoHighlighted={isTodoHighlighted}
						isTodoFading={isTodoFading}
						showToast={showToast}
						onTodoSelect={onTodoSelect}
					/>
				)}
			</Box>
		);
	}

	// Full tabbed layout
	return (
		<Box flexDirection="column">
			{/* Tab bar */}
			<TabBar activeTab={activeTab} />

			{/* Active view content */}
			<Box flexDirection="column">
				{activeTab === 'roadmap' && (
					<RoadmapView
						phases={data.phases}
						isActive={isActive}
						onSelectPhase={handleSelectPhase}
						onPhaseNavigate={onPhaseSelect}
						isPhaseHighlighted={isPhaseHighlighted}
						isPhaseFading={isPhaseFading}
						showToast={showToast}
					/>
				)}
				{activeTab === 'phase' && (
					<PhaseView
						phase={selectedPhase}
						allPhases={data.phases}
						isActive={isActive}
						onPhaseChange={onPhaseSelect}
						detailLevel={detailLevel}
						onDetailLevelChange={handleDetailLevelChange}
					/>
				)}
				{activeTab === 'todos' && (
					<TodosView
						todos={data.todos}
						isActive={isActive}
						isTodoHighlighted={isTodoHighlighted}
						isTodoFading={isTodoFading}
						showToast={showToast}
						onTodoSelect={onTodoSelect}
					/>
				)}
			</Box>
		</Box>
	);
}

interface TabBarProps {
	activeTab: TabId;
}

function TabBar({ activeTab }: TabBarProps) {
	const tabs: { id: TabId; label: string; key: string }[] = [
		{ id: 'roadmap', label: 'Roadmap', key: '1' },
		{ id: 'phase', label: 'Phase', key: '2' },
		{ id: 'todos', label: 'Todos', key: '3' },
	];

	return (
		<Box marginBottom={1} paddingX={2}>
			{tabs.map((tab, index) => (
				<Box key={tab.id}>
					{index > 0 && <Text dimColor> </Text>}
					<Text
						underline={activeTab === tab.id}
						bold={activeTab === tab.id}
						dimColor={activeTab !== tab.id}
					>
						[{tab.key}] {tab.label}
					</Text>
				</Box>
			))}
		</Box>
	);
}
