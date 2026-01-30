/**
 * ToastContainer Component
 * Renders toast notifications in a stack at the bottom-right.
 */

import { Box } from 'ink';
import type { Toast as ToastData } from '../../hooks/useToast.ts';
import { Toast } from './Toast.tsx';

interface ToastContainerProps {
	toasts: ToastData[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
	if (toasts.length === 0) {
		return null;
	}

	return (
		<Box flexDirection="column" position="absolute" marginLeft={2} marginTop={1}>
			{toasts.map((toast) => (
				<Toast key={toast.id} toast={toast} />
			))}
		</Box>
	);
}
