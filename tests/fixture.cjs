const { test: base, expect } = require('@playwright/test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const demoUrl = new URL(process.env.DEMO_URL ?? pathToFileURL(path.resolve(__dirname, '../demo/index.html')).href);
const remoteAssets = new Set([
    demoUrl.href,
    ...['demo.js', 'demo.css', '../src/usage-ring.js', '../src/usage-ring.css'].map(asset => new URL(asset, demoUrl).href),
]);

const test = base.extend({
    demo: async ({ page }, use, testInfo) => {
        const consoleErrors = [];
        const unexpectedRequests = [];
        page.on('pageerror', error => consoleErrors.push(error.message));
        page.on('console', message => {
            if (message.type() === 'error') consoleErrors.push(message.text());
        });
        await page.route(/^https?:/, route => {
            const request = route.request();
            if (remoteAssets.has(request.url()) && ['document', 'script', 'stylesheet'].includes(request.resourceType())) {
                return route.continue();
            }
            unexpectedRequests.push(request.url());
            return route.abort();
        });
        await page.clock.setFixedTime(new Date('2026-11-27T10:00:00Z'));
        await page.goto(demoUrl.href);

        const ring = page.locator('#local-usage-ring');
        const panel = page.locator('#local-usage-panel');
        const scenario = page.getByLabel('Usage scenario');
        const status = panel.getByRole('status');
        const row = label => panel.locator('.usage-row').filter({ hasText: label });
        const refresh = panel.getByRole('button', { name: 'Refresh' });
        const close = panel.getByRole('button', { name: 'Close' });
        const changeScenario = async (value, expectedLabel) => {
            if (await panel.isVisible()) await close.click();
            await scenario.selectOption(value);
            await expect(ring).toHaveAccessibleName(expectedLabel);
        };
        const capture = async name => {
            if (process.env.CAPTURE_DIR && testInfo.project.name === 'chromium') {
                await page.screenshot({ path: path.join(process.env.CAPTURE_DIR, `${name}.png`) });
            }
        };

        await use({ ring, panel, scenario, status, row, refresh, close, changeScenario, capture });
        expect.soft(consoleErrors, 'Browser errors').toEqual([]);
        expect.soft(unexpectedRequests, 'Unexpected HTTP requests').toEqual([]);
    },
});

module.exports = { test, expect };
