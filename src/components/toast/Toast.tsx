/**
 * Toast Component
 * Displays a single toast notification with colored icon based on type.
 */

import { Box, Text } from 'ink';
import type { Toast as ToastData } from '../../hooks/useToast.ts';

interface ToastProps {
	toast: ToastData;
}

const TYPE_CONFIG = {
	info: { icon: 'i', color: 'blue' },
	success: { icon: '+', color: 'green' },
	warning: { icon: '!', color: 'yellow' },
} as const;

export function Toast({ toast }: ToastProps) {
	const config = TYPE_CONFIG[toast.type];

	return (
		<Box>
			<Text color={config.color}>[{config.icon}]</Text>
			<Text> {toast.message}</Text>
		</Box>
	);
}
