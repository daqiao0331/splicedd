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
- The window cannot be minimized via the taskbar or system shortcuts; it stays visible.
- The close (X) button remains the only way to dismiss/hide the window.
- The window cannot be accidentally hidden by interacting with other applications during drag-and-drop.

### Platform
- Windows only
