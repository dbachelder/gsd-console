/**
 * TodosView Component
 * Displays todos list with filtering and navigation.
 */

import { Box, Text, useInput } from 'ink';
import { useMemo, useState } from 'react';
import { useVimNav } from '../../hooks/useVimNav.ts';
import type { Todo } from '../../lib/types.ts';
import { TodoItem } from './TodoItem.tsx';

interface TodosViewProps {
	todos: Todo[];
	isActive: boolean;
}

export function TodosView({ todos, isActive }: TodosViewProps) {
	// Filter state: show completed todos or not
	const [showCompleted, setShowCompleted] = useState(true);

	// Detail level
	const [showDetail, setShowDetail] = useState(false);

	// Sorted and filtered todos: incomplete first, then completed
	const sortedTodos = useMemo(() => {
		const incomplete = todos.filter((t) => !t.completed);
		const completed = todos.filter((t) => t.completed);

		if (showCompleted) {
			return [...incomplete, ...completed];
		}
		return incomplete;
	}, [todos, showCompleted]);

	// Counts
	const pendingCount = todos.filter((t) => !t.completed).length;
	const doneCount = todos.filter((t) => t.completed).length;

	// Vim navigation
	const { selectedIndex } = useVimNav({
		itemCount: sortedTodos.length,
		pageSize: 15,
		isActive,
		onSelect: () => {}, // No action on select for now (will be used in Phase 3 for editing)
		onBack: () => {},
	});

	// Handle f key for filter toggle, d for detail toggle
	useInput(
		(input) => {
			if (input === 'f') {
				setShowCompleted((prev) => !prev);
			} else if (input === 'd') {
				setShowDetail((prev) => !prev);
			}
		},
		{ isActive },
	);

	return (
		<Box flexDirection="column" paddingX={1}>
			{/* Header */}
			<Box marginBottom={1}>
				<Text bold>Todos </Text>
				<Text dimColor>
					({pendingCount} pending, {doneCount} done)
				</Text>
			</Box>

			{/* Todo list */}
			<Box flexDirection="column" borderStyle="single" paddingX={1}>
				{sortedTodos.length === 0 ? (
					<Text dimColor>{showCompleted ? 'No todos found' : 'No pending todos'}</Text>
				) : (
					sortedTodos.map((todo, index) => (
						<TodoItem
							key={todo.id}
							todo={todo}
							isSelected={index === selectedIndex}
							showDetail={showDetail}
						/>
					))
				)}
			</Box>

			{/* Status hints */}
			<Box marginTop={1}>
				<Text dimColor>
					Filter: {showCompleted ? 'all' : 'pending only'} (f to toggle) | Details:{' '}
					{showDetail ? 'shown' : 'hidden'} (d to toggle)
				</Text>
			</Box>
		</Box>
	);
}
