# Green Hat Project Architecture

## Project Purpose

Green Hat is a beginner-focused CNC lathe touch-off and setup guidance PWA. It is designed for new operators, students, hobbyists, and shop-floor users who need plain-English help with touch-off, setup notes, safe verification, and basic reference information.

The app is intentionally focused. It is not a G-code generator, simulator, production planner, tool library, or geometry calculator.

Core scope:

- touch-off guidance
- setup notes
- pre-flight verification
- beginner definitions
- speeds and feeds reference
- handoff notes
- print-friendly checklist and handoff summaries
- simple beginner diagrams
- shop-specific rules and custom checklist items
- offline mobile PWA behavior

## Repository Location

Local repo:

```text
C:\Users\Dad\Documents\GitHub\Green-Hat-
```

GitHub repo:

```text
orangetrd-byte/Green-Hat-
```

GitHub Pages:

```text
https://orangetrd-byte.github.io/Green-Hat-/
```

## App Identity

App name:

```text
Green Hat 🔰
```

Design system:

- Material You / Material Design 3 inspired
- primary color: `#006874`
- rounded cards
- bottom navigation
- Google Sans / Google Sans Display / Roboto font stack
- mobile-first layout

## File Structure

```text
Green-Hat-/
  index.html
  manifest.json
  sw.js
  README.md
  PROJECT-ARCHITECTURE.md
  css/
    style.css
  js/
    app.js
  icons/
    icon-192.png
    icon-512.png
```

### `index.html`

Defines the app shell and all page sections:

- top app bar
- overflow menu
- job notes section
- touch-off wizard section
- setup reference section
- speeds and feeds section
- reference section
- bottom navigation
- load job modal
- toast container

It does not contain the main app logic. Main behavior lives in `js/app.js`.

### `css/style.css`

Defines the full visual system:

- Material You color tokens
- typography
- card layout
- buttons
- input fields
- bottom navigation
- wizard progress
- checklist UI
- collapsible reference sections
- saved job cards
- note log
- handoff summary
- responsive mobile rules

### `js/app.js`

Contains all runtime behavior:

- state loading and persistence
- navigation
- menu behavior
- job save/load/delete
- setup note fields
- timestamped log
- handoff summary
- touch-off wizard
- move calculation
- pre-flight checklist
- setup reference persistence
- welcome banner
- speeds/RPM calculator
- custom speeds and feeds
- collapsible reference sections
- JSON export/import
- service worker registration

### `manifest.json`

PWA manifest:

- app name
- short name
- description
- start URL
- standalone display mode
- theme/background colors
- portrait orientation
- 192px and 512px icons

### `sw.js`

Service worker:

- caches app shell
- keeps the app available offline
- uses cache version `green-hat-v7`
- uses network-first navigation for page loads
- falls back to cached `index.html` when offline

## Main App Sections

### Job Notes

Purpose:

Capture job/setup context and handoff information.

Fields:

- Part Number
- Operation
- Machine / Cell
- Material
- Setup Status
- Attention Flag
- Last Setup By
- Last Run By
- Tool Notes
- Setup Notes

Supporting features:

- Save Job
- Load Job
- saved jobs list
- timestamped note log
- handoff summary
- handoff JSON export

### Touch-Off

Purpose:

Guide a beginner through touch-off in a structured 4-step flow.

Steps:

1. Measure
2. Target
3. Move
4. Verify

Important beginner guidance:

- X diameter and X radius are not the same.
- Some controls use G7/G8 for diameter/radius mode.
- G7/G8 behavior is control dependent.
- Check the program safety block, setup sheet, active modal display, and machine manual.
- Absolute means move to a position.
- Incremental means move by a distance from current position.

Calculation outputs:

- X target diameter
- X move by diameter
- radial travel
- Z face / plunge result
- warning chip for suspicious moves

### Setup Reference

Purpose:

Capture setup details that matter for safe repeatability.

Fields:

- Work Offset
- Stock Diameter
- Stock Length
- Stickout
- Chuck / Jaws
- Coolant
- Inspection Notes
- Reference Notes

### Speeds & Feeds

Purpose:

Provide beginner-friendly starting points and a simple RPM/SFM calculator.

Includes:

- material reference table
- SFM values
- feed ranges
- notes by material
- RPM from SFM and diameter
- SFM from calculated RPM and diameter
- saved custom speeds and feeds

### Reference

Purpose:

Plain-English reference material, kept collapsible for mobile use.

Sections:

- Beginner Definitions
- Lathe Setup Tips
- Touch-Off Tips
- Safe Approach & Retract
- Symbols & G-code Meanings
- Thread Basics

## State Model

Runtime state is stored in the `state` object in `js/app.js`:

```js
const state = {
  currentNav: 'notes',
  currentStep: 1,
  selectedToolType: 'OD',
  savedJobs: [],
  savedSF: [],
  noteLog: [],
  setupData: {},
  customChecklist: [],
};
```

## localStorage Keys

The app persists data with localStorage.

Current keys:

```text
cnc_helper_jobs
cnc_helper_sf
green_hat_note_log
cnc_helper_setup
green_hat_custom_checklist
gh_welcome_dismissed
```

### `cnc_helper_jobs`

Array of saved job records.

Current job shape:

```js
{
  partNumber: "",
  opNumber: "",
  machineName: "",
  material: "",
  unitSystem: "imperial",
  setupStatus: "Ready",
  attentionFlag: "",
  lastSetupBy: "",
  lastRunBy: "",
  toolNotes: "",
  setupNotes: "",
  savedAt: ""
}
```

### `green_hat_custom_checklist`

Array of short shop-specific pre-cut checklist strings.

Shape:

```js
[
  "Confirm bar puller is disabled",
  "Verify tailstock clearance"
]
```

### `green_hat_note_log`

Array of timestamped note log entries.

Shape:

```js
{
  time: "",
  partNumber: "",
  opNumber: "",
  by: "",
  status: "",
  text: ""
}
```

### `cnc_helper_setup`

Saved setup reference data.

Shape:

```js
{
  workOffset: "",
  stockDia: "",
  stockLen: "",
  stickout: "",
  chuckJaws: "",
  coolant: "",
  inspectionNotes: "",
  refNotes: ""
}
```

### `cnc_helper_sf`

Array of custom saved speeds and feeds.

Shape:

```js
{
  label: "",
  spindle: "",
  feed: "",
  units: "",
  savedAt: ""
}
```

## Export / Import Format

Exported JSON includes:

```js
{
  jobs: [],
  sf: [],
  noteLog: [],
  setup: {},
  exportedAt: ""
}
```

Import supports the same shape. Existing missing properties should be tolerated so older backups can still import.

## Key Functions

### State and Persistence

- `loadFromStorage()`
- `persist()`

### Navigation

- `switchNav(key, btn)`
- `closeMenu()`

### Job Notes

- `getJobFields()`
- `populateJobFields(job)`
- `saveCurrentJob()`
- `renderSavedJobsInline()`
- `loadJob(i)`
- `deleteJob(i)`
- `newJob()`
- `restoreNotes()`

### Note Log and Handoff

- `addLogEntry()`
- `renderNoteLog()`
- `handoffData()`
- `renderHandoffSummary()`
- `exportHandoff()`

### Touch-Off Wizard

- `goStep(n)`
- `calcMove()`
- `resetWizard()`

### Checklist

- `toggleCheck(el)`
- `updateCheckProgress()`

### Setup Reference

- `saveSetup()`
- `restoreSetup()`

### Speeds & Feeds

- `calcRPM()`
- `saveSF()`
- `deleteSF(i)`
- `renderSavedSF()`

### Utility

- `val(id)`
- `setVal(id, v)`
- `fmt(n, d)`
- `esc(str)`
- `datestamp()`
- `showToast(msg)`

## PWA Architecture

The service worker caches:

```js
[
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json'
]
```

Navigation requests are network-first so updates from GitHub Pages are more likely to show after a refresh. If the network is unavailable, the app falls back to cached `index.html`.

Do not add remote runtime dependencies that are required for core app behavior. The app should remain usable offline after caching.

Current caveat:

Google Fonts and Material Icons are loaded from Google. If unavailable offline, the app should still function, but icons/fonts may not render exactly as intended. Core app behavior must not depend on those remote assets.

## Merge Boundary

Green Hat is the base app.

Kept from Green Hat:

- app name
- Material You design
- bottom nav
- 4-step wizard
- pre-flight checklist
- welcome banner
- speeds reference table
- RPM/SFM calculator
- collapsible reference layout

Merged from Helper:

- beginner definitions
- G7/G8 diameter/radius guidance
- expanded symbols and meanings
- setup status
- last setup/run fields
- attention flag
- timestamped note log
- handoff summary
- handoff export
- absolute vs incremental explanation

Explicitly excluded:

- G-code generator
- G-code simulator
- rough plot / visual preview
- tool library
- geometry calculators
- drill/tap placeholder sections
- Helper UI, fonts, colors, or layout

## Safe Change Rules

- Keep the app focused on touch-off guidance, setup notes, and reference.
- Keep beginner explanations plain and direct.
- Explain every advanced term where it appears.
- Do not add production planning features here.
- Do not add G-code generation or simulation here.
- Preserve localStorage compatibility where possible.
- Preserve export/import compatibility where possible.
- Do not casually change `manifest.json` or `sw.js`; when changed, bump the cache version.
- Keep mobile-first layout.
- Keep offline capability.
- Avoid duplicate service worker registrations.

## Validation Checklist

After changes:

1. Run JavaScript syntax check on `js/app.js`.
2. Run JavaScript syntax check on `sw.js`.
3. Parse `manifest.json`.
4. Confirm required files exist.
5. Confirm icons exist at 192px and 512px paths.
6. Confirm no missing DOM IDs referenced by `app.js`.
7. Smoke test:
   - load app
   - save job
   - add log entry
   - refresh handoff summary
   - navigate touch-off wizard
   - calculate a move
   - open reference collapsibles
8. Confirm GitHub Pages serves updated `index.html`.
9. Confirm GitHub Pages serves current `sw.js` cache version.

## Current Direction

The best next improvements should be small and beginner-centered:

- clearer touch-off wording
- better setup verification
- improved handoff clarity
- more plain-English definitions
- better offline update behavior

Avoid broadening the app into a shop planner. That belongs in a different app.
