/**
 * CriteriaList Component
 * Displays success criteria as a numbered checkbox list.
 * Shows green checkmarks when phase is complete, empty boxes otherwise.
 */

import { Box, Text } from 'ink';

interface CriteriaListProps {
	criteria: string[];
	label?: string;
	/** Whether the phase is complete (all criteria are considered verified) */
	phaseComplete?: boolean;
}

export function CriteriaList({
	criteria,
	label = 'Success Criteria:',
	phaseComplete = false,
}: CriteriaListProps) {
	if (criteria.length === 0) {
		return null;
	}

	return (
		<Box flexDirection="column" marginBottom={1}>
			<Text bold color="yellow">
				{label}
			</Text>
			<Box flexDirection="column" marginLeft={2}>
				{criteria.map((criterion, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: criteria are static content, order doesn't change
					<Text key={index} wrap="wrap">
						<Text dimColor>{index + 1}. </Text>
						<Text color={phaseComplete ? 'green' : 'gray'}>{phaseComplete ? '[✓] ' : '[ ] '}</Text>
						{criterion}
					</Text>
				))}
			</Box>
		</Box>
	);
}
