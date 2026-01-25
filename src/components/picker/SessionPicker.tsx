/**
 * SessionPicker Component
 * Overlay for selecting from OpenCode sessions.
 * Displays session ID, directory, and last command.
 * Offers to spawn a new session if none exist.
 */

import { Spinner } from '@inkjs/ui';
import { Box, Text, useInput } from 'ink';
import { useState } from 'react';
import type { SessionInfo } from '../../lib/opencode.ts';

interface SessionPickerProps {
	/** List of sessions to choose from */
	sessions: SessionInfo[];
	/** Called when user selects a session */
	onSelect: (sessionId: string) => void;
	/** Called when user wants to spawn a new session */
	onSpawnNew: () => void;
	/** Called when user cancels (Escape) */
	onClose: () => void;
	/** Loading state while fetching sessions */
	isLoading?: boolean;
}

/**
 * Truncate a string to maxLength, adding ellipsis if needed.
 */
function truncate(str: string | undefined, maxLength: number): string {
	if (!str) return '';
	if (str.length <= maxLength) return str;
	return `${str.slice(0, maxLength - 3)}...`;
}

/**
 * Format a timestamp as relative time (e.g., "5m ago", "2h ago")
 */
function relativeTime(timestamp: number | undefined): string {
	if (!timestamp) return '';
	const now = Date.now();
	const diff = now - timestamp;
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 1) return 'now';
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	return `${days}d ago`;
}

/** Max sessions to show before truncating */
const MAX_VISIBLE_SESSIONS = 8;

export function SessionPicker({
	sessions,
	onSelect,
	onSpawnNew,
	onClose,
	isLoading = false,
}: SessionPickerProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);

	// Handle keyboard input
	useInput((input, key) => {
		// Escape: close picker
		if (key.escape) {
			onClose();
			return;
		}

		// Enter: select current session or spawn new
		if (key.return) {
			if (sessions.length === 0) {
				// Empty state: spawn new session
				onSpawnNew();
			} else {
				// Select the highlighted session
				const selectedSession = sessions[selectedIndex];
				if (selectedSession) {
					onSelect(selectedSession.id);
				}
			}
			return;
		}

		// Arrow keys and vim navigation (limited to visible sessions)
		const maxIndex = Math.min(sessions.length, MAX_VISIBLE_SESSIONS) - 1;
		if (key.upArrow || input === 'k') {
			setSelectedIndex((prev) => Math.max(0, prev - 1));
			return;
		}
		if (key.downArrow || input === 'j') {
			setSelectedIndex((prev) => Math.min(maxIndex, prev + 1));
			return;
		}
	});

	// Limit visible sessions, track if there are more
	const visibleSessions = sessions.slice(0, MAX_VISIBLE_SESSIONS);
	const hasMore = sessions.length > MAX_VISIBLE_SESSIONS;

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="cyan"
			paddingX={2}
			paddingY={1}
			width="100%"
			// biome-ignore lint/suspicious/noExplicitAny: Ink supports backgroundColor but types incomplete
			{...({ backgroundColor: 'black' } as any)}
		>
			{/* Title */}
			<Box marginBottom={1}>
				<Text bold color="cyan">
					Select Session
				</Text>
			</Box>

			{/* Loading state */}
			{isLoading && (
				<Box>
					<Spinner label="Loading sessions..." />
				</Box>
			)}

			{/* Empty state */}
			{!isLoading && sessions.length === 0 && (
				<Box flexDirection="column">
					<Text dimColor>No OpenCode sessions found.</Text>
					<Box marginTop={1} flexDirection="column">
						<Text>Press Enter to spawn a new session</Text>
						<Text dimColor>Press Escape to cancel</Text>
					</Box>
				</Box>
			)}

			{/* Session list */}
			{!isLoading && sessions.length > 0 && (
				<Box flexDirection="column">
					{visibleSessions.map((session, index) => {
						const isSelected = index === selectedIndex;
						const time = relativeTime(session.updatedAt);
						return (
							<Box key={session.id} marginBottom={1}>
								<Box flexDirection="column">
									{/* First line: selector + title + time */}
									<Box>
										<Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
											{isSelected ? '▶ ' : '  '}
										</Text>
										<Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
											{truncate(session.lastCommand || session.id, 60)}
										</Text>
										<Text dimColor> ({time})</Text>
									</Box>
									{/* Second line: directory (dimmed) */}
									<Box marginLeft={2}>
										<Text dimColor>{session.directory}</Text>
									</Box>
								</Box>
							</Box>
						);
					})}
					{hasMore && (
						<Text dimColor> ... and {sessions.length - MAX_VISIBLE_SESSIONS} more sessions</Text>
					)}
				</Box>
			)}

			{/* Footer */}
			{!isLoading && sessions.length > 0 && (
				<Box marginTop={1}>
					<Text dimColor>j/k: navigate | Enter: select | Esc: close</Text>
				</Box>
			)}
		</Box>
	);
}
