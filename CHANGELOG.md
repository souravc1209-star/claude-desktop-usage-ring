# Changelog

## 1.0.0 · 2026-11-27

- Recreated the prototype’s composer-adjacent ring, five-hour and weekly progress bars, reset times, and optional model rows using simulated data.
- Added six scenarios, a dark theme, an explicit refresh control, and a composer rebuild that demonstrates DOM reattachment.
- Added bounded reads, cancellation of superseded reads, keyboard focus handling, viewport-aware panel placement, and idempotent mount and cleanup.
- Added documentation, browser smoke tests, and offline demo captures.

## Earlier Windows prototype

- The JavaScript widget began as a Chromium DevTools Snippet. V3 used a saved usage endpoint and used a fallback for unavailable data.
- Launcher revisions moved from process and title matching to Windows UI Automation. The latest local revision added explicit left-modifier keyboard events and a longer delay on the path that opens DevTools.
- The [technical case study](docs/case-study.md) documents the development timeline reconstructed from the surviving launcher files and the V3 snippet.
