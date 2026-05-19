# Codex Workflow

This repository now uses `main` and `develop`.

## Branch Policy

- `main`: stable pushed state.
- `develop`: active development base.
- feature branches: create from `develop`.

Recommended feature branch format:

```txt
feature/#<issue-number>-short-name
```

Example:

```txt
feature/#2-game-feel
```

## Issue Workflow

1. Pick one GitHub Issue.
2. Create a branch from `develop`.
3. Implement only that scope.
4. Run checks.
5. Confirm in the local browser with the user when the change is visual or gameplay-related.
6. Commit.
7. Push the branch.
8. Open a PR into `develop`.

Merge to `main` only when the user wants a stable checkpoint.

## Required Local Checks

Run:

```bash
npm run typecheck
npm run lint
```

When assets change, also run:

```bash
npm run validate:assets
```

## Local Server

Run:

```bash
npm run dev -- -H 0.0.0.0 -p 3000
```

Use `-H 0.0.0.0` when checking on a phone on the same network.

## Visual Confirmation

Before considering UI/gameplay work done:

- check the in-app browser
- check SP portrait when controls/layout are affected
- check console errors
- verify text readability
- verify hit areas after moving buttons

## Push / Deploy Rule

Do not push or deploy unless the user asks.

GitHub Pages deployment is not automatic work unless explicitly requested.
