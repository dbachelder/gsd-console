#!/usr/bin/env -S bun run

/**
 * Test script for /gsd-add-todo command
 * Tests the command via OpenCode SDK API
 */

import { readFileSync, readdirSync, statSync, unlinkSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createOpencodeClient } from '@opencode-ai/sdk';

/** SDK client */
const client = createOpencodeClient({ baseUrl: 'http://127.0.0.1:4096' });

/** Backup of existing todos */
let backupDir: string | null = null;

/**
 * Backup existing todos to temporary directory
 */
function backupExistingTodos() {
	const todosDir = '.planning/todos/pending';
	
	try {
		const files = readdirSync(todosDir);
		if (files.length === 0 || (files.length === 1 && files[0] === '.gitkeep')) {
			console.log('No existing todos to backup');
			backupDir = null;
			return;
		}
		
		const backupDirPath = join(tmpdir(), `gsd-backup-${Date.now()}`);
		mkdirSync(backupDirPath, { recursive: true });
		
		for (const file of files) {
			if (file === '.gitkeep') continue;
			const srcPath = join(todosDir, file);
			const destPath = join(backupDirPath, file);
			
			const content = readFileSync(srcPath);
			writeFileSync(destPath, content);
		}
		
		backupDir = backupDirPath;
		console.log(`Backed up ${files.filter(f => f !== '.gitkeep').length} todos to:`, backupDirPath);
	} catch (error) {
		console.warn('Failed to backup existing todos:', error);
		backupDir = null;
	}
}

/**
 * Restore backed up todos and clean up test todos
 */
function restoreAndCleanup(testTodos: string[]) {
	const todosDir = '.planning/todos/pending';
	
	// Remove test todos
	for (const todo of testTodos) {
		try {
			unlinkSync(join(todosDir, todo));
			console.log('Removed test todo:', todo);
		} catch (error) {
			console.warn('Failed to remove test todo:', todo, error);
		}
	}
	
	// Restore backed up todos
	if (backupDir) {
		try {
			const files = readdirSync(backupDir);
			for (const file of files) {
				const srcPath = join(backupDir, file);
				const destPath = join(todosDir, file);
				
				const content = readFileSync(srcPath);
				writeFileSync(destPath, content);
			}
			console.log(`Restored ${files.length} todos from backup`);
			
			// Clean up backup directory
			rmSync(backupDir, { recursive: true, force: true });
		} catch (error) {
			console.warn('Failed to restore todos from backup:', error);
		}
	}
}

/**
 * Create a dedicated test session
 */
async function createTestSession() {
	try {
		console.log('Creating test session...');
		const sessionResponse = await client.session.create({
			body: { title: 'Test /gsd-add-todo command' },
			query: { directory: process.cwd() },
		});

		const sessionId = sessionResponse.data?.id;
		if (!sessionId) {
			console.error('Failed to create session - no ID in response');
			console.error('Response:', sessionResponse);
			process.exit(1);
		}
		console.log('Created session:', sessionId);
		return sessionId;
	} catch (error) {
		console.error('Failed to create session:', error);
		process.exit(1);
	}
}

/**
 * Load the gsd-add-todo command file
 */
function loadGsdAddTodoCommand() {
	try {
		const commandPath = join(process.env.HOME || '', '.config/opencode/command/gsd-add-todo.md');
		console.log('Loading command from:', commandPath);
		const commandContent = readFileSync(commandPath, 'utf-8');
		console.log(`Command content loaded (${commandContent.length} chars)`);

		const promptToSend = `<command-instruction>
${commandContent}
</command-instruction>`;

		return promptToSend;
	} catch (error) {
		console.error('Failed to load command file:', error);
		return null;
	}
}

/**
 * Send prompt to test session
 */
async function sendPrompt(sessionId: string, prompt: string, testTodo: string) {
	try {
		console.log('Sending prompt to session:', sessionId);
		const fullPrompt = `${prompt}\n\n${testTodo}`;

		console.log(`Prompt length: ${fullPrompt.length} chars`);
		console.log('Prompt preview:', fullPrompt.slice(0, 300) + '...\n');

		const response = await client.session.prompt({
			path: { id: sessionId },
			body: {
				parts: [{ type: 'text', text: fullPrompt }],
				model: { providerID: 'opencode', modelID: 'big-pickle' },
			},
		});

		console.log('Prompt sent successfully');
		console.log('Response status:', response.error ? 'ERROR' : 'SUCCESS');
		if (response.error) {
			console.error('Error details:', response.error);
		}
		return !response.error;
	} catch (error) {
		console.error('Failed to send prompt:', error);
		return false;
	}
}

/**
 * Poll session status
 */
async function pollSessionStatus(sessionId: string, maxSeconds = 30) {
	console.log(`Polling session status (max ${maxSeconds}s)...`);

	const startTime = Date.now();
	while (Date.now() - startTime < maxSeconds * 1000) {
		try {
			// List all sessions and find ours
			const response = await client.session.list();
			if (response.error) {
				console.error('Failed to list sessions:', response.error);
				break;
			}

			const session = response.data?.find((s: { id: string }) => s.id === sessionId);
			if (session) {
				console.log(`Session status: ${session.title} (updated: ${new Date(session.time.updated).toISOString()})`);
			}

			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (error) {
			console.error('Error polling session:', error);
		}
	}

	console.log('Polling complete');
}



/**
 * Check for new todo files after completion
 */
function checkForNewTodos(beforeFiles: string[]) {
	console.log('\nChecking for new todo files...');

	const todosDir = '.planning/todos/pending';
	const files = readdirSync(todosDir);

	console.log('Pending todos:', files);
	console.log('Before:', beforeFiles);
	console.log('After:', files);

	// Find new files
	const newFiles = files.filter((f) => !beforeFiles.includes(f));
	console.log('New files:', newFiles);

	if (newFiles.length === 0) {
		console.warn('No new todo files created!');
		return { newFiles: [], latestFile: null };
	}

	// Find latest file
	const latestFile = newFiles
		.map((f) => ({ file: f, time: statSync(join(todosDir, f)).mtimeMs }))
		.sort((a, b) => b.time - a.time)[0];

	if (latestFile) {
		console.log('Latest todo:', latestFile.file);
		const content = readFileSync(join(todosDir, latestFile.file), 'utf-8');
		console.log('Content:');
		console.log(content);
		return { newFiles, latestFile: latestFile.file };
	}

	return { newFiles, latestFile: null };
}

/**
 * Main test execution
 */
async function main() {
	console.log('=== Testing /gsd-add-todo command ===\n');

	// Check if server is running
	console.log('Checking OpenCode server...');
	try {
		const response = await client.session.list();
		if (response.error) {
			console.error('OpenCode server not responding');
			console.error('Make sure to run: opencode serve --port 4096');
			process.exit(1);
		}
		console.log('OpenCode server is running');
		console.log('Active sessions:', response.data?.length || 0, '\n');
	} catch (error) {
		console.error('Failed to connect to OpenCode server:', error);
		console.error('Make sure to run: opencode serve --port 4096');
		process.exit(1);
	}

	// Backup existing todos
	backupExistingTodos();
	console.log();

	// Record files before test
	const todosDir = '.planning/todos/pending';
	const beforeFiles = readdirSync(todosDir);
	console.log('Existing todos:', beforeFiles, '\n');

	// Create test session
	const sessionId = await createTestSession();
	console.log();

	// Load command
	const commandPrompt = loadGsdAddTodoCommand();
	if (!commandPrompt) {
		console.error('Failed to load command file');
		process.exit(1);
	}
	console.log();

	// Test todo from argument or default
	const testTodo = process.argv[2] || 'Test todo from script';
	console.log('Test todo:', testTodo, '\n');

	// Send prompt
	const promptSent = await sendPrompt(sessionId, commandPrompt, testTodo);
	if (!promptSent) {
		console.error('\nFailed to send prompt');
		process.exit(1);
	}
	console.log();

	// Poll session status while command runs
	await pollSessionStatus(sessionId, 20);

	// Wait a bit more and check for new files
	console.log('\nFinal check for new files...');
	await new Promise((resolve) => setTimeout(resolve, 3000));

	const result = checkForNewTodos(beforeFiles);
	if (result.latestFile) {
		console.log('\n=== TEST SUCCESS ===');
		console.log('Todo file created:', result.latestFile);
		
		// Restore backed up todos and clean up test todos
		restoreAndCleanup(result.newFiles);
		console.log('Test completed and cleaned up');
	} else {
		console.log('\n=== TEST FAILED ===');
		console.log('No todo file was created');
		
		// Still try to restore any existing todos
		restoreAndCleanup([]);
		process.exit(1);
	}
}

// Ensure cleanup on exit
process.on('exit', () => {
	if (backupDir) {
		try {
			rmSync(backupDir, { recursive: true, force: true });
		} catch (error) {
			// Ignore cleanup errors on exit
		}
	}
});

main().catch((error) => {
	console.error('Unhandled error:', error);
	// Try to restore before exiting
	restoreAndCleanup([]);
	process.exit(1);
});
