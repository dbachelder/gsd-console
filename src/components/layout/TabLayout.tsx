/**
 * TabLayout Component
 * Manages tab navigation and renders active view.
 */

import { Box, Text } from 'ink';
import { useState } from 'react';
import { useTabNav } from '../../hooks/useTabNav.ts';
import type { CliFlags, GsdData, Todo } from '../../lib/types.ts';
import { PhaseView } from '../phase/PhaseView.tsx';
import { RoadmapView } from '../roadmap/RoadmapView.tsx';

type TabId = 'roadmap' | 'phase' | 'todos';

interface TabLayoutProps {
	data: GsdData;
	flags: CliFlags;
	isActive?: boolean;
}

export function TabLayout({ data, flags, isActive = true }: TabLayoutProps) {
	const isOnlyMode = Boolean(flags.only);

	// Track selected phase number (for Phase view navigation)
	const [selectedPhaseNumber, setSelectedPhaseNumber] = useState<number>(flags.phase ?? 1);

	// Tab navigation using hook
	const { activeTab, setActiveTab } = useTabNav<TabId>({
		tabs: ['roadmap', 'phase', 'todos'],
		initialTab: flags.only ?? 'roadmap',
		isActive: isActive && !isOnlyMode,
	});

	// Get selected phase object
	const selectedPhase =
		data.phases.find((p) => p.number === selectedPhaseNumber) ?? data.phases[0] ?? null;

	// Handle phase selection from roadmap
	const handleSelectPhase = (phaseNumber: number) => {
		setSelectedPhaseNumber(phaseNumber);
		setActiveTab('phase');
	};

	// Single view mode (--only flag)
	if (flags.only) {
		return (
			<Box flexDirection="column">
				{flags.only === 'roadmap' && (
					<RoadmapView phases={data.phases} isActive={isActive} onSelectPhase={handleSelectPhase} />
				)}
				{flags.only === 'phase' && (
					<PhaseView
						phase={selectedPhase}
						allPhases={data.phases}
						isActive={isActive}
						onPhaseChange={setSelectedPhaseNumber}
					/>
				)}
				{flags.only === 'todos' && <TodosPlaceholder todos={data.todos} />}
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
					<RoadmapView phases={data.phases} isActive={isActive} onSelectPhase={handleSelectPhase} />
				)}
				{activeTab === 'phase' && (
					<PhaseView
						phase={selectedPhase}
						allPhases={data.phases}
						isActive={isActive}
						onPhaseChange={setSelectedPhaseNumber}
					/>
				)}
				{activeTab === 'todos' && <TodosPlaceholder todos={data.todos} />}
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

// Temporary placeholder - will be replaced by full TodosView in Task 3
interface TodosPlaceholderProps {
	todos: Todo[];
}

function TodosPlaceholder({ todos }: TodosPlaceholderProps) {
	return (
		<Box flexDirection="column" borderStyle="single" paddingX={1} marginX={1}>
			<Text bold color="yellow">
				Todos View
			</Text>
			<Text dimColor>{todos.length} items</Text>
			{todos.length === 0 ? (
				<Text dimColor>No todos found</Text>
			) : (
				<Box marginTop={1} flexDirection="column">
					{todos.slice(0, 5).map((todo) => (
						<Box key={todo.id}>
							<Text color={todo.completed ? 'green' : 'gray'}>[{todo.completed ? 'x' : ' '}] </Text>
							<Text strikethrough={todo.completed}>{todo.text}</Text>
						</Box>
					))}
					{todos.length > 5 && <Text dimColor>...and {todos.length - 5} more</Text>}
				</Box>
			)}
		</Box>
	);
}
