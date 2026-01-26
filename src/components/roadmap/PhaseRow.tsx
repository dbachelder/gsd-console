/**
 * PhaseRow Component
 * Displays a single phase in the roadmap list with status and progress.
 */

import { Box, Text } from 'ink';
import { getIndicatorIcons, getStatusColor, getStatusIcon } from '../../lib/icons.ts';
import type { Phase } from '../../lib/types.ts';
import { ProgressBar } from './ProgressBar.tsx';

interface PhaseRowProps {
	phase: Phase;
	isSelected: boolean;
	isExpanded: boolean;
	showIndicators?: boolean;
	isHighlighted?: boolean;
	isFading?: boolean;
	/** Width to pad plan fraction to (for alignment) */
	maxPlansWidth?: number;
}

export function PhaseRow({
	phase,
	isSelected,
	isExpanded,
	showIndicators = true,
	isHighlighted = false,
	isFading = false,
	maxPlansWidth,
}: PhaseRowProps) {
	const chevron = isExpanded ? '\u25BC' : '\u25B6'; // Down or Right triangle
	const statusIcon = getStatusIcon(phase.status);
	const statusColor = getStatusColor(phase.status);

	// Calculate highlight background color
	const highlightBg = isHighlighted ? (isFading ? '#1e1e00' : '#3d3d00') : undefined;

	// Calculate plan completion percentage
	const planPercent =
		phase.plansTotal > 0 ? Math.round((phase.plansComplete / phase.plansTotal) * 100) : 0;

	// Get indicator icons array
	const indicators = getIndicatorIcons(phase.indicators);

	return (
		<Box flexDirection="column" backgroundColor={highlightBg}>
			{/* Main phase row */}
			<Box justifyContent="space-between">
				{/* Left side: chevron, status, name */}
				<Box>
					<Text
						backgroundColor={isSelected ? 'gray' : undefined}
						color={isSelected ? 'white' : undefined}
					>
						{/* Chevron */}
						<Text>{chevron} </Text>

						{/* Status icon */}
						<Text color={statusColor}>[{statusIcon}] </Text>

						{/* Phase name */}
						<Text bold={isSelected}>
							Phase {phase.number}: {phase.name}
						</Text>
					</Text>
				</Box>

				{/* Right side: progress bar and count */}
				<Box>
					<ProgressBar percent={planPercent} width={10} showPercent={false} />
					<Text dimColor>
						{String(phase.plansComplete).padStart(maxPlansWidth ?? 2, ' ')}/{phase.plansTotal}
					</Text>
				</Box>
			</Box>

			{/* Expanded content: indicator icons */}
			{isExpanded && showIndicators && (
				<Box marginLeft={4}>
					{indicators.map((ind, i) => (
						<Text key={ind.label} dimColor={!ind.active}>
							{ind.icon} {ind.label}
							{i < indicators.length - 1 ? '  ' : ''}
						</Text>
					))}
				</Box>
			)}
		</Box>
	);
}
