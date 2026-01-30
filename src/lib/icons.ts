/**
 * GSD Console Icons and Colors
 * Status indicators and color mappings for the terminal UI.
 */

import type { PhaseStatus } from './types.ts';

// Status icons (using Unicode for terminal compatibility)
export const icons = {
	// Phase status
	complete: '\u2713', // Check mark
	inProgress: '\u25D0', // Half circle (◐)
	notStarted: '\u25CB', // Empty circle (○)
	blocked: '\u2717', // X mark

	// Phase indicators
	hasContext: '\uD83D\uDCCB', // Clipboard emoji
	hasPlan: '\uD83D\uDCDD', // Memo emoji
	hasResearch: '\uD83D\uDD2C', // Microscope emoji
	uatComplete: '\uD83E\uDDEA', // Test tube emoji (🧪)

	// Placeholder for inactive indicators
	placeholder: '\u25A1', // Empty square

	// Navigation/UI
	arrow: '\u25B6', // Right-pointing triangle
	bullet: '\u2022', // Bullet point
	dash: '\u2014', // Em dash
} as const;

// Color mappings for Ink Text component
export const statusColors: Record<PhaseStatus, string> = {
	complete: 'green',
	'in-progress': 'yellow',
	'not-started': 'gray',
	blocked: 'red',
};

// Get icon for phase status
export function getStatusIcon(status: PhaseStatus): string {
	switch (status) {
		case 'complete':
			return icons.complete;
		case 'in-progress':
			return icons.inProgress;
		case 'not-started':
			return icons.notStarted;
		case 'blocked':
			return icons.blocked;
		default:
			return icons.notStarted;
	}
}

// Get color for phase status
export function getStatusColor(status: PhaseStatus): string {
	return statusColors[status] ?? 'gray';
}

// Format progress as a visual bar
export function formatProgressBar(
	percent: number,
	width = 10,
): { filled: string; empty: string; text: string } {
	const filledCount = Math.round((percent / 100) * width);
	const emptyCount = width - filledCount;

	const filledChar = '\u2588'; // Full block
	const emptyChar = '\u2591'; // Light shade

	return {
		filled: filledChar.repeat(filledCount),
		empty: emptyChar.repeat(emptyCount),
		text: `${filledChar.repeat(filledCount)}${emptyChar.repeat(emptyCount)} ${percent}%`,
	};
}

// Indicator state for rendering
export interface IndicatorItem {
	icon: string;
	label: string;
	active: boolean;
}

// Get indicator icons for a phase (returns structured data for rendering)
export function getIndicatorIcons(indicators: {
	hasContext: boolean;
	hasPlan: boolean;
	hasResearch: boolean;
	uatComplete: boolean;
}): IndicatorItem[] {
	return [
		{
			icon: indicators.hasResearch ? icons.hasResearch : icons.placeholder,
			label: 'Research',
			active: indicators.hasResearch,
		},
		{
			icon: indicators.hasContext ? icons.hasContext : icons.placeholder,
			label: 'Context',
			active: indicators.hasContext,
		},
		{
			icon: indicators.hasPlan ? icons.hasPlan : icons.placeholder,
			label: 'Plan',
			active: indicators.hasPlan,
		},
		{
			icon: indicators.uatComplete ? icons.uatComplete : icons.placeholder,
			label: 'UAT',
			active: indicators.uatComplete,
		},
	];
}
