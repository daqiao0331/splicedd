# Splicedd Skills — Windows Requirements

## Overview
This document specifies the Windows-specific feature requirements for Splicedd, focusing on local sampling management and a 2019 Splice-inspired front-end design.

## Skill 1: Local Sampling Management

### Description
Provide local sample library management that mirrors the Splice desktop app strategy. Users can browse, preview, and manage samples that have been downloaded to their configured sample directory. The local library panel shows all downloaded WAV files organized by sample pack, with the ability to delete samples and view file metadata.

### Acceptance Criteria
- A "My Library" sidebar tab allows users to switch between online search and local sample browsing.
- The local library scans the configured `sampleDir` directory and lists all downloaded `.wav` files grouped by pack folder.
- Each local sample entry displays the file name, file size, and pack name.
- Users can delete individual local samples via a delete button on each entry.
- The local library refreshes automatically when the user switches to the tab or when samples are downloaded.
- All existing search, playback, and drag-and-drop functions remain unchanged.

### Platform
- Windows only

---

## Skill 2: 2019 Splice Front-End Design

### Description
Redesign the front-end to follow the 2019 Splice desktop application aesthetic. This includes a dark sidebar navigation on the left with icon-based tabs, a main content area on the right, and a consistent dark theme. The layout uses a sidebar + content panel pattern.

### Acceptance Criteria
- A fixed-width dark sidebar appears on the left side of the application window.
- The sidebar contains navigation tabs: "Search" (online sample search) and "My Library" (local sample management).
- The active tab is visually highlighted in the sidebar.
- The main content area occupies the remaining width to the right of the sidebar.
- The overall design uses a dark color scheme consistent with the 2019 Splice desktop app.
- All existing functions (search, filters, settings, playback, drag-and-drop) continue to work unchanged in the "Search" tab.

### Platform
- Windows only

---

## Skill 3: Test Suite

### Description
A test suite validates the local sampling management logic and UI components using Vitest and React Testing Library.

### Acceptance Criteria
- Tests cover the `LocalSampleManager` utility (scanning, listing, deleting samples).
- Tests cover the sidebar navigation component (tab switching).
- Tests cover the local samples panel (rendering sample entries, delete action).
- All tests pass successfully.

### Platform
- Windows only
