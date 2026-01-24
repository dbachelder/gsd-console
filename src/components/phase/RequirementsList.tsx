/**
 * RequirementsList Component
 * Displays requirement IDs in a compact format.
 */

import { Box, Text } from 'ink';

interface RequirementsListProps {
	requirements: string[];
}

export function RequirementsList({ requirements }: RequirementsListProps) {
	if (requirements.length === 0) {
		return null;
	}

	return (
		<Box flexDirection="column" marginBottom={1}>
			<Text bold color="yellow">
				Requirements:
			</Text>
			<Box marginLeft={2} flexWrap="wrap">
				{requirements.map((req, index) => (
					<Box key={req} marginRight={1}>
						<Text color="cyan">{req}</Text>
						{index < requirements.length - 1 && <Text dimColor>, </Text>}
					</Box>
				))}
			</Box>
		</Box>
	);
}
