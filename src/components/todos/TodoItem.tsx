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
	isHighlighted?: boolean;
	isFading?: boolean;
}

export function TodoItem({
	todo,
	isSelected,
	showDetail = false,
	isHighlighted = false,
	isFading = false,
}: TodoItemProps) {
	const checkbox = todo.completed ? '[x]' : '[ ]';
	const checkboxColor = todo.completed ? 'green' : 'gray';

	// Calculate highlight background color
	const highlightBg = isHighlighted ? (isFading ? '#1e1e00' : '#3d3d00') : undefined;

	return (
		<Box flexDirection="column" backgroundColor={highlightBg}>
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
