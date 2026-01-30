/**
 * GoalSection Component
 * Displays the phase goal with formatting.
 */

import { Box, Text } from 'ink';

interface GoalSectionProps {
	goal: string;
}

export function GoalSection({ goal }: GoalSectionProps) {
	return (
		<Box flexDirection="column" marginBottom={1}>
			<Text bold color="yellow">
				Goal:
			</Text>
			<Box marginLeft={2}>
				<Text wrap="wrap">{goal || '(No goal specified)'}</Text>
			</Box>
		</Box>
	);
}
