/**
 * Execution Mode Prompt Component
 * Per CONTEXT.md: Always prompt user for mode choice when running a queueable command.
 * Three modes: headless, interactive, primary.
 */

import { Box, Text, useInput } from 'ink';
import type { ExecutionMode } from '../../lib/types.ts';

interface ExecutionModePromptProps {
	/** The command being executed */
	command: string;
	/** Whether a session is connected for "primary" mode */
	hasActiveSession: boolean;
	/** Callback when user selects a mode */
	onSelect: (mode: ExecutionMode) => void;
	/** Callback when user cancels */
	onCancel: () => void;
}

export function ExecutionModePrompt({
	command,
	hasActiveSession,
	onSelect,
	onCancel,
}: ExecutionModePromptProps) {
	useInput((input, key) => {
		// Escape to cancel
		if (key.escape) {
			onCancel();
			return;
		}

		// h/H for headless
		if (input === 'h' || input === 'H') {
			onSelect('headless');
			return;
		}

		// i/I for interactive
		if (input === 'i' || input === 'I') {
			onSelect('interactive');
			return;
		}

		// p/P for primary (only if session connected)
		if (input === 'p' || input === 'P') {
			if (hasActiveSession) {
				onSelect('primary');
			}
			// Do nothing if no session - option is disabled
			return;
		}
	});

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor="cyan"
			paddingX={2}
			paddingY={1}
			width={50}
			// biome-ignore lint/suspicious/noExplicitAny: Ink supports backgroundColor but types are incomplete
			{...({ backgroundColor: 'black' } as any)}
		>
			{/* Header */}
			<Box marginBottom={1}>
				<Text bold color="cyan">
					Execute: {command}
				</Text>
			</Box>

			{/* Headless option */}
			<Box flexDirection="column" marginBottom={1}>
				<Box>
					<Text bold color="yellow">
						[H]
					</Text>
					<Text> Headless - Run in background</Text>
				</Box>
				<Box marginLeft={4}>
					<Text dimColor>TUI shows status, view in Background tab</Text>
				</Box>
			</Box>

			{/* Interactive option */}
			<Box flexDirection="column" marginBottom={1}>
				<Box>
					<Text bold color="green">
						[I]
					</Text>
					<Text> Interactive - New session</Text>
				</Box>
				<Box marginLeft={4}>
					<Text dimColor>Terminal hands off to OpenCode</Text>
				</Box>
			</Box>

			{/* Primary option */}
			<Box flexDirection="column" marginBottom={1}>
				<Box>
					<Text bold color={hasActiveSession ? 'magenta' : undefined} dimColor={!hasActiveSession}>
						[P]
					</Text>
					<Text dimColor={!hasActiveSession}> Primary - Send to connected session</Text>
				</Box>
				<Box marginLeft={4}>
					<Text dimColor>
						{hasActiveSession ? 'Send to active session' : '(no session connected)'}
					</Text>
				</Box>
			</Box>

			{/* Footer */}
			<Box marginTop={1}>
				<Text dimColor>Press Escape to cancel</Text>
			</Box>
		</Box>
	);
}
