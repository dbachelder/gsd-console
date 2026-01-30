/**
 * OpenCode Connection Hook
 * Manages connection to OpenCode server with automatic detection.
 */

import { useCallback, useEffect, useState } from 'react';
import { createClient, detectServer } from '../lib/opencode.ts';
import type { OpencodeConnectionState } from '../lib/types.ts';

/** Return type for the useOpencodeConnection hook */
export interface UseOpencodeConnectionResult extends OpencodeConnectionState {
	/** SDK client (null when not connected) */
	client: ReturnType<typeof createClient> | null;
	/** Manually trigger a connection check */
	checkConnection: () => Promise<void>;
}

/**
 * Hook to manage connection to OpenCode server.
 * Automatically detects if server is running on mount.
 *
 * @param port - Port to check (default: 4096)
 * @returns Connection state, client, and checkConnection function
 */
export function useOpencodeConnection(port?: number): UseOpencodeConnectionResult {
	const [state, setState] = useState<OpencodeConnectionState>({
		isConnected: false,
		isChecking: true,
		serverVersion: undefined,
		error: undefined,
	});
	const [client, setClient] = useState<ReturnType<typeof createClient> | null>(null);

	const checkConnection = useCallback(async () => {
		setState((prev) => ({ ...prev, isChecking: true, error: undefined }));

		try {
			const isRunning = await detectServer(port);

			if (isRunning) {
				const newClient = createClient(port ? `http://127.0.0.1:${port}` : undefined);
				setClient(newClient);
				setState({
					isConnected: true,
					isChecking: false,
					serverVersion: undefined, // Could be enhanced to get version
					error: undefined,
				});
			} else {
				setClient(null);
				setState({
					isConnected: false,
					isChecking: false,
					serverVersion: undefined,
					error: undefined,
				});
			}
		} catch (err) {
			setClient(null);
			setState({
				isConnected: false,
				isChecking: false,
				serverVersion: undefined,
				error: err instanceof Error ? err : new Error('Connection check failed'),
			});
		}
	}, [port]);

	// Check connection on mount
	useEffect(() => {
		checkConnection();
	}, [checkConnection]);

	return {
		...state,
		client,
		checkConnection,
	};
}

export default useOpencodeConnection;
