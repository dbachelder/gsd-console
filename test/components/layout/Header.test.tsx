/**
 * Header Component Tests
 */

import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { Header } from '../../../src/components/layout/Header.tsx';
import type { ProjectState } from '../../../src/lib/types.ts';

describe('Header', () => {
	test('renders project name and progress', () => {
		const state: ProjectState = {
			currentPhase: 2,
			totalPhases: 4,
			projectName: 'GSD Project',
			coreValue: 'See and manage GSD project state',
			progressPercent: 50,
			lastActivity: '2026-01-25',
		};

		const { lastFrame } = render(<Header projectName="GSD Project" state={state} />);

		expect(lastFrame()).toContain('GSD Project');
		expect(lastFrame()).toContain('Phase ');
		expect(lastFrame()).toContain('2');
		expect(lastFrame()).toContain('4');
		expect(lastFrame()).toContain('50%');
	});

	test('handles 0% progress', () => {
		const state: ProjectState = {
			currentPhase: 1,
			totalPhases: 5,
			projectName: 'Test',
			coreValue: 'Test value',
			progressPercent: 0,
			lastActivity: '2026-01-25',
		};

		const { lastFrame } = render(<Header projectName="Test" state={state} />);

		expect(lastFrame()).toContain('Test');
		expect(lastFrame()).toContain('0%');
	});

	test('handles 100% progress', () => {
		const state: ProjectState = {
			currentPhase: 5,
			totalPhases: 5,
			projectName: 'Complete',
			coreValue: 'Complete value',
			progressPercent: 100,
			lastActivity: '2026-01-25',
		};

		const { lastFrame } = render(<Header projectName="Complete" state={state} />);

		expect(lastFrame()).toContain('Complete');
		expect(lastFrame()).toContain('100%');
	});

	test('renders spinner when refreshing', () => {
		const state: ProjectState = {
			currentPhase: 1,
			totalPhases: 4,
			projectName: 'Test',
			coreValue: 'Test value',
			progressPercent: 25,
			lastActivity: '2026-01-25',
		};

		const { lastFrame } = render(
			<Header projectName="Test" state={state} isRefreshing={true} />,
		);

		expect(lastFrame()).toContain('Test');
	});

	test('shows GSD Status label', () => {
		const state: ProjectState = {
			currentPhase: 1,
			totalPhases: 4,
			projectName: 'Test',
			coreValue: 'Test value',
			progressPercent: 25,
			lastActivity: '2026-01-25',
		};

		const { lastFrame } = render(<Header projectName="Test" state={state} />);

		expect(lastFrame()).toContain('GSD Status');
	});
});
