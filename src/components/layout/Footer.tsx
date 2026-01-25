/**
 * Footer Component
 * Displays context-sensitive keybinding hints.
 */

import { Box, Text } from 'ink';

type TabId = 'roadmap' | 'phase' | 'todos';

interface FooterProps {
	activeTab?: TabId;
	onlyMode?: TabId;
}

interface Hint {
	key: string;
	action: string;
}

// Context-sensitive hints per view
const viewHints: Record<TabId, Hint[]> = {
	roadmap: [
		{ key: 'j/k', action: 'select' },
		{ key: 'l', action: 'expand' },
		{ key: 'd', action: 'details' },
	],
	phase: [
		{ key: 'j/k', action: 'scroll' },
		{ key: '[/]', action: 'switch phase' },
		{ key: 'd', action: 'details' },
	],
	todos: [
		{ key: 'j/k', action: 'select' },
		{ key: 'f', action: 'filter' },
		{ key: 'd', action: 'details' },
	],
};

const commonHints: Hint[] = [
	{ key: '?', action: 'help' },
	{ key: 'q', action: 'quit' },
];

export function Footer({ activeTab = 'roadmap', onlyMode }: FooterProps) {
	const currentTab = onlyMode ?? activeTab;
	const contextHints = viewHints[currentTab] ?? viewHints.roadmap;

	// Tab navigation hints (only in tabbed mode)
	const tabHints: Hint[] = onlyMode
		? []
		: [
				{ key: 'Tab', action: 'switch' },
				{ key: '1/2/3', action: 'jump' },
			];

	const allHints = [...contextHints, ...tabHints, ...commonHints];

	return (
		<Box marginTop={1} paddingX={1}>
			<Text dimColor>
				{allHints.map((hint, index) => (
					<Text key={hint.key}>
						{index > 0 && ' | '}
						<Text bold>{hint.key}</Text>: {hint.action}
					</Text>
				))}
			</Text>
		</Box>
	);
}
