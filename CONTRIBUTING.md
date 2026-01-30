# Contributing to GSD Console

Thank you for your interest in contributing to GSD Console! This document provides guidelines and instructions for contributing.

## Ways to Contribute

- **Report bugs** -- Open an issue describing the problem and steps to reproduce
- **Suggest features** -- Open an issue with your idea and use case
- **Submit pull requests** -- Fix bugs or implement features
- **Improve documentation** -- Fix typos, clarify explanations, add examples

## Development Setup

```bash
# Clone the repository
git clone https://github.com/dbachelder/gsd-console.git
cd gsd-console

# Install dependencies
bun install

# Run in development mode (with hot reload)
bun run dev
```

## Running Tests

```bash
# Run all tests
bun test

# Run a specific test file
bun test test/lib/parser.test.ts

# Run tests with coverage
bun run test:coverage
```

## Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting.

- **Formatting:** Tabs, single quotes, semicolons, 100 character line width
- **Auto-fix issues:** Run `bun run lint:fix`
- **TypeScript:** Strict mode enabled

```bash
# Check for lint issues
bun run lint

# Auto-fix lint issues
bun run lint:fix

# Type check
bun run typecheck
```

## Commit Messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

Format: `type(scope): description`

**Types:**
- `feat` -- New feature
- `fix` -- Bug fix
- `docs` -- Documentation changes
- `style` -- Code style changes (formatting, no logic change)
- `refactor` -- Code refactoring (no feature or fix)
- `test` -- Adding or updating tests
- `chore` -- Maintenance tasks

**Examples:**
```
feat(parser): add support for nested phases
fix(navigation): prevent crash on empty roadmap
docs: update installation instructions
test(hooks): add coverage for useVimNav
```

**Note:** Commit subjects must be lowercase. Git hooks will reject commits with uppercase subjects.

## Pull Request Process

1. **Fork the repository** and create your branch from `main`

2. **Create a feature branch:**
   ```bash
   git checkout -b feat/your-feature-name
   ```

3. **Make your changes:**
   - Write clear, well-documented code
   - Add tests for new functionality
   - Update documentation if needed

4. **Verify your changes:**
   ```bash
   bun run typecheck && bun test && bun run lint
   ```

5. **Commit your changes** following the commit message guidelines

6. **Push and create a pull request:**
   ```bash
   git push origin feat/your-feature-name
   ```

7. **Fill out the PR template** with:
   - Summary of changes
   - Related issue (if applicable)
   - Test plan

## Project Structure

```
src/
  cli.tsx              # Entry point with CLI parsing
  app.tsx              # Main app component
  components/          # React components for UI
  hooks/               # Custom React hooks
  lib/                 # Utilities, types, parsing

test/
  components/          # Component tests
  hooks/               # Hook tests
  lib/                 # Library tests
```

## Code of Conduct

Please be respectful and constructive in all interactions. We're all here to build something useful together.

- Be welcoming to newcomers
- Provide constructive feedback
- Focus on the code, not the person
- Assume good intentions

## Questions?

If you have questions about contributing, feel free to open an issue with the "question" label.

---

Thank you for contributing!
