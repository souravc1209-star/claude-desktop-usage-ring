# Validation, compatibility, and privacy

## Baseline

The enhancement pass started from [`e136932`](https://github.com/souravc1209-star/claude-desktop-usage-ring/commit/e1369324d7090f2947ec7789feb524a5d204ba25) with a clean worktree on `main`. The existing smoke test passed locally in Chrome 158.0.8127.89 and Edge 158.0.4370.33 on Windows. The public release adds a locked test environment and GitHub Actions runs that can be inspected independently. [Main branch CI runs](https://github.com/souravc1209-star/claude-desktop-usage-ring/actions/workflows/ci.yml?query=branch%3Amain)

## Browser and accessibility coverage

| Environment | Validation |
| --- | --- |
| Ubuntu 24.04 | CI runs Playwright Chromium, Firefox, and WebKit. |
| Windows Server 2025 | CI runs Playwright Chromium against local files. |
| Windows desktop | Chrome and Edge were used for baseline testing. The hosted URL can also be tested with the commands below. |
| Physical mobile devices, native Safari, and screen readers | Compatibility remains unverified. Playwright WebKit and touch emulation cover browser-engine behavior. |
| Original Claude Desktop integration | Historical proof of concept on the original Windows setup. The public test jobs do not run its launcher. |

The suite checks all six scenarios, optional values, invalid payloads, reset formatting and time zones, keyboard focus, touch dismissal in Chromium, and six viewport widths from 320 to 1,920 px. It also checks 200% root text scaling in a 640 px viewport, forced-colors rendering in Chromium, request cancellation, disposal, repeated mounts, and 25 composer rebuilds. This is a functional stress check. Formal latency, CPU, memory, and assistive-technology measurements remain open.

The accessibility target is WCAG 2.2 Level AA. The suite runs axe rules tagged for WCAG 2.0 through 2.2 A and AA on light, dark, expanded, and unavailable states. It also exercises traversal without a keyboard trap, focus return, numerical labels, progressbar names and values, and loading and failure status content. Automated checks cover a subset of accessibility requirements. Screen-reader announcement timing and physical-device interaction require further evaluation. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

## Reproduce the checks

Install Node.js 24 or 26 LTS and run the following from a clean clone. Linux contributors can add `--with-deps` to the Playwright install command.

```sh
npm ci
npx playwright install
npm test
```

Use `npm run test:smoke`, `npm run test:a11y`, or `npm run validate` to run a subset. `PW_BROWSERS` is a comma-separated engine filter, and `CHROMIUM_PATH` selects a locally installed Chromium-based browser. Set `DEMO_URL` to the [deployed demo](https://souravc1209-star.github.io/claude-desktop-usage-ring/demo/) to exercise the hosted page. The suite allows the exact same-origin demo document, two scripts, and two stylesheets and flags any unexpected HTTP requests and console errors. Test failures save screenshots and traces under `test-results/`.

To reproduce the checked-in media, set `CAPTURE_DIR` to a writable directory and run the Chromium suite. Captures use a fixed clock, UTC, and an empty sample composer. The checked-in images and GIF document real demo states. Responsive geometry assertions and manual image comparison provide visual coverage without comparing operating-system font rasterization pixel by pixel.

## Privacy and application security

- The runtime has no dependencies, telemetry, storage, authentication, or data submission. The hosted page downloads the static HTML, scripts, and stylesheets from GitHub Pages. External documentation links open only when selected.
- The Content Security Policy blocks network connections initiated by scripts, form submission, inline script execution, and externally loaded assets. A meta-delivered CSP has fewer capabilities than an HTTP response header, including frame-ancestor directives.
- Usage labels, reset dates, and errors render as text. Untrusted labels are tested as literal strings. Numeric values are bounded before interpolating CSS widths. The demo keeps draft text only in the DOM and carries it across a composer rebuild.
- Private launcher backups, DevTools preferences, logs, and browser profiles are excluded from Git. Public images use synthetic values and contain no signed-in screens. Tests and their diagnostic artifacts use synthetic data.
- The GitHub Actions workflow uses read-only checkout permissions, disabled credential persistence, and commit-pinned actions. Dependencies are development-only and resolved in the lockfile.
- Playwright uses the Apache 2.0 license, and axe-core and its Playwright integration use MPL 2.0. The downloadable demo contains the original project files and MIT license. [Playwright project](https://github.com/microsoft/playwright) · [axe-core project](https://github.com/dequelabs/axe-core) · [axe Playwright integration](https://github.com/dequelabs/axe-core-npm)

## Anthropic terms review

Reviewed November 27, 2026. Section 3 of the Consumer Terms restricts automated access except through an Anthropic API key or where Anthropic explicitly permits it. It also addresses scraping and reverse engineering. The original read used an undocumented, signed-in renderer interface. Read-only behavior and an untouched executable do not establish permission. The public release contains only a synthetic provider. [Anthropic Consumer Terms](https://www.anthropic.com/legal/consumer-terms)

Commercial Terms section D.4 addresses reverse engineering and related uses for offerings governed by that agreement. The applicable terms depend on the account and product. The public demo uses no Anthropic account, service connection, or software package. [Anthropic Commercial Terms](https://www.anthropic.com/legal/commercial-terms) · [Anthropic Usage Policy](https://www.anthropic.com/legal/aup)

The project name identifies the application studied. The site uses its own visual identity and artwork and discloses that the project is independent. Anthropic publishes separate trademark requirements. This is a technical and contractual review of the project’s distribution choices. It does not establish legal or trademark approval. [Anthropic Trademark Guidelines](https://www.anthropic.com/legal/trademark-guidelines)
