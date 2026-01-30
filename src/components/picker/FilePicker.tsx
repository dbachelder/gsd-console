/**
 * FilePicker Component
 * Overlay for selecting from multiple files.
 * Used when editing context has multiple file options.
 * Supports vim-style navigation (j/k), arrow keys, and fuzzy filtering.
 */

import { basename } from 'node:path';
import { useFuzzySearchList } from '@nozbe/microfuzz/react';
import { Box, Text, useInput } from 'ink';
import { useCallback, useEffect, useState } from 'react';

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
	const [filter, setFilter] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);

	// Fuzzy search filtering using microfuzz react hook
	const filteredFiles = useFuzzySearchList({
		list: files,
		queryText: filter,
		getText: (item) => [getDisplayName(item), item],
		mapResultItem: ({ item }) => item,
	});

	// Reset selection when filter changes and results shrink
	useEffect(() => {
		if (selectedIndex >= filteredFiles.length) {
			setSelectedIndex(Math.max(0, filteredFiles.length - 1));
		}
	}, [filteredFiles.length, selectedIndex]);

	// Handle selection of current file
	const selectCurrent = useCallback(() => {
		const selectedFile = filteredFiles[selectedIndex];
		if (selectedFile) {
			onSelect(selectedFile);
		}
	}, [filteredFiles, selectedIndex, onSelect]);

	// Handle keyboard input
	useInput((input, key) => {
		// Escape: clear filter first, then close if filter empty
		if (key.escape) {
			if (filter) {
				setFilter('');
				setSelectedIndex(0);
			} else {
				onClose();
			}
			return;
		}

		// Enter: select current file
		if (key.return) {
			selectCurrent();
			return;
		}

		// Arrow keys and vim navigation
		if (key.upArrow || input === 'k') {
			setSelectedIndex((prev) => Math.max(0, prev - 1));
			return;
		}
		if (key.downArrow || input === 'j') {
			setSelectedIndex((prev) => Math.min(filteredFiles.length - 1, prev + 1));
			return;
		}

		// Number keys 1-9 for quick selection (only when no filter)
		if (!filter) {
			const num = parseInt(input, 10);
			if (!Number.isNaN(num) && num >= 1 && num <= filteredFiles.length && num <= 9) {
				const selectedFile = filteredFiles[num - 1];
				if (selectedFile) {
					onSelect(selectedFile);
				}
				return;
			}
		}

		// Backspace: remove last character from filter
		if (key.backspace || key.delete) {
			setFilter((prev) => prev.slice(0, -1));
			return;
		}

		// Printable characters: append to filter
		if (input.length === 1 && !key.ctrl && !key.meta && input !== 'j' && input !== 'k') {
			setFilter((prev) => prev + input);
			setSelectedIndex(0); // Reset selection on new filter input
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
				{filter && (
					<Text dimColor>
						{' '}
						({filteredFiles.length}/{files.length})
					</Text>
				)}
			</Box>

			{/* Filter input (shown when typing) */}
			{filter && (
				<Box marginBottom={1}>
					<Text dimColor>Filter: </Text>
					<Text color="yellow">{filter}</Text>
					<Text dimColor>_</Text>
				</Box>
			)}

			{/* File list */}
			<Box flexDirection="column">
				{filteredFiles.length === 0 ? (
					<Text dimColor>No matching files</Text>
				) : (
					filteredFiles.map((file, index) => {
						const isSelected = index === selectedIndex;
						return (
							<Box key={file}>
								<Text color={isSelected ? 'cyan' : 'yellow'} bold={isSelected}>
									{isSelected ? '>' : ' '} {index + 1}.{' '}
								</Text>
								<Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
									{getDisplayName(file)}
								</Text>
							</Box>
						);
					})
				)}
			</Box>

			{/* Footer */}
			<Box marginTop={1}>
				<Text dimColor>
					{filter
						? 'Type to filter | j/k: navigate | Enter: select | Esc: clear filter'
						: 'Type to filter | j/k: navigate | 1-9: quick select | Esc: close'}
				</Text>
			</Box>
		</Box>
	);
}
