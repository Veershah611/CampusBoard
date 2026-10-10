# Contributing to CampusBoard

Thanks for helping improve CampusBoard! Contributions of all sizes are welcome: bug reports, documentation fixes, and new features.

## Getting started

1. **Fork** the repository and clone your fork.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and set your values.
4. Load demo data: `npm run seed`
5. Start the app: `npm run dev` and open http://localhost:5000

## Workflow

1. Create a branch from `main`: `git checkout -b feature/short-description`
2. Keep commits small and use clear messages, for example `feat: add grade export`, `fix: reject empty comments`, `docs: update API table`.
3. Make sure the server starts and the main flows still work (sign in, drag a task, review, comment).
4. Push your branch and open a **Pull Request** describing *what* changed and *why*. Link the related issue (`Closes #12`).

## Reporting bugs

Open an issue with:
- steps to reproduce,
- what you expected and what happened,
- browser / Node.js version and any console errors.

## Code style

- Follow the style of the surrounding code (4-space indentation in routes, `async/await`, early `return` for errors).
- Validate all input on the **server**; UI checks are for convenience only.
- Escape any user-supplied text before inserting it into HTML.

## Code of Conduct

By participating you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
