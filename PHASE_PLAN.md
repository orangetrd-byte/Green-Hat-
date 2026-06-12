# Green Hat Phase Plan

## Summary

Green Hat is the beginner CNC lathe setup and touch-off companion. It should stay focused on safe, plain-English, mobile-first guidance for new operators at the machine.

Default constraints:

- Keep the app static and offline-capable on GitHub Pages.
- Keep data local with JSON backup.
- Keep CNC Work Helper and CNC Cell Planner features out of this app.
- Favor guided steps over reference dumps.

## Phase 1: Beginner Safety Baseline

- Keep scope strictly beginner CNC lathe setup and touch-off.
- Improve Day 1 flow, safety basics, plain-language definitions, and setup checks.
- Keep advanced calculators, G-code generation, production planning, and deep reference material out of scope.
- Keep safety disclaimers visible without making the app feel like a manual replacement.

## Phase 2: Guided Setup Flow

- Make the touch-off wizard and pre-cut checklist the central workflow.
- Improve visual diagrams only when they answer: "What should a beginner check before moving the machine?"
- Add clearer labels for device-local save, backup, and restore behavior.
- Keep each step short enough for phone use at the machine.

## Phase 3: Shop-Specific Guidance

- Support shop rules, default setup notes, custom checklist items, and printable handoff summaries.
- Add control-specific notes only when safe, clearly labeled, and not pretending to replace machine manuals.
- Improve shift handoff and setup/run notes for supervisor review.

## Phase 4: Training Companion Polish

- Improve offline reliability, mobile usability, and print layouts.
- Add beginner-friendly review mode or setup confidence checklist if it stays simple.
- Add more diagrams only when they clarify a real setup risk.

## Acceptance Rules

- Every drawing must support a beginner setup or motion-check decision.
- Every feature must be understandable to a new operator without extra explanation.
- Every PWA-facing change that affects cached files must bump the visible version and `sw.js` cache name.
- Before editing, confirm local `main` is clean and aligned with `origin/main`.
