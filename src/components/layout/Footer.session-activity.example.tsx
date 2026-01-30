/**
 * Example: Using Session Activity in Footer
 *
 * This shows how to integrate session activity tracking into the TUI footer
 * to display currently running OpenCode commands.
 */

import { Box, Text } from 'ink';
import { useSessionActivity } from '../../hooks/useSessionActivity.ts';

type TabId = 'roadmap' | 'phase' | 'todos' | 'background';

interface FooterProps {
	activeTab?: TabId;
	onlyMode?: TabId;
}

/**
 * Footer component that displays active session activity.
 *
 * Shows a cyan "● Running: [activity]" prefix when an OpenCode session
 * is actively working, before the normal keybinding hints.
 */
export function FooterWithActivity(_props: FooterProps) {
	const activity = useSessionActivity();

	return (
		<Box marginTop={1} paddingX={1}>
			<Text dimColor>
				{/* Show active session activity */}
				{activity?.isActive && activity.currentActivity && (
					<Text color="cyan" bold>
						● {activity.currentActivity} |{' '}
					</Text>
				)}
				{/* ... existing keybinding hints ... */}
				Tab: tabs | c: connect | ?: commands | q: quit
			</Text>
		</Box>
	);
}

/**
 * Standalone status display component.
 *
 * Shows session status as a standalone indicator:
 * - ● Green if actively working
 * - ○ Gray if idle
 * - "No sessions" if no OpenCode server
 */
export function SessionStatus() {
	const activity = useSessionActivity();

	if (!activity) {
		return <Text dimColor>No sessions</Text>;
	}

	if (!activity.isActive) {
		return <Text dimColor>○ {activity.title} (idle)</Text>;
	}

	return <Text>● {activity.currentActivity || activity.title}</Text>;
}
