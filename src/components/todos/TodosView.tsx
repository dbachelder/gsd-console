/**
 * TodosView Component
 * Displays todos list with filtering and navigation.
 */

import { Box, Text, useInput } from 'ink';
import { useEffect, useMemo, useState } from 'react';
import { useVimNav } from '../../hooks/useVimNav.ts';
import type { Todo } from '../../lib/types.ts';
import { TodoItem } from './TodoItem.tsx';

interface TodosViewProps {
	todos: Todo[];
	isActive: boolean;
	isTodoHighlighted?: (todoId: string) => boolean;
	isTodoFading?: (todoId: string) => boolean;
	showToast?: (message: string, type?: 'info' | 'success' | 'warning') => void;
	/** Called when selection changes, reports todo ID to parent */
	onTodoSelect?: (todoId: string | undefined) => void;
}

export function TodosView({
	todos,
	isActive,
	isTodoHighlighted,
	isTodoFading,
	showToast,
	onTodoSelect,
}: TodosViewProps) {
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

	// Notify parent of selection changes for editor integration
	useEffect(() => {
		const selectedTodo = sortedTodos[selectedIndex];
		onTodoSelect?.(selectedTodo?.id);
	}, [selectedIndex, sortedTodos, onTodoSelect]);

	// Handle f key for filter toggle, d for detail toggle, Space for todo toggle
	useInput(
		(input) => {
			if (input === 'f') {
				setShowCompleted((prev) => !prev);
			} else if (input === 'd') {
				setShowDetail((prev) => !prev);
			} else if (input === ' ') {
				// Space key: toggle todo (stub)
				const selectedTodo = sortedTodos[selectedIndex];
				if (selectedTodo && showToast) {
					showToast(`Todo toggle: ${selectedTodo.text} (will execute in Phase 4)`, 'info');
				}
			}
		},
		{ isActive },
	);

	return (
		<Box flexDirection="column" paddingX={1} flexGrow={1}>
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
							isHighlighted={isTodoHighlighted?.(todo.id)}
							isFading={isTodoFading?.(todo.id)}
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
