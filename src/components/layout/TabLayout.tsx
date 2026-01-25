/**
 * TabLayout Component
 * Manages tab navigation and renders active view.
 */

import { Box, Text } from 'ink';
import { useEffect } from 'react';
import { useTabNav } from '../../hooks/useTabNav.ts';
import type { CliFlags, GsdData } from '../../lib/types.ts';
import { PhaseView } from '../phase/PhaseView.tsx';
import { RoadmapView } from '../roadmap/RoadmapView.tsx';
import { TodosView } from '../todos/TodosView.tsx';

type TabId = 'roadmap' | 'phase' | 'todos';

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

	// Tab navigation using hook
	const { activeTab, setActiveTab } = useTabNav<TabId>({
		tabs: ['roadmap', 'phase', 'todos'],
		initialTab: flags.only ?? 'roadmap',
		isActive: isActive && !isOnlyMode,
	});

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
		<Box marginBottom={1} paddingX={1}>
			{tabs.map((tab, index) => (
				<Box key={tab.id}>
					{index > 0 && <Text dimColor> | </Text>}
					<Text
						bold={activeTab === tab.id}
						color={activeTab === tab.id ? 'cyan' : undefined}
						backgroundColor={activeTab === tab.id ? 'gray' : undefined}
					>
						{' '}
						[{tab.key}] {tab.label}{' '}
					</Text>
				</Box>
			))}
		</Box>
	);
}
