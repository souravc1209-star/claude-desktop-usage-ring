# Troubleshooting

| Symptom | What to check |
| --- | --- |
| The composer loads without a ring | Extract the full repository and open `demo/index.html` with JavaScript enabled. If you changed the toolbar markup, confirm that it matches `toolbarSelector` and is visible. |
| The ring shows `!` | **Service unavailable** and **Request timeout** simulate expected failure states. Choose **Typical usage** to recover. The panel’s **Refresh** button repeats the current scenario. |
| The panel closes after rebuilding | The old toolbar and anchor were removed. Open the ring beside **Auto** in the rebuilt composer. |
| A row reads `N/A` or `Unavailable` | **Partial data** omits the five-hour limit. A data provider can also omit individual rows or supply an invalid reset timestamp. |
| The panel displays `Not started` | That limit has an explicit `null` reset value. Try **After a reset** to see this state. |
| Reset times differ from the screenshots | The demo formats synthetic reset times using the browser’s locale and time zone. The captures use a fixed date and UTC for consistency. |
| You want to see real account usage | Open Claude’s **Settings → Usage** screen. [Claude Help Center](https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work) |

**Keyboard controls.** Tab to the ring and press Enter or Space to open the panel. Focus moves to **Refresh**. Escape closes the panel and returns focus to the ring.

When reporting a demo issue, include the browser version, the selected scenario, and the steps to reproduce. Use captures from the offline demo when attaching images.
