# Usage Ring for Claude Desktop

[![CI](https://github.com/souravc1209-star/claude-desktop-usage-ring/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/souravc1209-star/claude-desktop-usage-ring/actions/workflows/ci.yml) [![MIT license](https://img.shields.io/badge/license-MIT-287455)](LICENSE) [![Latest release](https://img.shields.io/github/v/release/souravc1209-star/claude-desktop-usage-ring)](https://github.com/souravc1209-star/claude-desktop-usage-ring/releases/latest)

See five-hour and weekly usage beside the chat composer. This independent portfolio project recreates a Windows proof of concept as a browser demo with simulated data. It has no account or installation requirement.

**[Try the interactive demo](https://souravc1209-star.github.io/claude-desktop-usage-ring/demo/)** · [Run offline](docs/installation.md) · [Engineering case study](docs/case-study.md)

![An open usage panel beside Auto. The light-theme composer shows 42% five-hour usage, 67% weekly usage, and 28% weekly Opus usage.](media/typical-usage.png)

## What it shows

Checking usage in Settings interrupted writing. The prototype put one ring beside **Auto**, using the larger of the two primary percentages. Opening it shows the individual limits, progress bars, optional model breakdown, and reset times.

- Try six scenarios, including normal use, a near-limit state, a reset, partial data, an unavailable service, and a timeout.
- Use **Refresh** and **Close** with a mouse, touch, or the keyboard. Toggle the theme and choose **Rebuild composer** to see the ring reattach while preserving the local draft.
- Reuse the widget with your own usage categories, thresholds, and authorized data source. [Widget integration example](docs/widget.md)

[Watch the demonstration GIF](media/demo.gif) · [Dark theme](media/near-limit-dark.png) · [Partial data](media/partial-data.png) · [Narrow layout](media/narrow-layout.png)

## The Windows prototype and the offline demo

The original prototype used PowerShell, Windows UI Automation, window handles, native keyboard events, and a Chromium DevTools Snippet. It depended on an undocumented, authenticated Claude interface, a compatible package and renderer, detached DevTools, and Windows foreground-focus behavior. The published demo runs the widget in a sample composer. It supplies synthetic data through an injectable loader and has no desktop automation.

The renderer validates percentages and reset times, ignores results from superseded reads, and reattaches after DOM changes. The simulator, widget, and browser tests live in `demo/`, `src/`, and `tests/`. For real usage, open **Settings → Usage** in Claude. [Claude Help Center](https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work)

## Run or develop locally

Open `demo/index.html` from a local copy of the repository to use the demo. To run the validation suite with Node.js 24 or 26 LTS:

```sh
npm ci
npx playwright install
npm test
```

Linux contributors can use `npx playwright install --with-deps`. The browser demo has no npm runtime dependencies. [Installation](docs/installation.md) · [Contributing](CONTRIBUTING.md) · [Troubleshooting](docs/troubleshooting.md)

## Verification and scope

GitHub Actions exercises Playwright Chromium, Firefox, and WebKit on Ubuntu plus Chromium on Windows. The suite checks keyboard behavior, responsive layouts, the six scenarios, DOM reattachment, cancellation, and WCAG-tagged axe rules. Engine coverage does not establish native Safari, mobile device, screen-reader, or Windows launcher compatibility. See the [browser and accessibility review](docs/review.md).

The demo neither submits nor stores the sample draft. The installed prototype stays local and the public runtime has no authenticated requests or analytics. [Privacy and legal review](docs/review.md#anthropic-terms-review) · [Security reporting](SECURITY.md) · [Roadmap](docs/roadmap.md) · [Changelog](CHANGELOG.md)

The owner built and exercised the original prototype with AI assistance. AI tools also assisted the offline implementation, tests, documentation, and review. This is an unofficial project unaffiliated with Anthropic. The [MIT license](LICENSE) covers the project’s original materials.
