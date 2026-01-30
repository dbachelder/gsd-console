#!/usr/bin/env bun

/**
 * GSD Add Todo Command
 * Captures an idea or task as a todo from command line context.
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

interface ParsedArgs {
	title: string;
	files: string[];
	area: string;
}

/**
 * Parse command line arguments for the todo command.
 */
function parseTodoArgs(): ParsedArgs {
	const { values, positionals } = parseArgs({
		args: process.argv.slice(3),
		options: {
			files: { type: 'string' },
			area: { type: 'string' },
		},
		allowPositionals: true,
	});

	const title = positionals[0] || '';
	const files = values.files ? values.files.split(',').map((f: string) => f.trim()) : [];
	const area = values.area || '';

	return { title, files, area };
}

/**
 * Ensure todo directories exist.
 */
function ensureDirectories(): void {
	mkdirSync('.planning/todos/pending', { recursive: true });
	mkdirSync('.planning/todos/done', { recursive: true });
}

/**
 * Check existing areas for consistency.
 */
function getExistingAreas(): string[] {
	try {
		try {
			const files = execSync('ls .planning/todos/pending/*.md 2>/dev/null', { encoding: 'utf8' });
			if (!files.trim()) return [];

			return files
				.split('\n')
				.filter(Boolean)
				.map((file) => {
					try {
						const filePath = file.trim();
						if (!filePath) return '';

						const content = readFileSync(filePath, 'utf8');
						const match = content.match(/^area:\s*(.+)$/m);
						return match?.[1]?.trim() || '';
					} catch {
						return '';
					}
				})
				.filter(Boolean);
		} catch {
			return [];
		}
	} catch {
		return [];
	}
}

/**
 * Infer area from file paths.
 */
function inferArea(files: string[]): string {
	if (files.length === 0) return 'general';

	const pathPatterns: Record<string, string> = {
		'src/api/': 'api',
		'src/components/': 'ui',
		'src/ui/': 'ui',
		'src/auth/': 'auth',
		'auth/': 'auth',
		'src/db/': 'database',
		'database/': 'database',
		'tests/': 'testing',
		'__tests__/': 'testing',
		'docs/': 'docs',
		'.planning/': 'planning',
		'scripts/': 'tooling',
		'bin/': 'tooling',
	};

	for (const file of files) {
		for (const [pattern, area] of Object.entries(pathPatterns)) {
			if (file.includes(pattern)) {
				return area;
			}
		}
	}

	return 'general';
}

/**
 * Check for duplicate todos.
 */
async function checkDuplicates(title: string): Promise<'skip' | 'replace' | 'add'> {
	try {
		const keywords = title
			.toLowerCase()
			.split(' ')
			.filter((word) => word.length > 2);
		if (keywords.length === 0) return 'add';

		const grepPattern = keywords.join('\\|');
		const result = execSync(
			`grep -l -i "${grepPattern}" .planning/todos/pending/*.md 2>/dev/null`,
			{ encoding: 'utf8' },
		);

		if (result.trim()) {
			const existingFiles = result.trim().split('\n');
			if (existingFiles.length === 0) return 'add';

			const existingFile = existingFiles[0];
			if (!existingFile) return 'add';

			const content = readFileSync(existingFile, 'utf8');
			const titleMatch = content.match(/^title:\s*(.+)$/m);
			const existingTitle = titleMatch?.[1]?.trim() || 'Unknown';

			console.log(`⚠️  Similar todo exists: "${existingTitle}"`);
			console.log('What would you like to do?');
			console.log('1. Skip (keep existing todo)');
			console.log('2. Replace (update existing with new context)');
			console.log('3. Add anyway (create as separate todo)');

			// For CLI, default to 'add' since we can't prompt interactively
			return 'add';
		}
	} catch {
		// No duplicates found
	}

	return 'add';
}

/**
 * Generate slug from title.
 */
function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

/**
 * Create todo file.
 */
function createTodoFile(args: ParsedArgs): string {
	const timestamp = new Date().toISOString();
	const datePrefix = new Date().toISOString().split('T')[0];
	const slug = generateSlug(args.title);
	const filename = `${datePrefix}-${slug}.md`;
	const filepath = `.planning/todos/pending/${filename}`;

	const frontmatter = [
		'---',
		`created: ${timestamp}`,
		`title: ${args.title}`,
		`area: ${args.area}`,
		args.files.length > 0 ? `files:\n${args.files.map((f) => `  - ${f}`).join('\n')}` : '',
		'---',
		'',
	]
		.filter(Boolean)
		.join('\n');

	const content = [
		frontmatter,
		'## Problem',
		'',
		'Todo captured from command line context.',
		'',
		'## Solution',
		'',
		'TBD',
		'',
	].join('\n');

	writeFileSync(filepath, content, 'utf8');
	return filepath;
}

/**
 * Update STATE.md if it exists.
 */
function updateState(): void {
	const stateFile = '.planning/STATE.md';
	if (!existsSync(stateFile)) return;

	try {
		const content = readFileSync(stateFile, 'utf8');
		const todoCount = execSync('ls .planning/todos/pending/*.md 2>/dev/null | wc -l', {
			encoding: 'utf8',
		}).trim();

		const updatedContent = content.replace(
			/### Pending Todos\n\n\*\*Count:\*\* \d+/,
			`### Pending Todos\n\n**Count:** ${todoCount}`,
		);

		if (content !== updatedContent) {
			writeFileSync(stateFile, updatedContent, 'utf8');
		}
	} catch {
		// Skip if update fails
	}
}

/**
 * Check if planning docs should be committed.
 */
function shouldCommitPlanningDocs(): boolean {
	try {
		// Check if .planning is gitignored
		try {
			execSync('git check-ignore -q .planning', { stdio: 'ignore' });
			return false;
		} catch {
			// Not ignored, check config
		}

		const configFile = '.planning/config.json';
		if (existsSync(configFile)) {
			const config = JSON.parse(readFileSync(configFile, 'utf8'));
			return config.commit_docs !== false;
		}

		return true; // Default to true
	} catch {
		return true;
	}
}

/**
 * Commit todo and state to git.
 */
function commitTodo(filepath: string, title: string, area: string): void {
	if (!shouldCommitPlanningDocs()) {
		console.log('Todo saved (not committed - commit_docs: false)');
		return;
	}

	try {
		execSync(`git add "${filepath}"`, { stdio: 'ignore' });

		const stateFile = '.planning/STATE.md';
		if (existsSync(stateFile)) {
			execSync(`git add "${stateFile}"`, { stdio: 'ignore' });
		}

		const commitMessage = `docs: capture todo - ${title}\n\nArea: ${area}`;
		execSync(`git commit -m "${commitMessage}"`, { stdio: 'ignore' });

		console.log(`Committed: docs: capture todo - ${title}`);
	} catch (error) {
		console.log(
			'Todo saved but git commit failed:',
			error instanceof Error ? error.message : String(error),
		);
	}
}

/**
 * Main command implementation.
 */
export async function command(): Promise<void> {
	const args = parseTodoArgs();

	if (!args.title) {
		console.error('❌ Title is required');
		console.error('Usage: /gsd-add-todo "Todo title" [--files="path:lines"] [--area="area"]');
		process.exit(1);
	}

	// Ensure directories exist
	ensureDirectories();

	// Get existing areas for consistency
	const existingAreas = getExistingAreas();

	// Infer area if not provided
	const inferredArea = args.area || inferArea(args.files);
	const finalArea = existingAreas.includes(inferredArea) ? inferredArea : inferArea(args.files);

	// Check for duplicates
	const duplicateAction = await checkDuplicates(args.title);
	if (duplicateAction === 'skip') {
		console.log('Skipping todo creation');
		return;
	}

	// Create todo file
	const finalArgs = { ...args, area: finalArea };
	const filepath = createTodoFile(finalArgs);

	// Update state if needed
	updateState();

	// Commit to git
	commitTodo(filepath, args.title, finalArea);

	// Show confirmation
	console.log(`Todo saved: ${filepath}`);
	console.log('');
	console.log(`  ${args.title}`);
	console.log(`  Area: ${finalArea}`);
	console.log(`  Files: ${args.files.length} referenced`);
	console.log('');
	console.log('Would you like to:');
	console.log('1. Continue with current work');
	console.log('2. Add another todo');
	console.log('3. View all todos (/gsd-check-todos)');
}
