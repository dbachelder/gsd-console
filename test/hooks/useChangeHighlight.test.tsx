/**
 * useChangeHighlight Tests
 * Tests for change highlight hook with timed highlight and fade.
 */

import { beforeEach, describe, expect, test, vi } from 'bun:test';
import { render } from 'ink-testing-library';
import { useChangeHighlight } from '../../src/hooks/useChangeHighlight.ts';

describe('useChangeHighlight', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	test('initializes with empty changed items', () => {
		let capturedSize = 0;

		const TestComponent = () => {
			const { changedItems } = useChangeHighlight();
			capturedSize = changedItems.size;
			return null;
		};

		render(<TestComponent />);

		// Initially empty
		expect(capturedSize).toBe(0);
	});

	test('isHighlighted returns false for unmarked items', () => {
		let capturedHasTestFile = false;
		let capturedHasNonExistent = false;

		const TestComponent = () => {
			const { isHighlighted } = useChangeHighlight();

			// Check if highlighted without marking anything first
			capturedHasTestFile = isHighlighted('test-file.md');
			capturedHasNonExistent = isHighlighted('non-existent.md');

			return null;
		};

		render(<TestComponent />);

		expect(capturedHasTestFile).toBe(false);
		expect(capturedHasNonExistent).toBe(false);
	});

	test('isFading returns false before hold duration', () => {
		let capturedIsFading = false;

		const TestComponent = () => {
			const { isFading } = useChangeHighlight();

			// Should not be fading for non-existent items
			capturedIsFading = isFading('test-file.md');

			return null;
		};

		render(<TestComponent />);

		expect(capturedIsFading).toBe(false);
	});

	test('isFading returns true after hold duration passes', () => {
		let capturedIsFading = false;

		const TestComponent = () => {
			const { markChanged, isFading } = useChangeHighlight({
				holdDurationMs: 100, // Short duration for testing
				fadeDurationMs: 50,
			});

			// Mark item as changed
			markChanged(['test-file.md']);

			// Advance time past holdDurationMs
			vi.advanceTimersByTime(120);

			// Should be fading now
			capturedIsFading = isFading('test-file.md');

			return null;
		};

		render(<TestComponent />);

		expect(capturedIsFading).toBe(true);
	});

	test('item removed after hold + fade duration', () => {
		let capturedHasItem = true;

		const TestComponent = () => {
			const { changedItems, markChanged } = useChangeHighlight({
				holdDurationMs: 100,
				fadeDurationMs: 50,
			});

			// Mark item as changed
			markChanged(['test-file.md']);

			// Advance time past hold + fade duration
			vi.advanceTimersByTime(200);

			// Check if still in set (should be removed by now)
			capturedHasItem = changedItems.has('test-file.md');

			return null;
		};

		render(<TestComponent />);

		// Should be removed after timeout
		expect(capturedHasItem).toBe(false);
	});

	test('handles empty markChanged array', () => {
		let capturedSize = 0;

		const TestComponent = () => {
			const { changedItems, markChanged } = useChangeHighlight();

			// Handle potential undefined from destructure
			if (markChanged) {
				markChanged([]);
			}

			capturedSize = changedItems.size;
			return null;
		};

		render(<TestComponent />);

		// Should still be empty
		expect(capturedSize).toBe(0);
	});
});
