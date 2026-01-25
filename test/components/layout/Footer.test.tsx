/**
 * Footer Component Tests
 */

import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { Footer } from '../../../src/components/layout/Footer.tsx';

type TabId = 'roadmap' | 'phase' | 'todos' | 'background';

describe('Footer', () => {
	test('renders common hints', () => {
		const { lastFrame } = render(<Footer activeTab="roadmap" />);

		expect(lastFrame()).toContain('q');
		expect(lastFrame()).toContain('quit');
		expect(lastFrame()).toContain(':');
		expect(lastFrame()).toContain('commands');
		expect(lastFrame()).toContain('?');
		expect(lastFrame()).toContain('help');
	});

	test('renders roadmap-specific hints', () => {
		const { lastFrame } = render(<Footer activeTab="roadmap" />);

		expect(lastFrame()).toContain('↑↓');
		expect(lastFrame()).toContain('select');
		expect(lastFrame()).toContain('→');
		expect(lastFrame()).toContain('expand');
		expect(lastFrame()).toContain('e');
		expect(lastFrame()).toContain('edit');
	});

	test('renders phase-specific hints', () => {
		const { lastFrame } = render(<Footer activeTab="phase" />);

		expect(lastFrame()).toContain('↑↓');
		expect(lastFrame()).toContain('scroll');
		expect(lastFrame()).toContain('[/]');
		expect(lastFrame()).toContain('switch phase');
		expect(lastFrame()).toContain('e');
		expect(lastFrame()).toContain('edit');
	});

	test('renders todos-specific hints', () => {
		const { lastFrame } = render(<Footer activeTab="todos" />);

		expect(lastFrame()).toContain('↑↓');
		expect(lastFrame()).toContain('select');
		expect(lastFrame()).toContain('Space');
		expect(lastFrame()).toContain('toggle');
		expect(lastFrame()).toContain('e');
		expect(lastFrame()).toContain('edit');
	});

	test('renders background-specific hints', () => {
		const { lastFrame } = render(<Footer activeTab="background" />);

		expect(lastFrame()).toContain('↑↓');
		expect(lastFrame()).toContain('navigate');
		expect(lastFrame()).toContain('Enter');
		expect(lastFrame()).toContain('expand');
		expect(lastFrame()).toContain('x');
		expect(lastFrame()).toContain('cancel');
	});

	test('renders tab hints in tabbed mode', () => {
		const { lastFrame } = render(<Footer activeTab="roadmap" />);

		expect(lastFrame()).toContain('Tab');
		expect(lastFrame()).toContain('tabs');
	});

	test('omits tab hints in single view mode', () => {
		const { lastFrame } = render(<Footer activeTab="roadmap" onlyMode="roadmap" />);

		expect(lastFrame()).not.toContain('Tab');
	});

	test('renders connect hint in all modes', () => {
		const { lastFrame } = render(<Footer activeTab="roadmap" />);

		expect(lastFrame()).toContain('c');
		expect(lastFrame()).toContain('connect');
	});

	test('formats hints with separators', () => {
		const { lastFrame } = render(<Footer activeTab="roadmap" />);

		// Check that hints are separated by ' | '
		expect(lastFrame()).toContain('|');
	});
});
