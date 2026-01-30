/**
 * Footer Component
 * Displays context-sensitive keybinding hints.
 */

import { Box, Text } from 'ink';
import { useSessionActivity } from '../../hooks/useSessionActivity.ts';

type TabId = 'roadmap' | 'phase' | 'todos' | 'background';

interface FooterProps {
	activeTab?: TabId;
	onlyMode?: TabId;
}

interface Hint {
	key: string;
	action: string;
}

// Context-sensitive hints per view - using arrow symbols for navigation
const viewHints: Record<TabId, Hint[]> = {
	roadmap: [
		{ key: '\u2191\u2193', action: 'select' },
		{ key: '\u2192', action: 'expand' },
		{ key: 'e', action: 'edit' },
	],
	phase: [
		{ key: '\u2191\u2193', action: 'scroll' },
		{ key: 'e', action: 'edit' },
	],
	todos: [
		{ key: '\u2191\u2193', action: 'select' },
		{ key: 'Space', action: 'toggle' },
		{ key: 'e', action: 'edit' },
	],
	background: [
		{ key: '\u2191\u2193', action: 'navigate' },
		{ key: 'Enter', action: 'expand' },
		{ key: 'x', action: 'cancel' },
	],
};

const commonHints: Hint[] = [
	{ key: 'c', action: 'connect' },
	{ key: ':', action: 'commands' },
	{ key: '?', action: 'help' },
	{ key: 'q', action: 'quit' },
];

export function Footer({ activeTab = 'roadmap', onlyMode }: FooterProps) {
	const currentTab = onlyMode ?? activeTab;
	const contextHints = viewHints[currentTab] ?? viewHints.roadmap;
	const activity = useSessionActivity();

	// Tab navigation hints (only in tabbed mode)
	const tabHints: Hint[] = onlyMode ? [] : [{ key: 'Tab', action: 'tabs' }];

	const allHints = [...contextHints, ...tabHints, ...commonHints];

	return (
		<Box flexDirection="column" marginTop={1} paddingX={1}>
			{/* Session status line */}
			<Text dimColor>
				{activity?.isActive && activity.currentActivity && (
					<Text color="cyan" bold>
						● {activity.currentActivity}
					</Text>
				)}
				{activity && !activity.isActive && activity.title && (
					<Text>○ {activity.title.slice(0, 8)}...</Text>
				)}
			</Text>

			{/* Keybinding hints line */}
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
