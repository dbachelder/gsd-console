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

		// Arrow keys and vim navigation
		if (key.upArrow || input === 'k') {
			setSelectedIndex((prev) => Math.max(0, prev - 1));
			return;
		}
		if (key.downArrow || input === 'j') {
			setSelectedIndex((prev) => Math.min(sessions.length - 1, prev + 1));
			return;
		}
	});

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="cyan"
			paddingX={2}
			paddingY={1}
			backgroundColor="black"
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
					{sessions.map((session, index) => {
						const isSelected = index === selectedIndex;
						return (
							<Box key={session.id} flexDirection="column">
								{/* First line: ID + directory */}
								<Box>
									<Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
										{isSelected ? '> ' : '  '}
										{truncate(session.id, 8)}
									</Text>
									<Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
										{'  '}
									</Text>
									<Text color={isSelected ? 'cyan' : 'yellow'} bold={isSelected}>
										{truncate(session.directory, 40)}
									</Text>
								</Box>
								{/* Second line: last command (indented, dimmed) */}
								{session.lastCommand && (
									<Box marginLeft={2}>
										<Text dimColor>"{truncate(session.lastCommand, 40)}"</Text>
									</Box>
								)}
							</Box>
						);
					})}
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
