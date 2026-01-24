/**
 * Footer Component
 * Displays keybinding hints based on current context.
 */

import { Box, Text } from 'ink';

interface FooterProps {
	onlyMode?: 'roadmap' | 'phase' | 'todos';
}

export function Footer({ onlyMode }: FooterProps) {
	// Different hints based on mode
	const hints = onlyMode
		? [
				{ key: 'j/k', action: 'navigate' },
				{ key: 'q', action: 'quit' },
				{ key: '?', action: 'help' },
			]
		: [
				{ key: 'Tab', action: 'switch' },
				{ key: '1/2/3', action: 'jump' },
				{ key: 'j/k', action: 'navigate' },
				{ key: 'q', action: 'quit' },
				{ key: '?', action: 'help' },
			];

	return (
		<Box marginTop={1} paddingX={1}>
			<Text dimColor>
				{hints.map((hint, index) => (
					<Text key={hint.key}>
						{index > 0 && ' | '}
						<Text bold>{hint.key}</Text>: {hint.action}
					</Text>
				))}
			</Text>
		</Box>
	);
}
