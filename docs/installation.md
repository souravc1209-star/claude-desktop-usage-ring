# Run the demo

## In your browser

Open the [hosted demo](https://souravc1209-star.github.io/claude-desktop-usage-ring/demo/). The interactive page uses JavaScript and works with a recent browser. It needs no account, credentials, extension, or build step.

## Offline on Windows

1. Download the offline ZIP from [GitHub Releases](https://github.com/souravc1209-star/claude-desktop-usage-ring/releases/latest) and extract the entire folder. The release provides a SHA-256 checksum. A local clone or **Code → Download ZIP** works too.
2. Open `demo/index.html` from the extracted folder in Microsoft Edge or Google Chrome. From PowerShell, run this command from the repository root.

   ```powershell
   Invoke-Item -LiteralPath '.\demo\index.html'
   ```

3. Click the ring beside **Auto**. Try the scenario selector and the **Rebuild composer** button.

Keep `demo/` and `src/` in the original folder structure. Closing the tab ends the demo. The browser reads the project files locally.

## Configure a local copy

Edit `demo/demo.js` to change the synthetic percentages, reset offsets, and simulated latency. The call to `UsageRing.mount()` accepts the following options.

| Option | Purpose |
| --- | --- |
| `loadUsage` | Supplies an object or a promise of an object. The function receives an `AbortSignal`. |
| `toolbarSelector` | CSS selector for the demo toolbar. Defaults to the original prototype’s toolbar class token. |
| `planLabel` | Label displayed in the panel. Defaults to `Sample data`. |
| `timeoutMs` | Maximum wait for a usage read. Defaults to 4,000 ms in the widget. The demo uses 1,200 ms. |
| `locale`, `timeZone` | Override browser defaults for formatting reset times and the updated time. |
| `categories`, `warningAt`, `criticalAt` | Configure limit categories and ring color thresholds. See the [reusable widget example](widget.md). |

The demo advances its synthetic reset times relative to the current time at each refresh. To run the browser tests or generate captures with a fixed clock, see [Validation and privacy review](review.md).
