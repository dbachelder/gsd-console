import { beforeEach, describe, expect, test, vi } from 'bun:test';
import { fs } from 'memfs';
import { vol } from '../setup.ts';

// Mock filesystem modules BEFORE importing parser
vi.mock('node:fs', () => fs);
vi.mock('node:fs/promises', () => fs.promises);

// Import parser AFTER mocks are configured
import { parseState, parseTodos, parseRoadmap, readPlanningFile } from '../../src/lib/parser.ts';
import type { Phase, ProjectState } from '../../src/lib/types.ts';

/*
 * FAILING PARSER TESTS DOCUMENTATION
 *
 * Test failures identified for Plan 05-12:
 *
 * 1. Line 154 - "extracts success criteria from numbered list"
 *    - Expected: ['User sees roadmap', 'User can expand phases', 'Todos display correctly']
 *    - Actual: []
 *    - Issue: Regex pattern doesn't match "**Success Criteria**" format in ROADMAP.md
 *
 * 2. Line 170 - "extracts plans total count"
 *    - Expected: 4
 *    - Actual: 0
 *    - Issue: Regex pattern doesn't match "**Plans**: 4 plans" format in ROADMAP.md
 *
 * 3. Line 248 - "counts completed plans from SUMMARY files"
 *    - Expected: plansTotal = 3
 *    - Actual: 0
 *    - Issue: Same plans count regex issue
 *
 * 4. Line 273 - "status is complete when all plans done"
 *    - Expected: "complete"
 *    - Actual: "in-progress"
 *    - Issue: Status logic depends on plansTotal being 0, so phase never reaches "complete"
 *
 * Root cause: Parser regex patterns in parser.ts don't include ** bold markers.
 * ROADMAP.md format: "**Plans**: 4 plans", "**Success Criteria** (what must be TRUE):"
 * Parser patterns: "Plans: 4 plans", "Success Criteria:" (missing ** markers)
 */

describe('parseState', () => {
	test('extracts phase information', () => {
		const content = String.raw`
Phase: 2 of 4 (Core TUI)
Progress: [##########] 50%
Last activity: 2025-01-24 - Completed 01-01-PLAN.md
`;
		const state = parseState(content);
		expect(state.currentPhase).toBe(2);
		expect(state.totalPhases).toBe(4);
		expect(state.progressPercent).toBe(50);
		expect(state.lastActivity).toContain('2025-01-24');
	});

	test('handles missing data gracefully', () => {
		const state = parseState('');
		expect(state.currentPhase).toBe(1);
		expect(state.totalPhases).toBe(4);
		expect(state.progressPercent).toBe(0);
	});

	test('extracts core value and project name', () => {
		const content = String.raw`
**Core value:** See project status without leaving coding context
**Current focus:** Phase 4 - OpenCode Integration
`;
		const state = parseState(content);
		expect(state.coreValue).toBe('See project status without leaving coding context');
		expect(state.projectName).toBe('OpenCode Integration');
	});
});

describe('parseTodos', () => {
	beforeEach(() => {
		vol.reset();
	});

	test('extracts todos from pending and done directories', () => {
		vol.fromJSON({
			'.planning/todos/pending/001-todo.md': '---\ntitle: First todo\narea: testing\n---\n',
			'.planning/todos/pending/002-todo.md': '---\ntitle: Another todo\n---\n',
			'.planning/todos/done/003-done.md': '---\ntitle: Completed task\narea: docs\n---\n',
		});

		const todos = parseTodos('', '.planning');
		expect(todos.length).toBe(3);
		expect(todos[0]?.text).toBe('First todo (testing)');
		expect(todos[0]?.completed).toBe(false);
		expect(todos[1]?.text).toBe('Another todo');
		expect(todos[1]?.completed).toBe(false);
		expect(todos[2]?.text).toBe('Completed task (docs)');
		expect(todos[2]?.completed).toBe(true);
	});

	test('handles empty todos directory', () => {
		vol.fromJSON({
			'.planning/todos/pending/.gitkeep': '',
			'.planning/todos/done/.gitkeep': '',
		});

		const todos = parseTodos('', '.planning');
		expect(todos.length).toBe(0);
	});

	test('uses default .planning directory when no planningDir specified', () => {
		vol.fromJSON({
			'.planning/todos/pending/001-todo.md': '---\ntitle: Default dir todo\n---\n',
		});

		const todos = parseTodos('');
		expect(todos.length).toBe(1);
		expect(todos[0]?.text).toBe('Default dir todo');
	});

	test('handles todos without area field', () => {
		vol.fromJSON({
			'.planning/todos/pending/001-todo.md': '---\ntitle: Todo without area\n---\n',
		});

		const todos = parseTodos('', '.planning');
		expect(todos[0]?.text).toBe('Todo without area');
		expect(todos[0]?.completed).toBe(false);
	});
});

describe('parseRoadmap', () => {
	beforeEach(() => {
		vol.reset();
	});

	test('extracts phase name, number, and goal', () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI
**Goal**: Build terminal UI`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/01-core-tui/.gitkeep': '',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases).toHaveLength(1);
		expect(phases[0]?.number).toBe(1);
		expect(phases[0]?.name).toBe('Core TUI');
		expect(phases[0]?.goal).toBe('Build terminal UI');
	});

	test('extracts depends on field', () => {
		const roadmapContent = String.raw`### Phase 2: Real-time Updates
**Depends on**: Phase 1`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/02-updates/.gitkeep': '',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases[0]?.dependsOn).toBe('Phase 1');
	});

	test('extracts requirements array', () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI
**Requirements**: DISP-01, DISP-02, NAV-01`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/01-core-tui/.gitkeep': '',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases[0]?.requirements).toEqual(['DISP-01', 'DISP-02', 'NAV-01']);
	});

	test('extracts success criteria from numbered list', () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI
**Success Criteria** (what must be TRUE):
  1. User sees roadmap
  2. User can expand phases
  3. Todos display correctly`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/01-core-tui/.gitkeep': '',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases[0]?.successCriteria).toEqual([
			'User sees roadmap',
			'User can expand phases',
			'Todos display correctly',
		]);
	});

	test('extracts plans total count', () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI
**Plans**: 4 plans`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/01-core-tui/.gitkeep': '',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases[0]?.plansTotal).toBe(4);
	});

	test('handles decimal phase numbers', () => {
		const roadmapContent = String.raw`### Phase 3.1: UI Polish
**Goal**: Fix UI issues`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/03.1-polish/.gitkeep': '',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases).toHaveLength(1);
		expect(phases[0]?.number).toBe(3.1);
		expect(phases[0]?.name).toBe('UI Polish');
	});

	test('handles multiple phases', () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI
**Goal**: Build TUI

### Phase 2: Updates
**Goal**: File watching`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/01-core-tui/.gitkeep': '',
			'.planning/phases/02-updates/.gitkeep': '',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases).toHaveLength(2);
		expect(phases[0]?.name).toBe('Core TUI');
		expect(phases[1]?.name).toBe('Updates');
	});

	test('normalizes "Nothing (first phase)" depends on to null', () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI
**Depends on**: Nothing (first phase)`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/01-core-tui/.gitkeep': '',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases[0]?.dependsOn).toBeNull();
	});

	test('sets indicators by scanning phase directory', () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/01-core-tui/PLAN.md': '# Plan',
			'.planning/phases/01-core-tui/CONTEXT.md': '# Context',
			'.planning/phases/01-core-tui/RESEARCH.md': '# Research',
			'.planning/phases/01-core-tui/01-UAT.md': '---\nstatus: passed\n---',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases[0]?.indicators).toEqual({
			hasContext: true,
			hasPlan: true,
			hasResearch: true,
			uatComplete: true,
		});
	});

	test('counts completed plans from SUMMARY files', () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI
**Plans**: 3 plans`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/01-core-tui/01-01-SUMMARY.md': '# Summary',
			'.planning/phases/01-core-tui/01-02-SUMMARY.md': '# Summary',
			'.planning/phases/01-core-tui/01-03-PLAN.md': '# Plan',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases[0]?.plansComplete).toBe(2);
		expect(phases[0]?.plansTotal).toBe(3);
	});

	test('determines phase status based on progress', () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI
**Plans**: 3 plans`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/01-core-tui/01-01-PLAN.md': '# Plan',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases[0]?.status).toBe('in-progress');
	});

	test('status is complete when all plans done', () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI
**Plans**: 2 plans`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/01-core-tui/01-01-SUMMARY.md': '# Summary',
			'.planning/phases/01-core-tui/01-02-SUMMARY.md': '# Summary',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases[0]?.status).toBe('complete');
	});

	test('status is not-started with no progress', () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/01-core-tui/.gitkeep': '',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases[0]?.status).toBe('not-started');
	});

	test('handles missing phase directory gracefully', () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases).toHaveLength(1);
		expect(phases[0]?.indicators).toEqual({
			hasContext: false,
			hasPlan: false,
			hasResearch: false,
			uatComplete: false,
		});
	});

	test('handles empty success criteria', () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI
**Goal**: Build TUI
**Success Criteria** (what must be TRUE):
No criteria yet.`;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/01-core-tui/.gitkeep': '',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		// Should not crash, success criteria should be empty array or minimal
		expect(phases[0]?.successCriteria).toBeDefined();
	});

	test('handles empty requirements', () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI
**Requirements**: `;
		vol.fromJSON({
			'.planning/ROADMAP.md': roadmapContent,
			'.planning/phases/01-core-tui/.gitkeep': '',
		});

		const phases = parseRoadmap(roadmapContent, '.planning/phases');
		expect(phases[0]?.requirements).toEqual([]);
	});
});

describe('readPlanningFile', () => {
	beforeEach(() => {
		vol.reset();
	});

	test('reads and parses file with frontmatter', () => {
		vol.fromJSON({
			'.planning/test.md': '---\ntitle: Test\ntag: example\n---\nContent here',
		});

		const { content, data } = readPlanningFile('.planning/test.md');
		expect(data.title).toBe('Test');
		expect(data.tag).toBe('example');
		expect(content).toBe('Content here');
	});

	test('handles missing file gracefully', () => {
		const { content, data } = readPlanningFile('.planning/nonexistent.md');
		expect(content).toBe('');
		expect(data).toEqual({});
	});

	test('handles malformed frontmatter gracefully', () => {
		vol.fromJSON({
			'.planning/bad.md': 'No frontmatter here\nJust content',
		});

		const { content, data } = readPlanningFile('.planning/bad.md');
		// Should not crash, may return content without data
		expect(content).toBeDefined();
	});
});

describe("parsePlanFiles", () => {
	beforeEach(() => {
		vol.reset();
	});

	test("reads plan files from phase directory", () => {
		const roadmapContent = String.raw`### Phase 1: Core TUI
Plans: 1 plan

Plans:
- [ ] 01-01-PLAN.md - Test`;

		vol.fromJSON({
			".planning/ROADMAP.md": roadmapContent,
			".planning/phases/01-core-tui/01-01-PLAN.md": "---\nplan: 1\n---\n",
		});

		const plans = parsePlanFiles(".planning/phases/01-core-tui", 1, ".planning");

		expect(plans).toHaveLength(1);
		expect(plans[0]?.id).toBe("01");
		expect(plans[0]?.summary).toBe("Test plan");
	});
});
