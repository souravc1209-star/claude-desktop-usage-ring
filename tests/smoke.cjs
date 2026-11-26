const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const demo = process.env.DEMO_URL ?? pathToFileURL(path.resolve(__dirname, '../demo/index.html')).href;
const capture = process.env.CAPTURE_DIR;

async function main() {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
    try {
        const page = await browser.newPage({ viewport: { width: 1024, height: 665 }, locale: 'en-US', timezoneId: 'UTC' });
        const errors = [];
        const remoteRequests = [];
        const demoBase = new URL('../', demo);
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => {
            if (message.type() === 'error') errors.push(message.text());
        });
        await page.route(/^https?:/, route => {
            const url = new URL(route.request().url());
            if (url.origin === demoBase.origin && url.pathname.startsWith(demoBase.pathname) &&
                ['document', 'script', 'stylesheet'].includes(route.request().resourceType())) return route.continue();
            remoteRequests.push(url.href);
            return route.abort();
        });
        if (capture) await page.clock.setFixedTime(new Date('2026-11-27T10:00:00Z'));
        await page.goto(demo);

        const ring = page.locator('#local-usage-ring');
        const panel = page.locator('#local-usage-panel');
        const scenario = page.getByLabel('Usage scenario');
        const status = panel.getByRole('status');
        const row = text => panel.locator('.usage-row').filter({ hasText: text });
        const shot = async name => {
            if (capture) await page.screenshot({ path: path.join(capture, `${name}.png`) });
        };
        const select = async (value, expectedLabel) => {
            if (await panel.isVisible()) await page.keyboard.press('Escape');
            await scenario.selectOption(value);
            await page.getByRole('button', { name: expectedLabel }).waitFor();
        };

        await page.getByRole('button', { name: /5-hour 42%.*weekly 67%/i }).waitFor();
        assert.equal(await ring.evaluate(node => node.previousElementSibling.textContent), 'Auto');
        assert.equal(await ring.getAttribute('aria-expanded'), 'false');
        await shot('01-composer');
        await ring.press('Enter');
        assert.equal(await ring.getAttribute('aria-expanded'), 'true');
        assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Refresh');
        assert.match(await row('5-hour limit').innerText(), /42%.*Resets /s);
        assert.match(await row('Weekly · all models').innerText(), /67%/);
        assert.match(await row('Weekly · Opus').innerText(), /28%/);
        await page.mouse.click(20, 20); // Close and reopen by pointer for the screenshots.
        assert.equal(await panel.isVisible(), false);
        await ring.click();
        await shot('02-typical');
        await page.keyboard.press('Escape');
        assert.equal(await panel.isVisible(), false);
        assert.equal(await ring.evaluate(node => node === document.activeElement), true);

        await select('near', /5-hour 96%.*weekly 81%/i);
        await page.getByLabel('Dark theme').check();
        await ring.click();
        assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
        assert.match(await row('Weekly · Sonnet').innerText(), /73%/);
        await shot('03-near-limit');

        await select('reset', /5-hour 0%.*weekly 8%/i);
        await ring.click();
        assert.match(await row('5-hour limit').innerText(), /0%.*Resets Not started/s);
        await select('missing', /5-hour N\/A.*weekly 54%/i);
        await ring.click();
        assert.match(await row('5-hour limit').innerText(), /N\/A.*Resets Unavailable/s);

        await select('error', 'Usage unavailable');
        await ring.click();
        assert.match(await status.innerText(), /^Usage unavailable/);
        await shot('04-error');
        await panel.getByRole('button', { name: 'Refresh' }).click();
        await status.getByText('Loading usage…').waitFor();
        await status.getByText(/usage unavailable/i).waitFor();
        await page.keyboard.press('Escape');
        await scenario.selectOption('slow');
        await ring.click();
        await status.getByText(/request timed out/i).waitFor();

        await scenario.selectOption('slow');
        await scenario.selectOption('normal');
        await page.getByRole('button', { name: /5-hour 42%/i }).waitFor();
        const draft = page.getByRole('textbox', { name: 'Sample message' });
        await draft.fill('A local draft');
        const previousToolbar = await page.locator('.composer-toolbar').elementHandle();
        await page.getByRole('button', { name: 'Rebuild composer' }).click();
        await ring.waitFor();
        assert.equal(await previousToolbar.evaluate(node => node.isConnected), false);
        assert.equal(await draft.inputValue(), 'A local draft');
        assert.equal(await ring.count(), 1);
        assert.equal(await panel.count(), 1);
        await draft.clear();
        await shot('05-rebuilt');
        await ring.click();
        await shot('06-reattached');

        await page.setViewportSize({ width: 360, height: 600 });
        await ring.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => {
            const box = document.querySelector('#local-usage-panel').getBoundingClientRect();
            return box.width > 0 && box.height > 0 && box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight;
        });
        await page.locator('.composer-toolbar').evaluate(node => { node.hidden = true; });
        await ring.waitFor({ state: 'detached' });
        assert.equal(await panel.isVisible(), false);
        await page.locator('.composer-toolbar').evaluate(node => { node.hidden = false; });
        await ring.waitFor();
        await page.evaluate(() => {
            const config = { loadUsage: () => ({ five_hour: { utilization: 101.4, resets_at: 'invalid' } }) };
            window.UsageRing.mount(config);
            window.UsageRing.mount(config);
        });
        await page.getByRole('button', { name: /5-hour 100%/i }).waitFor();
        assert.equal(await ring.count(), 1);
        assert.equal(await panel.count(), 1);
        await ring.click();
        assert.match(await row('5-hour limit').innerText(), /100%.*Resets Unavailable/s);
        assert.deepEqual(errors, []);
        assert.deepEqual(remoteRequests, []);
        console.log(`Browser smoke checks passed in Chromium ${browser.version()}.`);
    } finally {
        await browser.close();
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
