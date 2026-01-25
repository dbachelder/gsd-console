/**
 * CriteriaList Component
 * Displays success criteria as a numbered checkbox list.
 */

import { Box, Text } from 'ink';

interface CriteriaListProps {
	criteria: string[];
	label?: string;
}

export function CriteriaList({ criteria, label = 'Success Criteria:' }: CriteriaListProps) {
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
						<Text color="gray">[ ] </Text>
						{criterion}
					</Text>
				))}
			</Box>
		</Box>
	);
}
