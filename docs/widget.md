# Reuse the usage ring

The widget takes a data loader, a toolbar selector, and optional category and threshold settings. It appends the ring and its fixed-position panel inside the selected toolbar. Include the source files from a local copy. The following example uses only synthetic data and works from an HTML file at the repository root. A host with its own Content Security Policy can put the mount call in a separate local script.

```html
<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Local quota example</title>
<link rel="stylesheet" href="src/usage-ring.css">
<div id="quota-toolbar" style="display:flex; align-items:center">API quotas</div>
<script src="src/usage-ring.js"></script>
<script>
  const widget = UsageRing.mount({
    toolbarSelector: '#quota-toolbar',
    planLabel: 'Local quota example',
    categories: [
      { key: 'daily', label: 'Daily requests', primary: true },
      { key: 'burst', label: 'Burst allowance' },
    ],
    warningAt: 75,
    criticalAt: 90,
    loadUsage: () => ({
      daily: { utilization: 64, resets_at: new Date(Date.now() + 86_400_000).toISOString() },
      burst: { utilization: 29, resets_at: null },
    }),
  });
</script>
</html>
```

| Option | Behavior |
| --- | --- |
| `loadUsage(signal)` | Returns a usage object or a promise for one. An asynchronous provider should honor the `AbortSignal` and obtain data only through an interface the host is authorized to use. |
| `categories` | An ordered array of entries with unique string keys, labels, an optional `summary` label, and at least one `primary: true`. The highest valid primary percentage fills the ring. Secondary categories appear when their percentages are valid. |
| `warningAt` and `criticalAt` | Thresholds in increasing order from 0 to 100. Defaults are 70 and 90. The percentages remain available as text. |
| `toolbarSelector` | A CSS selector for a visible toolbar. Independent apps should supply their own selector. Avoid transformed or clipped toolbar ancestors because they can change the fixed panel’s positioning. |
| `planLabel`, `locale`, `timeZone` | Panel label and locale and time-zone overrides for display timestamps. |
| `timeoutMs` | Maximum duration of a read in milliseconds. Defaults to 4,000 and is subject to the browser’s timer range. |

Each category is keyed in the provider’s result. `utilization` is a number and is rounded and clamped to 0–100. `resets_at` is an ISO timestamp with an offset or `null` for an unstarted interval. Missing or unreadable dates show as unavailable.

Call `widget.refresh()` to load updated data or `widget.dispose()` to remove the widget and cancel pending work. Each `mount()` replaces the previous widget in that document. Style the widget with CSS custom properties such as `--surface`, `--ink`, `--track`, `--focus`, `--usage-normal`, `--usage-warning`, and `--usage-critical`. Audit contrast in the host theme before deploying a custom integration.
