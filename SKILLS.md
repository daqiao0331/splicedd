# Splicedd Skills — Windows Requirements

## Overview
This document specifies the Windows-specific feature requirements for Splicedd.

## Skill 1: Proportional Page Scaling on Item Drag

### Description
When dragging sample items within the application, the page layout must automatically scale proportionally and maintain its aspect ratio. Window resizing should preserve proportional content layout so that UI elements remain properly sized and positioned.

### Acceptance Criteria
- The application window maintains a fixed aspect ratio (2:1) when the user resizes it.
- Content within the window scales proportionally with the window size.
- The minimum window dimensions are enforced (800×400) to prevent the UI from becoming unusable.
- Drag-and-drop interactions remain functional at all supported window sizes.

### Platform
- Windows only

---

## Skill 2: Page Visibility During Item Operations

### Description
When adding or dragging an item (sample), the application window must not be hidden or lose visibility. The window should remain visible and accessible at all times during item operations. The only way to close/hide the window is by explicitly clicking the close (X) button.

### Acceptance Criteria
- The window has the `alwaysOnTop` property enabled, keeping it above other windows during drag operations.
- The window remains on top of other application windows when visible, so it is not accidentally hidden by interacting with other applications during drag-and-drop.
- The close (X) button is the primary way to dismiss/hide the window.

### Platform
- Windows only
