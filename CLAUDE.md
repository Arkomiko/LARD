# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Important:** all development sources live in `source_dev/`. Every npm
> command below is run from `source_dev/`, not from the repository root.
> The root keeps documentation (`README.md`, `docs/`), the plan (`task.md`)
> and built products (`app_r/`). See `docs/install.md` for how to launch the
> project in different IDEs.
>
> Layout inside `source_dev/`: `core/` holds the shared core (`core/src`) plus
> everything foundational — `core/electron` (the app window), `core/tools_shell`
> (the editors' window), `core/packages`, `core/scripts`, `core/cloud_functions`.
> `app/` is the app itself, with the editors under `app/src_Tools/src_*`.
> `Tools_presets/` holds preset templates (themes, languages, workspaces);
> they are not compiled into the product, only copied next to it as `Data/`.

## Development Commands

Everything is run from `source_dev/`.

### Windows to work in

- `npm run dev:lard` - the app itself: dev server plus its Electron window
- `npm run dev:theme` - the theme editor in its own window
- `npm run dev` - every window at once
- `npm run dev:core` - only the background host: dev servers without any
  window. Windows attach to it by fixed ports (app 3000, theme editor 3100);
  the ports are strict, so a stale server is reported instead of silently
  moving the app to another port.

Every target is one process table in `core/scripts/dev.mjs` - add a window or
a watcher there, not as another line of `concurrently` in `package.json`.

No script opens a browser: LARD is a desktop program and is looked at in its
own window.

### Building products

- `npm run build:lard` - `LARD.exe` into `app_r/<version>/Windows_Standalone/`
- `npm run build:theme` - `[LARD] Theme Editor.exe` into `.../Tools/`
- `npm run build` - both

### Debugging

`.vscode/launch.json` has the compounds **LARD** and **Редактор тем**: each
starts its dev server, launches the Electron window and attaches two
debuggers - the main process and the page inside the window. Breakpoints sit
in TypeScript; source maps are on for both the rollup build of the main
process and Vite.

### Quality

- `npm test` - tests across all packages (turbo)
- `npm run lint` / `npm run format` / `npm run check` - Biome
- `npm run typecheck -w app` - types of a single package

## Architecture Overview

Signal is a web-based music sequencer built with React and TypeScript, with cross-platform Electron support. The project uses a monorepo structure managed by Turbo.

### Core Components

**Main Application (`source_dev/app`)**

- React application using MobX for state management
- WebGL-based rendering for performance-critical UI components (piano roll, arrange view)
- Web Audio API integration for MIDI playback and audio synthesis
- Modular store architecture with reactive patterns

**Core Stores (MobX-based):**

- `RootStore` - Central store managing audio context, synthesizers, and MIDI I/O
- `SongStore` - Song data and track management
- `PianoRollStore` - Piano roll editor state
- `ArrangeViewStore` - Arrange view state and selections
- `ControlStore` - Control pane for automation data

**Key Views:**

- Piano Roll Editor - MIDI note editing with WebGL-accelerated rendering
- Arrange View - Multi-track timeline view
- Tempo Graph - Tempo automation editing
- Control Pane - Parameter automation (velocity, pan, etc.)

**Shared core (`source_dev/core/src`)** — `@lard/core`

- Format of every preset (theme, language, workspace) and the code that loads it
- Colour maths, palette generation from a harmony rule, WCAG contrast checks
- Used by the main app **and** by every editor in `source_dev/Tools`
- Not to be confused with `@signal-app/core` in `packages/core`, which holds the
  music domain (song, tracks, events) inherited from signal

**Editors (`source_dev/app/src_Tools`)**

- `src_Theme/` — the theme editor (done), `src_Workspace/`, `src_Language/` —
  planned, `src_VSTHostManager/` — placeholder, purpose to be defined
- Each runs in the shared window shell from `core/tools_shell`

**Built products (`app_r/`)**

- `app_r/[version]/Windows_Standalone/` — `LARD.exe`, `core_app/`, `Tools/`
  (`[LARD] Theme Editor.exe` and friends) and `Data/` with preset templates
- `app_r/[version]/VST|VST3|CLAP/` — empty until plugin builds exist

**Packages (`source_dev/core/packages`)**

- `@signal-app/player` - Audio playback engine with SoundFont synthesis
- `@signal-app/api` - Firebase/Cloud integration for song storage
- `@signal-app/community` - Community features and song sharing
- `dialog-hooks` - React hooks for modal dialogs
- `firebaseui-web-react` - Firebase authentication components

**Electron Application (`source_dev/core/electron`)**

- Cross-platform desktop wrapper
- File system access for local MIDI files
- Native OS integration (menus, file associations)

**Static Site (`source_dev/static`)**

- Marketing/landing page built with Next.js

### Data Architecture

**Song Structure:**

- `Song` - Top-level container with tracks, tempo, time signatures
- `Track` - Individual instrument track with MIDI events
- `TrackEvent` - MIDI events (notes, control changes, program changes)

**Audio Pipeline:**

- Web Audio API context management in `RootStore`
- SoundFont-based synthesis via `SoundFontSynth`
- Real-time MIDI input/output through `MIDIInput`/`MIDIOutput`
- Audio rendering for export via `renderAudio`

### Technology Stack

- **Frontend:** React 18, TypeScript, MobX, Emotion CSS-in-JS
- **Audio:** Web Audio API, SoundFont synthesis, WebMIDI API
- **Graphics:** WebGL for performance-critical rendering
- **Build:** Vite, Turbo (monorepo), ESLint, Prettier
- **Desktop:** Electron with Forge
- **Cloud:** Firebase (auth, storage), Vercel (hosting)

### File Organization

- Component co-location pattern: related files grouped by feature
- Shared utilities in `/helpers` and `/services`
- Domain entities in `/entities` (geometry, beats, selections, transforms)
- WebGL shaders and rendering code in `/gl` and component-specific shader directories

The application emphasizes real-time performance for audio and UI, using WebGL acceleration for intensive graphics operations and optimized audio scheduling for glitch-free playback.

## Skills

Project skills live in `.claude/skills/` and are versioned with the repository,
so every session and every contributor gets the same guidance. They come from
the official Anthropic skills repository (`github.com/anthropics/skills`,
licence text kept next to each skill).

| Skill | Use it when |
| --- | --- |
| `frontend-design` | Designing or reshaping any UI: the theme editor, the preset editors, panels and dialogs of the main app. Read it **before** writing new interface code, not after. |
| `theme-factory` | Working on colour themes: palettes, font pairings, ready-made theme references. Relevant to `Theme/*.json` and to the theme editor's generator. |
| `brand-guidelines` | Keeping one visual language across the app and its editors. |
| `webapp-testing` | Verifying a running web UI: Playwright scripts, browser screenshots, console logs. Use it to check the editors actually work, instead of guessing from the code. |

Invoke a skill by name through the Skill tool (for example `frontend-design`);
do not paraphrase its contents from memory.

## Conventions of this fork

- **Comments and documentation are written in Russian.** Code identifiers stay
  in English. Anything LARD adds on top of upstream signal is marked with a
  `LARD:` comment explaining *why*, so merges with upstream stay readable.
- **Formatting and linting is Biome**, configured in `source_dev/biome.jsonc`.
  The file must stay `.jsonc`: plain `biome.json` forbids comments and Biome
  silently falls back to its defaults, reformatting the project with tabs.
- **Presets are data, not code.** A new theme, language or workspace is a file
  dropped into `source_dev/Tools_presets/{Theme,Language,Workspace}` — nothing
  is registered in code. Keep it that way.
