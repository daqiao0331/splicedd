# Splicedd Skills — Plugin Redesign Spec

This document is the specification for the **plugin-style 2019-Splice redesign** of
Splicedd. It fuses the earlier "plugin ideas" (local sampling management + a faithful
2019 Splice look) into a single compact app that behaves like the Splice desktop
*plugin/bridge* that sits next to your DAW.

The original Splice GraphQL API (`src/splice/api.ts`) and the audio decoder
(`src/splice/decoder.ts`) are kept intact — search, preview playback, and
drag-and-drop continue to work exactly as before.

---

## Skill 1: Compact 2019-Splice "Plugin" Front-End

### Description
Rebuild the front-end to look and feel like the **2019 Splice desktop app**: a small,
dense, dark window with a left navigation rail and a content area on the right — not the
large modern card layout. The window is sized like a plugin browser so it can live
beside a DAW.

### Acceptance Criteria
- A fixed, dark **navigation rail** on the left with the Splice wordmark and icon tabs:
  **Browse** (online search) and **Library** (local samples), plus a **Settings** entry.
- The active tab is highlighted with the Splice teal accent.
- The content area fills the rest of the window.
- The **search bar** and **filter row** (type toggle, BPM, Key, Genres, Instruments,
  Tags, Sort) are compact and sit at the top of the Browse view.
- Result rows are **dense** (single-line, ~44px tall): play/stop button, inline
  **waveform**, name, tag pills, key, BPM, duration, and a draggable pack thumbnail.
- The whole UI uses a dark 2019-Splice palette (near-black panels, teal accent).
- The Tauri window opens at a compact, plugin-like size.

---

## Skill 2: Local Sampling Management

### Description
Provide a local sample library that mirrors the Splice desktop strategy: everything
the user has downloaded (dragged out) into their configured `sampleDir` is browsable,
previewable, and manageable from inside the app — without going back online.

### Acceptance Criteria
- A **Library** tab lists every downloaded `.wav` under `sampleDir`, **grouped by pack**
  folder.
- Each local entry shows file name, pack name, and file size.
- Local samples can be **previewed** (play/stop) and **dragged** into a DAW, reusing the
  existing drag mechanism.
- Local samples can be **deleted** from disk via a delete action on the entry.
- The library **refreshes** when the user opens the tab or after a new download.
- All existing search / playback / drag-and-drop behaviour is unchanged.

### Implementation
- Rust commands `scan_sample_files`, `read_sample_file`, and `delete_sample_file` in
  `src-tauri/src/files.rs` (with path-traversal guards).
- Native bindings `scanSampleFiles` / `readSampleFile` / `deleteSampleFile` in `src/native.ts`.
- `src/local/grouping.ts` — pure `groupByPack` / `formatFileSize` helpers (unit-tested).
- `src/ui/playback.ts` — shared `useAudioPreview` hook used by both online and local rows.
- `src/ui/components/LocalSamplesPanel.tsx` — the Library view.

---

## Skill 3: Test Suite

### Description
A Vitest suite validates the pure local-library logic.

### Acceptance Criteria
- Tests cover `groupByPack` (grouping, sorting, size totals, edge cases).
- `yarn test` runs green.
