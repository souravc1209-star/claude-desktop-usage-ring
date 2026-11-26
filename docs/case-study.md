# Engineering the Usage Ring

## Problem

Checking Claude’s usage screen interrupted the task of writing a message. The Windows proof of concept kept the relevant numbers near the composer. One small indicator represented the more depleted of the two primary limits. Opening it showed each limit, its progress bar, and its next reset. The prototype used facilities already available on the machine, including PowerShell, Windows UI Automation, native keyboard input, and Chromium DevTools.

## Architecture

```mermaid
flowchart TD
    A[PowerShell launcher] --> B[Identify main window and detached DevTools]
    B --> C[Activate window and verify its foreground handle]
    C --> D[Open DevTools and run a saved snippet]
    D --> E[Read usage in the signed-in renderer]
    E --> F[Render ring and panel beside Auto]
    G[Offline browser demo] --> H[Load a synthetic scenario]
    H --> I[Render ring and panel in sample composer]
    F --> J[Reattach when the toolbar is replaced]
    I --> J
```

The first path describes the original Windows prototype. The second path is the executable code in this repository. The data boundary is an injected loader. In the public demo it resolves a synthetic usage object, rejects to simulate an outage, or waits long enough to time out. The renderer stays the same across those scenarios.

## Identifying the right window

Early launcher snapshots looked up the Claude process and used its main-window handle. Later snapshots enumerated the desktop’s direct UI Automation children. This distinguished the app’s main window from its separate DevTools window, even when both belonged to the packaged app. The launcher checked the window’s process against the installed executable pattern, then used separate title predicates for the main window and the Claude-targeted DevTools window. Polling had a bounded timeout and stopped when more than one window matched. Updates to the package name, titles, localization, or docking behavior could invalidate the assumptions. [Microsoft Learn on obtaining UI Automation elements](https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-obtainingelements)

## Foreground activation and keyboard input

Finding a window and directing keyboard input to it are separate operations. The launcher asked Windows to restore the window and bring it forward, then compared `GetForegroundWindow` with the intended native handle. It used `WScript.Shell.AppActivate` as a fallback and checked the handle again. The snippet command sequence checked the foreground window before each group of keystrokes. Focus can still change between a check and the next key event, and a foreground-handle match says nothing about which control inside the window has focus. [Microsoft Learn on foreground activation](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setforegroundwindow)

The later launcher revision used the native Windows keyboard API for the DevTools shortcut. It pressed left Ctrl, left Alt, and I in order, then released the keys in reverse order. After the detached DevTools window appeared, it still used `WScript.Shell.SendKeys` for snippet search, selection, and closing the tools window. A completed key sequence could confirm that the launcher got through that stage. Verification of JavaScript execution came from seeing the ring in the composer. The prototype used `keybd_event`, which Microsoft has superseded with `SendInput`. [Microsoft Learn on keybd_event](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-keybd_event) · [Chrome DevTools on running snippets](https://developer.chrome.com/docs/devtools/javascript/snippets)

## Cold starts and readiness

The main app window could appear before the renderer was ready to respond to its shortcut. The launcher reused a matching main window if it already existed. When the DevTools window was absent, the final revision waited ten seconds, verified focus again, sent the shortcut, and polled for the detached tools window. It then allowed short pauses between the DevTools actions. The waits were tuned against the original setup. Fixed delays can be too short on a slower machine and add latency on a faster one. The public demo uses deferred scripts and renders a loading state while the simulator is pending.

## Keeping the indicator attached

The toolbar can be replaced when the host UI is rebuilt. Both versions locate a visible toolbar by a class token and append one ring. The original snippet used a debounced `MutationObserver`. The demo coalesces mutations into one animation frame and attaches the same button node to the replacement toolbar. It closes the panel when its anchor moves, and the simulator preserves the draft through the rebuild. **Rebuild composer** reproduces this without navigating away from the demo.

The renderer cancels pending reads and removes observers and listeners on cleanup. Remounting replaces the prior widget. A slow or superseded read cannot update a disposed or newer widget. The browser smoke test exercises both the toolbar replacement and consecutive mounts.

## Data and display reliability

The ring uses the larger finite percentage from the five-hour and all-model weekly rows. It clamps percentages to 0–100 and can display one primary row when the other is missing. An explicitly unset reset is shown as `Not started`. Missing or invalid resets appear as `Unavailable`. Optional model rows appear when a scenario supplies a numeric value.

The panel sizes and positions itself relative to the ring and the viewport. Its open state is exposed to assistive technology, with text percentages accompanying the bars. Escape closes it and restores focus to the ring. Scenario switching cancels any outstanding read, and a timed-out read offers an explicit retry.

## What the surviving files show

| Stage | Evidence |
| --- | --- |
| Early launcher iterations | Backup snapshots used process and main-window-handle discovery, a foreground check, and shell-synthesized input. |
| UI Automation revision | A saved launcher revision enumerated UI Automation windows and kept the foreground checks. |
| Native keyboard revision | The working launcher introduced explicit left-modifier key events and a longer wait before the shortcut. |
| V3 widget | The recovered snippet contained the composer selector, observer, cleanup, optional model rows, and usage fetch. |
| Offline edition | The source in this repository replaces the signed-in read with a simulator and adds interaction controls and browser tests. |

This timeline comes from the recovered source and backups. The public Git history begins with the offline edition. See [Validation and privacy review](review.md) for the terms review and evidence behind the public release.
