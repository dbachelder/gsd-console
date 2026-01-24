/**
 * ProgressBar Component
 * Visual progress indicator using box-drawing characters.
 */

import { Box, Text } from 'ink';

interface ProgressBarProps {
	percent: number;
	width?: number;
	showPercent?: boolean;
}

export function ProgressBar({ percent, width = 20, showPercent = true }: ProgressBarProps) {
	const clampedPercent = Math.max(0, Math.min(100, percent));
	const filledCount = Math.round((clampedPercent / 100) * width);
	const emptyCount = width - filledCount;

	const filledChar = '\u2588'; // Full block
	const emptyChar = '\u2591'; // Light shade

	return (
		<Box>
			<Text color="green">{filledChar.repeat(filledCount)}</Text>
			<Text dimColor>{emptyChar.repeat(emptyCount)}</Text>
			{showPercent && <Text dimColor> {clampedPercent}%</Text>}
		</Box>
	);
}
