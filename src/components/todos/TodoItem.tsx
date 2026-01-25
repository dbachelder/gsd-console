/**
 * TodoItem Component
 * Displays a single todo with checkbox and optional metadata.
 */

import { Box, Text } from 'ink';
import type { Todo } from '../../lib/types.ts';

interface TodoItemProps {
	todo: Todo;
	isSelected: boolean;
	showDetail?: boolean;
}

export function TodoItem({ todo, isSelected, showDetail = false }: TodoItemProps) {
	const checkbox = todo.completed ? '[x]' : '[ ]';
	const checkboxColor = todo.completed ? 'green' : 'gray';

	return (
		<Box flexDirection="column">
			<Box>
				<Text
					backgroundColor={isSelected ? 'gray' : undefined}
					color={isSelected ? 'white' : undefined}
				>
					<Text color={checkboxColor}>{checkbox} </Text>
					<Text strikethrough={todo.completed} dimColor={todo.completed}>
						{todo.text}
					</Text>
				</Text>
			</Box>

			{/* Detail metadata */}
			{showDetail && (todo.source || todo.phase !== undefined) && (
				<Box marginLeft={4}>
					{todo.source && <Text dimColor>Source: {todo.source}</Text>}
					{todo.phase !== undefined && (
						<Text dimColor>
							{todo.source && ' | '}Phase: {todo.phase}
						</Text>
					)}
				</Box>
			)}
		</Box>
	);
}
