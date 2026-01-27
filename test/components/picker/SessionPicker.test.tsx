import { render } from 'ink-testing-library';
import { describe, expect, test, vi } from 'bun:test';
import type { SessionInfo } from '../../../src/lib/opencode.ts';
import { SessionPicker } from '../../../src/components/picker/SessionPicker.tsx';

// Mock sessions
const mockSessions: SessionInfo[] = [
	{
		id: 's1',
		lastCommand: 'Working on Phase 1',
		directory: '/Users/dan/src/gsd-console',
		updatedAt: Date.now() - 1000, // 1 second ago
	},
	{
		id: 's2',
		lastCommand: 'Different project',
		directory: '/Users/dan/other',
		updatedAt: Date.now() - 3600000, // 1 hour ago
	},
	{
		id: 's3',
		lastCommand: 'Session with no timestamp',
		directory: '/Users/dan/third',
		updatedAt: undefined,
	},
];

describe('SessionPicker', () => {
	test('renders session list with titles', () => {
		const { lastFrame } = render(
			<SessionPicker
				sessions={mockSessions}
				onSelect={() => {}}
				onSpawnNew={() => {}}
				onClose={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('Select Session');
		expect(lastFrame()).toContain('Working on Phase 1');
		expect(lastFrame()).toContain('Different project');
	});

	test('shows working directory for each session', () => {
		const { lastFrame } = render(
			<SessionPicker
				sessions={mockSessions}
				onSelect={() => {}}
				onSpawnNew={() => {}}
				onClose={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('/Users/dan/src/gsd-console');
		expect(lastFrame()).toContain('/Users/dan/other');
		expect(lastFrame()).toContain('/Users/dan/third');
	});

	test('shows recent indicator for recently updated sessions', () => {
		const { lastFrame } = render(
			<SessionPicker
				sessions={mockSessions}
				onSelect={() => {}}
				onSpawnNew={() => {}}
				onClose={() => {}}
			/>,
		);

		// Session updated 1 second ago should have green indicator
		expect(lastFrame()).toContain('●');
		// Session updated 1 hour ago should have gray indicator
		expect(lastFrame()).toContain('○');
	});

	test('shows relative time for sessions', () => {
		const { lastFrame } = render(
			<SessionPicker
				sessions={mockSessions}
				onSelect={() => {}}
				onSpawnNew={() => {}}
				onClose={() => {}}
			/>,
		);

		// Recent session should show minutes/hours/days
		// Updated 1 second ago -> "now" (but likely shows "0m" or similar)
		expect(lastFrame()).toMatch(/\d+[mh]/);
	});

	test('triggers onSelect on Enter key', () => {
		const mockOnSelect = vi.fn();

		const { stdin } = render(
			<SessionPicker
				sessions={mockSessions}
				onSelect={mockOnSelect}
				onSpawnNew={() => {}}
				onClose={() => {}}
			/>,
		);

		// Press Enter to select
		stdin.write('\r');

		expect(mockOnSelect).toHaveBeenCalledWith('s1');
	});

	test('triggers onClose on Escape key', () => {
		const mockOnClose = vi.fn();

		const { stdin } = render(
			<SessionPicker
				sessions={mockSessions}
				onSelect={() => {}}
				onSpawnNew={() => {}}
				onClose={mockOnClose}
			/>,
		);

		// Press Escape to close
		stdin.write('\x1B');

		expect(mockOnClose).toHaveBeenCalled();
	});

	test('shows "No sessions available" message when empty', () => {
		const { lastFrame } = render(
			<SessionPicker
				sessions={[]}
				onSelect={() => {}}
				onSpawnNew={() => {}}
				onClose={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('No OpenCode sessions found');
		expect(lastFrame()).toContain('Press Enter to spawn a new session');
	});

	test('shows loading state when isLoading is true', () => {
		const { lastFrame } = render(
			<SessionPicker
				sessions={[]}
				onSelect={() => {}}
				onSpawnNew={() => {}}
				onClose={() => {}}
				isLoading={true}
			/>,
		);

		expect(lastFrame()).toContain('Loading sessions...');
	});

	test('shows footer with navigation hints', () => {
		const { lastFrame } = render(
			<SessionPicker
				sessions={mockSessions}
				onSelect={() => {}}
				onSpawnNew={() => {}}
				onClose={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('j/k: navigate');
		expect(lastFrame()).toContain('Enter: select');
		expect(lastFrame()).toContain('Esc: close');
	});

	test('shows recent/older legend in footer', () => {
		const { lastFrame } = render(
			<SessionPicker
				sessions={mockSessions}
				onSelect={() => {}}
				onSpawnNew={() => {}}
				onClose={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('● recent');
		expect(lastFrame()).toContain('○ older');
	});

	test('limits visible sessions to MAX_VISIBLE_ITEMS', () => {
		// Create more than MAX_VISIBLE_ITEMS (8) sessions
		const manySessions: SessionInfo[] = Array.from({ length: 10 }, (_, i) => ({
			id: `s${i}`,
			title: `Session ${i}`,
			directory: `/path/to/session/${i}`,
			updatedAt: Date.now() - i * 60000,
		}));

		const { lastFrame } = render(
			<SessionPicker
				sessions={manySessions}
				onSelect={() => {}}
				onSpawnNew={() => {}}
				onClose={() => {}}
			/>,
		);

		// Should show "and X more sessions" message
		expect(lastFrame()).toContain('... and 2 more sessions');
	});

	test('shows session ID or title in list', () => {
		const { lastFrame } = render(
			<SessionPicker
				sessions={mockSessions}
				onSelect={() => {}}
				onSpawnNew={() => {}}
				onClose={() => {}}
			/>,
		);

		// Should show title when available
		expect(lastFrame()).toContain('Working on Phase 1');
	});

	test('truncates long session titles', () => {
		const longTitleSessions: SessionInfo[] = [
			{
				id: 's1',
				lastCommand: 'Very long session title that should be truncated at some point because it exceeds the maximum display length',
				directory: '/Users/dan/src/gsd-console',
				updatedAt: Date.now(),
			},
		];

		const { lastFrame } = render(
			<SessionPicker
				sessions={longTitleSessions}
				onSelect={() => {}}
				onSpawnNew={() => {}}
				onClose={() => {}}
			/>,
		);

		// Title should be truncated with "..."
		expect(lastFrame()).toContain('...');
	});
});
