# Validation and privacy review

## Anthropic terms review

Reviewed on November 27, 2026. Section 3 of Anthropic’s Consumer Terms limits scripted or automated access unless Anthropic explicitly permits it or access uses an Anthropic API key. It also sets restrictions on scraping and reverse engineering. The original snippet made a scripted request to an undocumented endpoint using the signed-in renderer. Reading only usage figures and avoiding changes to the executable do not establish that the request is permitted. The project publishes the interaction and engineering case study with a synthetic data provider. [Consumer Terms, Anthropic PBC version](https://assets.claude.com/ed7f1f94a2ecb7657fb4be5af6f66c66b38fb148.pdf) · [Consumer Terms, EEA and Switzerland](https://www.anthropic.com/legal/consumer-terms)

For Claude for Work or other offerings governed by Commercial Terms, section D.4 has its own reverse-engineering restrictions. The applicable agreement depends on the product and account. The public demo runs without an Anthropic account, service connection, or app package. [Anthropic Commercial Terms](https://www.anthropic.com/legal/commercial-terms) · [Anthropic Usage Policy](https://www.anthropic.com/legal/aup)

The repository name and case study identify the application studied. The demo uses a distinct layout and neutral branding. It contains no Anthropic logos or artwork and identifies the project as independent. Anthropic’s trademark guidelines describe its requirements for permitted use of its marks. [Anthropic Trademark Guidelines](https://www.anthropic.com/legal/trademark-guidelines)

## Release contents

- The public tree contains the browser widget, a simulated usage provider, documentation, tests, and media generated from the offline page.
- The original launcher, clipboard contents, browser profiles, DevTools preferences, endpoint URLs, organization IDs, and launcher logs are outside the public Git history. Original files were read only. The account identifier was removed from the local development copy of the snippet.
- The demo uses local scripts and styles, renders strings as text, and has a restrictive Content Security Policy. It does not persist draft text or send it anywhere. The hosted demo downloads static page assets from its host.
- The screenshots and GIF show the simulator with an empty sample composer, synthetic percentages, and a fixed test clock. Captures exclude desktop chrome and signed-in account screens.

## Run the browser smoke test

The demo itself has no dependencies beyond the browser. Contributors can run the smoke test with Node.js and Playwright. From the repository root in PowerShell:

```powershell
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/smoke.cjs
```

Set `CHROMIUM_PATH` to an existing Chromium-based browser executable to use it in headless mode. Set `DEMO_URL` to the deployed demo URL to run the same checks against the hosted copy. Set `CAPTURE_DIR` to an output folder to save screenshots with a fixed clock and UTC. The test blocks unexpected HTTP requests and fails if it observes any, or if the page reports a console error.

The checks cover all six scenarios, reset formatting, panel actions, keyboard focus, light and dark themes, toolbar replacement and visibility, draft preservation, duplicate mounts, viewport bounds at 360 px, invalid reset handling, and cancellation of a superseded request. They exercise the offline code. The Windows automation described in the case study remains a historical implementation.

The offline checks passed in Chrome and Edge on Windows. The working launcher, DevTools preferences file, and launcher log retained their pre-review SHA-256 hashes.
