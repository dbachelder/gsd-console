/**
 * FilePicker Component
 * Overlay for selecting from multiple files.
 * Used when editing context has multiple file options.
 */

import { basename } from 'node:path';
import { Box, Text, useInput } from 'ink';

interface FilePickerProps {
	/** List of file paths to choose from */
	files: string[];
	/** Called when user selects a file */
	onSelect: (path: string) => void;
	/** Called when user cancels (Escape) */
	onClose: () => void;
}

/**
 * Get display name for a file path.
 * Shows filename with parent directory for context.
 */
function getDisplayName(filePath: string): string {
	const parts = filePath.split('/');
	if (parts.length >= 2) {
		return `${parts[parts.length - 2]}/${basename(filePath)}`;
	}
	return basename(filePath);
}

export function FilePicker({ files, onSelect, onClose }: FilePickerProps) {
	// Handle keyboard input
	useInput((input, key) => {
		// Escape to close
		if (key.escape) {
			onClose();
			return;
		}

		// Number keys 1-9 to select file
		const num = parseInt(input, 10);
		if (!Number.isNaN(num) && num >= 1 && num <= files.length) {
			const selectedFile = files[num - 1];
			if (selectedFile) {
				onSelect(selectedFile);
			}
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
					Select file to edit
				</Text>
			</Box>

			{/* File list */}
			<Box flexDirection="column">
				{files.map((file, index) => (
					<Box key={file}>
						<Text color="yellow" bold>
							{index + 1}.{' '}
						</Text>
						<Text>{getDisplayName(file)}</Text>
					</Box>
				))}
			</Box>

			{/* Footer */}
			<Box marginTop={1}>
				<Text dimColor>Press 1-{files.length} to select, Escape to cancel</Text>
			</Box>
		</Box>
	);
}
