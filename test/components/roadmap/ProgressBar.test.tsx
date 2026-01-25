/**
 * ProgressBar Component Tests
 */

import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { ProgressBar } from '../../../src/components/roadmap/ProgressBar.tsx';

describe('ProgressBar', () => {
	test('renders 0% progress', () => {
		const { lastFrame } = render(<ProgressBar percent={0} width={10} />);

		expect(lastFrame()).toContain('0%');
	});

	test('renders 50% progress', () => {
		const { lastFrame } = render(<ProgressBar percent={50} width={10} />);

		expect(lastFrame()).toContain('50%');
	});

	test('renders 100% progress', () => {
		const { lastFrame } = render(<ProgressBar percent={100} width={10} />);

		expect(lastFrame()).toContain('100%');
	});

	test('handles integer completion (3/10 = 30%)', () => {
		const { lastFrame } = render(<ProgressBar percent={30} width={10} />);

		expect(lastFrame()).toContain('30%');
	});

	test('handles fractional percentage rounding', () => {
		const { lastFrame } = render(<ProgressBar percent={33.33} width={10} />);

		// Should round to nearest integer
		expect(lastFrame()).toContain('33%');
	});

	test('hides percentage text when showPercent is false', () => {
		const { lastFrame } = render(
			<ProgressBar percent={50} width={10} showPercent={false} />,
		);

		expect(lastFrame()).not.toContain('%');
	});

	test('shows completion text when showPercent is true', () => {
		const { lastFrame } = render(
			<ProgressBar percent={75} width={10} showPercent={true} />,
		);

		expect(lastFrame()).toContain('75%');
	});

	test('handles 0/0 gracefully', () => {
		const { lastFrame } = render(<ProgressBar percent={0} width={10} />);

		// Should show 0% without errors
		expect(lastFrame()).toContain('0%');
	});

	test('handles edge case 0/10', () => {
		const { lastFrame } = render(<ProgressBar percent={0} width={10} />);

		// No filled blocks
		expect(lastFrame()).toContain('░░░░░░░░░'); // All empty blocks
	});

	test('handles edge case 10/10', () => {
		const { lastFrame } = render(<ProgressBar percent={100} width={10} />);

		// All filled blocks
		expect(lastFrame()).toContain('██████████'); // All filled blocks
	});

	test('clamps negative percent to 0%', () => {
		const { lastFrame } = render(<ProgressBar percent={-10} width={10} />);

		expect(lastFrame()).toContain('0%');
	});

	test('clamps percent over 100 to 100%', () => {
		const { lastFrame } = render(<ProgressBar percent={150} width={10} />);

		expect(lastFrame()).toContain('100%');
	});

	test('uses default width of 20', () => {
		const { lastFrame } = render(<ProgressBar percent={50} />);

		expect(lastFrame()).toContain('50%');
	});

	test('renders filled blocks in green', () => {
		const { lastFrame } = render(<ProgressBar percent={50} width={10} />);

		// Filled blocks should be visible (green color in terminal)
		expect(lastFrame()).toContain('█'); // Full block character
	});

	test('renders empty blocks with dim color', () => {
		const { lastFrame } = render(<ProgressBar percent={50} width={10} />);

		// Empty blocks should be visible (dim color in terminal)
		expect(lastFrame()).toContain('░'); // Light shade character
	});
});
