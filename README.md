# Green Hat

Beginner CNC lathe touch-off and setup companion.

Green Hat is a mobile-first PWA for true beginners: people who may know nothing about CNC, lathes, tooling, offsets, setup steps, or shop terminology. It gives plain-English guidance at the machine and focuses on safe touch-off, setup notes, handoff logs, basic reference, and pre-cut verification.

Live app: https://orangetrd-byte.github.io/Green-Hat-/

## What This App Is

Green Hat is a beginner-focused CNC lathe companion PWA for operators who are new to setup and touch-off. It runs in the browser with no login, no server, and no cloud account.

The target user is someone in their first days or weeks of lathe work. They may not know the trade vocabulary yet. They may be standing at the machine, unsure what to check next or what a word means. Green Hat slows the process down, explains terms before using them, and walks them through one safe step at a time.

## What This App Is Not

Green Hat is not a replacement for training, supervision, machine manuals, or shop procedures. It is also not a replacement for CNC Work Helper.

| Out of scope | In scope |
|---|---|
| G-code generator | Basic G-code symbol definitions |
| G-code simulator or plotter | Touch-off guidance |
| Advanced machinist reference | Beginner definitions |
| Milling, mill-turn, or multi-axis | 2-axis CNC lathe basics |
| Tool library or insert geometry deep dives | Simple tool type selection: OD, ID, Face, Groove |
| Production scheduling | Job notes and handoff summaries |
| Fanuc/Okuma/Haas parameter pages | Plain-English control checks |

If a feature would confuse a brand new operator, it probably belongs somewhere else. Green Hat should never assume the user already knows machining, G-code, tooling, offsets, workholding, feeds and speeds, or control terminology.

## Ecosystem Position

```text
orangetrd-byte GitHub Pages PWAs
|
|-- CNC Cell Planner      -> production planning and shop flow
|-- CNC Work Helper       -> advanced machinist reference
`-- Green Hat             -> beginner CNC lathe setup and touch-off
```

These apps are complementary, not redundant. Green Hat intentionally stays focused so it does not drift into CNC Work Helper or CNC Cell Planner territory.

## Core Sections

| Section | Purpose |
|---|---|
| Job Notes | Part number, operation, machine, material, setup status, attention flags, setup/run fields, shift handoff log |
| Touch-Off | 4-step wizard: Measure, Target, Move Result, Verify |
| Setup Reference | Work offset, stock info, chuck/jaws, coolant, inspection notes, reference notes |
| Speeds & Feeds | Material starting points, RPM/SFM calculator, saved custom speeds/feeds |
| Safety Basics | Beginner definitions, setup tips, touch-off tips, safe approach/retract, visual checks, and basic symbols only |

## Current Features

- 4-step CNC lathe touch-off wizard
- G7/G8 diameter-vs-radius mode warning with beginner guidance on where to check
- X diameter vs radial travel explanation
- Absolute vs incremental move explanation
- Pre-cut verification checklist with completion state
- Job notes with setup status, attention flag, last setup by, and last run by
- Timestamped shift handoff log
- Auto-generated handoff summary
- Export/import JSON backup
- Setup reference notes
- Speeds and feeds reference table
- RPM/SFM calculator
- Custom saved speeds/feeds
- Beginner definitions for common setup and control terms
- Print-friendly checklist and handoff summary
- Expanded offline visual guide diagrams for lathe setup overview, touch-off diameter, X diameter/radius, Z direction, jaw clearance, and safe rapid/feed paths
- Metric/imperial unit toggle for touch-off and RPM calculations
- Shop-specific rules and default setup notes
- Custom pre-cut checklist items
- Optional Day 1 guided path for brand new operators
- Offline-capable PWA behavior after first load

## Beginner-First Rule

Green Hat must be understandable by someone who knows nothing about the trade. Every screen, label, checklist, and explanation should assume no prior CNC knowledge.

Practical rules:

- Use plain English before shop shorthand.
- Explain CNC terms before or immediately when they appear.
- Prefer one safe step at a time over dense reference text.
- Put safety and verification before speed or productivity.
- Avoid advanced machinist details unless they are required for safe beginner setup.
- Send advanced topics to CNC Work Helper instead of expanding Green Hat beyond beginner scope.

## Design Rules

- Mobile first. Operators may use this on a phone at the machine.
- Plain language first. Advanced terms must be explained inline or in Reference.
- Step-by-step over reference dumps. The touch-off section is a wizard, not a wall of text.
- Material You / M3 style: teal primary `#006874`, rounded cards, bottom navigation, light mode.
- No accounts and no cloud sync. Data stays in browser `localStorage`.
- Export JSON is the backup strategy.
- PWA installable through GitHub Pages.

## Tech Stack

| Layer | Detail |
|---|---|
| Hosting | GitHub Pages |
| App type | Static PWA |
| Code | Vanilla HTML, CSS, and JavaScript |
| Storage | `localStorage` |
| PWA | `manifest.json` and `sw.js` |
| Icons | Material Icons font plus local PWA icons |
| Backend | None |
| AI | None |

## File Structure

```text
Green-Hat-/
|-- index.html
|-- css/
|   `-- style.css
|-- js/
|   `-- app.js
|-- icons/
|   |-- icon-192.png
|   `-- icon-512.png
|-- manifest.json
|-- sw.js
|-- README.md
`-- PROJECT-ARCHITECTURE.md
```

The app is intentionally lightweight, but it is no longer a single-file app. HTML, CSS, and JavaScript are split so the code stays maintainable.

## Data And Backup

Green Hat stores user data in the browser on the current device.

Stored locally:

- saved jobs
- setup notes
- setup reference fields
- shift handoff log
- saved speeds and feeds

Use Export JSON before clearing browser storage, switching devices, or making risky changes.

## Development Workflow

1. Plan scope carefully.
2. Make small, focused changes.
3. Do not rewrite the whole app.
4. Do not change the manifest or service worker behavior unless the PWA cache requires a version bump.
5. Push to `main`.
6. GitHub Pages deploys automatically.
7. Hard refresh or wait for Pages/PWA cache propagation when testing the live site.

## Scope Guard

Before adding a feature, ask:

1. Would someone who knows nothing about CNC understand this without outside explanation?
2. Does this belong in CNC Work Helper instead?
3. Does this require a server, account, login, or cloud sync?
4. Does it improve the existing beginner flow?
5. Does it still work offline?

Drawing rule:

Every drawing in Green Hat must answer this question:

```text
What should a beginner check before moving the machine?
```

If a drawing does not directly support that question, it belongs in CNC Work Helper instead.

## Planned / Possible Future Work

- Control-specific walkthrough notes where safe and clearly labeled
- More beginner diagrams if they clarify a real setup risk
- More shop-floor print layouts

## Related Apps

- CNC Cell Planner: production planning and shop flow
- CNC Work Helper: advanced machinist reference
- Green Hat: beginner CNC lathe setup and touch-off

Last updated: June 2026
## Assistant Change Guidelines

Before making code or file changes in this repo:

1. Clarify the beginner setup goal, assumptions, constraints, and measurable success criteria.
2. Use structured output for setup steps, checklists, risks, documentation, and troubleshooting.
3. Compare options before changing beginner workflows, safety language, storage, dependencies, or AI behavior.
4. Use brainstorming only for beginner-safe content, diagrams, checklists, and UI ideas.
5. Give technical explanations only when needed, and keep them plain-English and beginner-safe.
6. Draft concise documentation or handoff notes for user-facing workflow changes.
7. Use a troubleshooting checklist before fixing bugs in touch-off flow, setup notes, checklists, import/export, or PWA behavior.
8. Use learning-path content when it helps new operators build safe setup habits.
9. Assess risks before adding automation, AI fallback, generated instructions, or safety-related content.
10. Optimize only for a named goal such as clarity, reliability, readability, offline use, or beginner safety.
11. Assume the user knows nothing about the trade unless the screen has already explained the term or action.

Permanent rule: MGP must remain visible in build/version information and cannot be removed, hidden, renamed, or replaced.
