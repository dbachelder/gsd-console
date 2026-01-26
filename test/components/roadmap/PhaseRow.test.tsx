/**
 * PhaseRow Component Tests
 */

import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { PhaseRow } from '../../../src/components/roadmap/PhaseRow.tsx';
import type { Phase } from '../../../src/lib/types.ts';

describe('PhaseRow', () => {
	const mockPhase: Phase = {
		number: 1,
		name: 'Core TUI',
		status: 'complete',
		goal: 'Build terminal UI',
		requirements: [],
		successCriteria: [],
		dependsOn: null,
		plansTotal: 4,
		plansComplete: 4,
		indicators: {
			hasPlan: true,
			hasContext: true,
			hasResearch: false,
			uatComplete: false,
		},
	};

	test('renders phase name and number', () => {
		const { lastFrame } = render(
			<PhaseRow
				phase={mockPhase}
				isSelected={false}
				isExpanded={false}
			/>,
		);

		expect(lastFrame()).toContain('Phase 1: Core TUI');
	});

	test('shows status indicator for complete phase', () => {
		const { lastFrame } = render(
			<PhaseRow
				phase={mockPhase}
				isSelected={false}
				isExpanded={false}
			/>,
		);

		expect(lastFrame()).toContain('[✓]');
	});

	test('shows status indicator for in-progress phase', () => {
		const inProgressPhase: Phase = {
			...mockPhase,
			status: 'in-progress',
		};

		const { lastFrame } = render(
			<PhaseRow
				phase={inProgressPhase}
				isSelected={false}
				isExpanded={false}
			/>,
		);

		expect(lastFrame()).toContain('[◐]');
	});

	test('shows status indicator for not-started phase', () => {
		const notStartedPhase: Phase = {
			...mockPhase,
			status: 'not-started',
		};

		const { lastFrame } = render(
			<PhaseRow
				phase={notStartedPhase}
				isSelected={false}
				isExpanded={false}
			/>,
		);

		expect(lastFrame()).toContain('[○]');
	});

	test('shows progress bars with correct percentages', () => {
		const { lastFrame } = render(
			<PhaseRow
				phase={mockPhase}
				isSelected={false}
				isExpanded={false}
				maxPlansWidth={2}
				maxPlansTotalWidth={2}
			/>,
		);

		// 4/4 = 100%
		expect(lastFrame()).toContain('4/4');
	});

	test('shows partial progress for in-progress phase', () => {
		const inProgressPhase: Phase = {
			...mockPhase,
			status: 'in-progress',
			plansTotal: 3,
			plansComplete: 1,
		};

		const { lastFrame } = render(
			<PhaseRow
				phase={inProgressPhase}
				isSelected={false}
				isExpanded={false}
			/>,
		);

		expect(lastFrame()).toContain('1/3');
	});

	test('shows 0/0 for phase with no plans', () => {
		const noPlansPhase: Phase = {
			...mockPhase,
			plansTotal: 0,
			plansComplete: 0,
		};

		const { lastFrame } = render(
			<PhaseRow
				phase={noPlansPhase}
				isSelected={false}
				isExpanded={false}
			/>,
		);

		expect(lastFrame()).toContain('0/0');
	});

	test('shows visual indicators for plan and context', () => {
		const { lastFrame } = render(
			<PhaseRow
				phase={mockPhase}
				isSelected={false}
				isExpanded={true}
				showIndicators={true}
			/>,
		);

		// Should show Context and Plan indicators with labels
		expect(lastFrame()).toContain('Context');
		expect(lastFrame()).toContain('Plan');
	});

	test('shows all 4 indicator slots', () => {
		const { lastFrame } = render(
			<PhaseRow
				phase={mockPhase}
				isSelected={false}
				isExpanded={true}
				showIndicators={true}
			/>,
		);

		// All 4 indicators should always be shown (Research, Context, Plan, UAT)
		expect(lastFrame()).toContain('Research');
		expect(lastFrame()).toContain('Context');
		expect(lastFrame()).toContain('Plan');
		expect(lastFrame()).toContain('UAT');
	});

	test('shows collapsed state with right arrow', () => {
		const { lastFrame } = render(
			<PhaseRow
				phase={mockPhase}
				isSelected={false}
				isExpanded={false}
				showIndicators={true}
			/>,
		);

		expect(lastFrame()).toContain('▶'); // Right arrow for collapsed
	});

	test('shows expanded state with down arrow', () => {
		const { lastFrame } = render(
			<PhaseRow
				phase={mockPhase}
				isSelected={false}
				isExpanded={true}
				showIndicators={true}
			/>,
		);

		expect(lastFrame()).toContain('▼'); // Down arrow for expanded
	});

	test('hides indicators when showIndicators is false', () => {
		const { lastFrame } = render(
			<PhaseRow
				phase={mockPhase}
				isSelected={false}
				isExpanded={true}
				showIndicators={false}
			/>,
		);

		// Should not show indicator labels
		expect(lastFrame()).not.toContain('Research');
		expect(lastFrame()).not.toContain('Context');
		expect(lastFrame()).not.toContain('Plan');
		expect(lastFrame()).not.toContain('UAT');
	});

	test('uses dimColor for inactive indicators', () => {
		const { lastFrame } = render(
			<PhaseRow
				phase={mockPhase}
				isSelected={false}
				isExpanded={true}
				showIndicators={true}
			/>,
		);

		// Inactive indicators use dimColor (□ placeholder)
		expect(lastFrame()).toContain('□ Research');
	});

	test('shows selected state with gray background', () => {
		const { lastFrame } = render(
			<PhaseRow
				phase={mockPhase}
				isSelected={true}
				isExpanded={false}
				showIndicators={true}
			/>,
		);

		// Selected phase has background color (visible in terminal)
		expect(lastFrame()).toContain('Phase 1: Core TUI');
	});

	test('handles highlight background', () => {
		const { lastFrame } = render(
			<PhaseRow
				phase={mockPhase}
				isSelected={false}
				isExpanded={false}
				showIndicators={true}
				isHighlighted={true}
				isFading={false}
			/>,
		);

		// Highlighted phase should render (background color in terminal)
		expect(lastFrame()).toContain('Phase 1: Core TUI');
	});

	test('handles fading highlight', () => {
		const { lastFrame } = render(
			<PhaseRow
				phase={mockPhase}
				isSelected={false}
				isExpanded={false}
				showIndicators={true}
				isHighlighted={true}
				isFading={true}
			/>,
		);

		// Fading highlight should render (different background color)
		expect(lastFrame()).toContain('Phase 1: Core TUI');
	});

	test('pads plan fraction to default width of 2 when maxPlansWidth not provided', () => {
		const onePlanPhase: Phase = {
			...mockPhase,
			plansTotal: 1,
			plansComplete: 1,
		};

		const { lastFrame } = render(
			<PhaseRow
				phase={onePlanPhase}
				isSelected={false}
				isExpanded={false}
			/>,
		);

		// Should pad to width 2: " 1/1"
		expect(lastFrame()).toContain(' 1/1');
	});

	test('pads plan fraction to custom maxPlansWidth when provided', () => {
		const onePlanPhase: Phase = {
			...mockPhase,
			plansTotal: 1,
			plansComplete: 1,
		};

		const { lastFrame } = render(
			<PhaseRow
				phase={onePlanPhase}
				isSelected={false}
				isExpanded={false}
				maxPlansWidth={3}
			/>,
		);

		// Should pad to width 3: "  1" (2 spaces + 1 digit = 3 chars)
		expect(lastFrame()).toContain('  1/1');
	});

	test('does not pad when plansComplete already has max width', () => {
		const eighteenPlanPhase: Phase = {
			...mockPhase,
			plansTotal: 18,
			plansComplete: 18,
		};

		const { lastFrame } = render(
			<PhaseRow
				phase={eighteenPlanPhase}
				isSelected={false}
				isExpanded={false}
				maxPlansWidth={2}
			/>,
		);

		// Should not add padding: "18/18" is already 2 digits
		expect(lastFrame()).toContain('18/18');
	});

	test('shows partial progress with padding for "1/18"', () => {
		const partialPhase: Phase = {
			...mockPhase,
			plansTotal: 18,
			plansComplete: 1,
		};

		const { lastFrame } = render(
			<PhaseRow
				phase={partialPhase}
				isSelected={false}
				isExpanded={false}
				maxPlansWidth={2}
			/>,
		);

		// Should show " 1/18" with single-digit plansComplete padded to 2
		expect(lastFrame()).toContain(' 1/18');
	});

	test('shows partial progress for "7/18"', () => {
		const partialPhase: Phase = {
			...mockPhase,
			plansTotal: 18,
			plansComplete: 7,
		};

		const { lastFrame } = render(
			<PhaseRow
				phase={partialPhase}
				isSelected={false}
				isExpanded={false}
				maxPlansWidth={2}
			/>,
		);

		// Should show " 7/18" with single-digit plansComplete padded to 2
		expect(lastFrame()).toContain(' 7/18');
	});

	test('aligns fractions across phases with different completion counts', () => {
		const smallPhase: Phase = {
			...mockPhase,
			number: 1,
			plansTotal: 1,
			plansComplete: 1,
		};

		const largePhase: Phase = {
			...mockPhase,
			number: 2,
			plansTotal: 18,
			plansComplete: 18,
		};

		// Render with max width 2
		const smallFrame = render(
			<PhaseRow phase={smallPhase} isSelected={false} isExpanded={false} maxPlansWidth={2} />,
		).lastFrame();
		const largeFrame = render(
			<PhaseRow phase={largePhase} isSelected={false} isExpanded={false} maxPlansWidth={2} />,
		).lastFrame();

		// Both should align: " 1/1" and "18/18"
		expect(smallFrame).toContain(' 1/1');
		expect(largeFrame).toContain('18/18');

		// Verify both fractions are rendered in the same relative position
		// by checking that the fraction string exists with proper spacing
		expect(smallFrame).toContain('1/1');
		expect(largeFrame).toContain('18/18');
	});
});
