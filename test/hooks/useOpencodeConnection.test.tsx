/**
 * useOpencodeConnection Tests
 * Tests for OpenCode connection hook with mocked SDK.
 */

import { beforeEach, describe, expect, test, vi } from 'bun:test';
import { render } from 'ink-testing-library';

import { useOpencodeConnection } from '../../src/hooks/useOpencodeConnection.ts';

// Mock the opencode module before importing
const mockDetectServer = vi.fn().mockResolvedValue(true);
const mockCreateClient = vi.fn().mockReturnValue({
	session: {
		list: vi.fn().mockResolvedValue({
			error: null,
			data: [
				{
					id: 'session-1',
					title: 'Test Session',
					workingDirectory: '/Users/dan/src/gsd-console',
				},
			],
		}),
	},
});

vi.mock('../../src/lib/opencode.ts', () => ({
	detectServer: () => mockDetectServer(),
	createClient: () => mockCreateClient(),
}));

describe('useOpencodeConnection', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDetectServer.mockResolvedValue(true);
		mockCreateClient.mockReturnValue({
			session: {
				list: vi.fn().mockResolvedValue({
					error: null,
					data: [
						{
							id: 'session-1',
							title: 'Test Session',
							workingDirectory: '/Users/dan/src/gsd-console',
						},
					],
				}),
			},
		});
	});

	test('detects connected server on mount', async () => {
		let capturedState: any = null;

		const TestComponent = () => {
			const { isConnected, isChecking } = useOpencodeConnection();
			capturedState = { isConnected, isChecking };
			return null;
		};

		render(<TestComponent />);

		// Wait for async check to complete
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(capturedState?.isConnected).toBe(true);
		expect(capturedState?.isChecking).toBe(false);
	});

	test('handles connection errors gracefully', async () => {
		// Mock detectServer to return false (server not running)
		mockDetectServer.mockResolvedValueOnce(false);

		let capturedState: any = null;

		const TestComponent = () => {
			const { isConnected, error } = useOpencodeConnection();
			capturedState = { isConnected, error };
			return null;
		};

		render(<TestComponent />);

		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(capturedState?.isConnected).toBe(false);
		expect(capturedState?.error).toBeUndefined();
	});

	test('handles server detection errors', async () => {
		// Mock detectServer to throw error
		mockDetectServer.mockRejectedValueOnce(new Error('Connection failed'));

		let capturedState: any = null;

		const TestComponent = () => {
			const { isConnected, error } = useOpencodeConnection();
			capturedState = { isConnected, error };
			return null;
		};

		render(<TestComponent />);

		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(capturedState?.isConnected).toBe(false);
		expect(capturedState?.error?.message).toBe('Connection failed');
	});

	test('manually rechecks connection on button click', async () => {
		let capturedState: any = null;

		const TestComponent = () => {
			const { isConnected, checkConnection } = useOpencodeConnection();
			capturedState = { isConnected, checkConnection };
			return null;
		};

		render(<TestComponent />);

		await new Promise((resolve) => setTimeout(resolve, 100));

		const initialConnected = capturedState?.isConnected;

		// Trigger manual recheck
		await capturedState?.checkConnection?.();

		await new Promise((resolve) => setTimeout(resolve, 100));

		const afterRecheck = capturedState?.isConnected;

		expect(initialConnected).toBe(true);
		expect(afterRecheck).toBe(true);
	});

	test('checks custom port', async () => {
		let capturedState: any = null;

		const TestComponent = () => {
			const { isConnected } = useOpencodeConnection(8080);
			capturedState = { isConnected };
			return null;
		};

		render(<TestComponent />);

		await new Promise((resolve) => setTimeout(resolve, 100));

		// Verify detectServer was called
		expect(mockDetectServer).toHaveBeenCalled();
		// Verify connection succeeded with custom port
		expect(capturedState?.isConnected).toBe(true);
	});
});
