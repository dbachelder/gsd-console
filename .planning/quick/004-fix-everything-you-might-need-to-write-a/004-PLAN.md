---
phase: 004-fix-everything-you-might-need-to-write-a
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/test-add-todo.ts
autonomous: true

must_haves:
  truths:
    - "Script can send /gsd-add-todo commands to OpenCode via SDK"
    - "Script monitors session activity and output"
    - "Script creates new todo files in .planning/todos/pending/"
  artifacts:
    - path: "scripts/test-add-todo.ts"
      provides: "Test script for add-todo command"
    - path: ".planning/todos/pending/*.md"
      provides: "Newly created todo files"
  key_links:
    - from: "scripts/test-add-todo.ts"
      to: "OpenCode SDK"
      via: "client.session.prompt()"
      pattern: "client.session.prompt"
---

<objective>
Debug and fix the /gsd-add-todo command by creating a test script that iteratively tries different strategies until it successfully creates new todos.

Purpose: The /gsd-add-todo command isn't creating todo files. Need to create a script to test the command via API, monitor session output, and identify what's broken.
Output: Working /gsd-add-todo command that creates todo files in .planning/todos/pending/
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/workflows/execute-plan.md
@~/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

# Existing code to reference

## Command file location
- Global OpenCode command: `~/.config/opencode/command/gsd-add-todo.md`
- Expected todo directory: `.planning/todos/pending/`

## OpenCode SDK usage
From `src/lib/opencode.ts`:
- `createClient(baseUrl)` - Create SDK client
- `createSession(title?, directory?)` - Create session, returns sessionId
- `sendPrompt(sessionId, text, forceModel?)` - Send prompt to session
- `loadOpencodeCommand(commandName)` - Load command file with <command-instruction> wrapper

## Current implementation issues
1. `src/lib/commands.ts` has stub action for `add-todo` (just shows toast)
2. Command execution flow goes through execution mode → background jobs queue
3. Background jobs queue calls `loadOpencodeCommand()` and sends via `sendPrompt()`

## Debugging approach
Enable debug logging: `GSD_DEBUG=1` (writes to `/tmp/gsd-tui-debug.log`)
Monitor session activity via SDK events
Check session titles and output to see what OpenCode is actually doing
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create test script for /gsd-add-todo command</name>
  <files>scripts/test-add-todo.ts</files>
  <action>
  Create `scripts/test-add-todo.ts` that:

  1. **Initialize SDK client:**
     ```typescript
     import { createOpencodeClient } from '@opencode-ai/sdk';

     const client = createOpencodeClient({ baseUrl: 'http://127.0.0.1:4096' });
     ```

  2. **Create a dedicated test session:**
     ```typescript
     const sessionResponse = await client.session.create({
       body: { title: 'Test /gsd-add-todo command' },
       query: { directory: process.cwd() },
     });

     const sessionId = sessionResponse.data?.id;
     if (!sessionId) {
       console.error('Failed to create session');
       process.exit(1);
     }
     console.log('Created session:', sessionId);
     ```

  3. **Load the gsd-add-todo command:**
     ```typescript
     import { readFileSync } from 'node:fs';
     import { join } from 'node:path';

     const commandPath = join(process.env.HOME!, '.config/opencode/command/gsd-add-todo.md');
     const commandContent = readFileSync(commandPath, 'utf-8');

     const promptToSend = `<command-instruction>
  ${commandContent}
  </command-instruction>`;
     ```

  4. **Send prompt with test todo:**
     ```typescript
     await client.session.prompt({
       path: { id: sessionId },
       body: {
         parts: [{ type: 'text', text: `${promptToSend}\n\nTest todo from script` }],
         model: { providerID: 'opencode', modelID: 'big-pickle' },
       },
     });
     ```

  5. **Subscribe to SSE events for monitoring:**
     ```typescript
     const eventSource = new EventSource(`http://127.0.0.1:4096/sse/session/${sessionId}`);

     eventSource.addEventListener('message', (e) => {
       const data = JSON.parse(e.data);
       console.log('[SSE]', data.type, data);

       if (data.type === 'done' || data.type === 'error') {
         eventSource.close();
       }
     });
     ```

  6. **Check for new todo files after completion:**
     ```typescript
     import { readdirSync, statSync } from 'node:fs';

     setTimeout(() => {
       const todosDir = '.planning/todos/pending';
       const files = readdirSync(todosDir);
       console.log('Pending todos:', files);

       const latestFile = files
         .map(f => ({ file: f, time: statSync(join(todosDir, f)).mtimeMs }))
         .sort((a, b) => b.time - a.time)[0];

       if (latestFile) {
         console.log('Latest todo:', latestFile.file);
         console.log('Content:', readFileSync(join(todosDir, latestFile.file), 'utf-8'));
       }
     }, 5000); // Wait 5 seconds for command to complete
     ```

  7. **Make script executable:**
     ```bash
     chmod +x scripts/test-add-todo.ts
     ```

  Add instructions for running:
  ```bash
  # Ensure opencode serve is running
  opencode serve --port 4096

  # Run the test script
  GSD_DEBUG=1 bun run scripts/test-add-todo.ts
  ```

  This script will:
  - Create a dedicated test session
  - Load and send the gsd-add-todo command
  - Monitor SSE events for output/errors
  - Check if new todo files are created
  - Show latest todo file content
  </action>
  <verify>
  Run `bun run scripts/test-add-todo.ts` and verify:
  - Script connects to OpenCode server
  - Session is created successfully
  - Command is sent without errors
  - SSE events are received
  - New todo file appears in .planning/todos/pending/
  </verify>
  <done>
  Script creates test session, sends /gsd-add-todo command, monitors SSE events, and detects new todo file creation
  </done>
</task>

<task type="auto">
  <name>Task 2: Run script iteratively and analyze output to fix the command</name>
  <files>scripts/test-add-todo.ts</files>
  <action>
  Run the test script multiple times with different strategies, analyzing debug logs and SSE output:

  1. **Run initial test:**
     ```bash
     GSD_DEBUG=1 bun run scripts/test-add-todo.ts 2>&1 | tee /tmp/test-add-todo.log
     ```

  2. **Check for issues:**
     - Does command file load successfully?
     - Does prompt send without errors?
     - What does SSE output show? (task, tool, reasoning, done events)
     - Does OpenCode actually execute the command steps?
     - Are there any error messages in the output?
     - Check `/tmp/gsd-tui-debug.log` for debug logs

  3. **Identify common failure modes:**

     **Case A: Command file not found or not parsing**
     - Fix: Verify command path, check file permissions
     - Fix: Ensure <command-instruction> wrapper is correct

     **Case B: Prompt sent but nothing happens**
     - Fix: Check if model parameter is correct (providerID/modelID)
     - Fix: Check if OpenCode is actually processing the prompt
     - Fix: Try with simpler prompt to test basic connectivity

     **Case C: Command runs but doesn't create files**
     - Fix: Check if .planning/todos directories exist
     - Fix: Check if write permissions are correct
     - Fix: Analyze SSE output for file write attempts
     - Fix: Check if git commit is blocking (check COMMIT_PLANNING_DOCS)

     **Case D: Command runs but fails silently**
     - Fix: Add more verbose logging to script
     - Fix: Check OpenCode session logs
     - Fix: Look for error patterns in SSE events

  4. **Iterate on script based on findings:**
     - Add more detailed logging for each step
     - Add timeout handling for stuck commands
     - Add retry logic for transient failures
     - Add different prompt formats to test
     - Test with and without arguments

  5. **Test variations:**
     ```bash
     # Test with argument
     bun run scripts/test-add-todo.ts "Fix the broken auth"

     # Test without argument (should analyze conversation)
     bun run scripts/test-add-todo.ts

     # Test with model override
     # Update script to try different models
     ```

  6. **Once working, identify the root cause:**
     - Document what was broken and why
     - Determine if it's a command file issue, SDK issue, or OpenCode issue
     - Note any workarounds or fixes needed

  Keep running and refining the script until it successfully creates a new todo file.
  </action>
  <verify>
  After each iteration, check:
  - /tmp/test-add-todo.log shows command execution
  - /tmp/gsd-tui-debug.log shows debug information
  - New .planning/todos/pending/*.md file is created
  - Todo file has valid frontmatter (created, title, area)
  - Todo file has problem section with context

  Final verification: Run script 3 times in a row, all 3 succeed
  </verify>
  <done>
  Script successfully creates todo files on multiple runs, root cause of failure identified and documented
  </done>
</task>

<task type="auto">
  <name>Task 3: Fix the issue based on findings</name>
  <files>
    - src/lib/commands.ts
    - src/hooks/useBackgroundJobs.ts
    - src/lib/opencode.ts
  </files>
  <action>
  Based on Task 2 findings, apply the appropriate fix:

  **If command file loading is broken:**
  - Fix `loadOpencodeCommand()` in `src/lib/opencode.ts`
  - Ensure command file path resolution is correct
  - Ensure <command-instruction> wrapper format is right

  **If prompt sending is broken:**
  - Fix `sendPrompt()` in `src/lib/opencode.ts`
  - Ensure model parameter format is correct
  - Check for timeout or error handling issues

  **If command execution is broken in OpenCode:**
  - May need to update command file in `~/.config/opencode/command/gsd-add-todo.md`
  - Check for syntax errors in bash commands
  - Ensure all required tools are available (read, write, bash, glob)

  **If background jobs integration is broken:**
  - Fix `useBackgroundJobs.ts` command loading logic
  - Ensure command name extraction is correct
  - Check if sessionId assignment is working

  **Common fixes to apply:**

  1. **Update commands.ts to remove stub action:**
     Change from stub to actual action that adds to background jobs:
     ```typescript
     {
       name: 'add-todo',
       description: 'Add a new todo item',
       action: (showToast, args) => {
         // Let execution mode prompt handle it
         // This is queueable, so action is not called directly
       },
       queueable: true,
     },
     ```
     Actually, stub action is fine since command goes through execution mode.

  2. **Fix command name extraction in useBackgroundJobs.ts:**
     ```typescript
     // Line 136
     const baseCommand = jobCommand.replace(/^\/gsd-/, '');
     ```
     This looks correct. Verify it matches what `loadOpencodeCommand()` expects.

  3. **Ensure directory structure exists:**
     ```typescript
     import { mkdirSync } from 'node:fs';

     const todosDir = '.planning/todos/pending';
     mkdirSync(todosDir, { recursive: true });
     ```

  Apply the fix based on root cause identified in Task 2. Ensure fix doesn't break existing functionality.
  </action>
  <verify>
  1. Run `bun run typecheck` - no errors
  2. Run `bun run lint` - no errors
  3. Test fix with TUI: Run TUI, select add-todo, execute in headless mode
  4. Verify new todo file is created
  5. Run test script again - should work consistently

  Final verification: Integration test through TUI creates todos successfully
  </verify>
  <done>
  Root cause fixed, /gsd-add-todo command works reliably through both script and TUI
  </done>
</task>

</tasks>

<verification>
1. Test script runs without errors
2. New todo files are created in .planning/todos/pending/
3. Todo files have valid structure (frontmatter, problem section)
4. TUI integration (command palette → headless mode) creates todos
5. Fix is minimal and doesn't break existing functionality
</verification>

<success_criteria>
- Script sends /gsd-add-todo commands to OpenCode via SDK
- Script monitors session activity and output
- Script creates new todo files in .planning/todos/pending/
- Root cause of failure identified and fixed
- /gsd-add-todo command works reliably
</success_criteria>

<output>
After completion, create `.planning/quick/004-fix-everything-you-might-need-to-write-a/004-01-SUMMARY.md`
</output>
