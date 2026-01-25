/**
 * RequirementsList Component Tests
 * Tests for requirements display component.
 */

import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { RequirementsList } from '../../../src/components/phase/RequirementsList.tsx';

describe('RequirementsList', () => {
	test('renders requirement IDs', () => {
		const requirements = ['DISP-01', 'DISP-02', 'NAV-01'];
		const { lastFrame } = render(
			<RequirementsList requirements={requirements} />,
		);

		expect(lastFrame()).toContain('Requirements:');
		expect(lastFrame()).toContain('DISP-01');
		expect(lastFrame()).toContain('DISP-02');
		expect(lastFrame()).toContain('NAV-01');
	});

	test('shows comma-separated list', () => {
		const requirements = ['DISP-01', 'DISP-02', 'NAV-01'];
		const { lastFrame } = render(
			<RequirementsList requirements={requirements} />,
		);

		const output = lastFrame() ?? '';
		// Check that requirements are separated with commas
		const indexDisp01 = output.indexOf('DISP-01');
		const indexDisp02 = output.indexOf('DISP-02');
		const indexNav01 = output.indexOf('NAV-01');

		expect(indexDisp01).toBeLessThan(indexDisp02);
		expect(indexDisp02).toBeLessThan(indexNav01);

		// Check for comma separators
		expect(output.substring(indexDisp01, indexDisp02)).toContain(',');
		expect(output.substring(indexDisp02, indexNav01)).toContain(',');
	});

	test('handles empty requirements array', () => {
		const { lastFrame } = render(<RequirementsList requirements={[]} />);

		// Should not render anything
		expect(lastFrame()).toBe('');
	});

	test('handles single requirement', () => {
		const requirements = ['DISP-01'];
		const { lastFrame } = render(
			<RequirementsList requirements={requirements} />,
		);

		expect(lastFrame()).toContain('Requirements:');
		expect(lastFrame()).toContain('DISP-01');

		// No trailing comma for single item
		const output = lastFrame() ?? '';
		const lastDispIndex = output.lastIndexOf('DISP-01');
		const afterDisp = output.substring(lastDispIndex + 'DISP-01'.length);
		expect(afterDisp.startsWith(',')).toBe(false);
	});
});
