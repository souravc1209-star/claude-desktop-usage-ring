const { test, expect } = require('./fixture.cjs');

test('malformed values, configurable categories, transparent errors, and repeated mounts', async ({ page, demo }) => {
    const { ring, panel, row, status } = demo;
    await page.evaluate(() => {
        const config = {
            loadUsage: () => ({
                exact: { utilization: 100, resets_at: '2026-11-27T12:30:00Z' },
                excess: { utilization: 110, resets_at: 'invalid' },
                negative: { utilization: -3 },
                invalid: { utilization: '98', resets_at: null },
                optional: { utilization: Infinity },
            }),
            categories: [
                { key: 'exact', label: 'Exact', primary: true },
                { key: 'excess', label: 'Excess', primary: true },
                { key: 'negative', label: '<img src="example.png">', primary: true },
                { key: 'invalid', label: 'Invalid', primary: true },
                { key: 'optional', label: 'Optional' },
            ],
            warningAt: 60, criticalAt: 80, timeZone: 'Asia/Kolkata',
        };
        UsageRing.mount(config);
        UsageRing.mount(config);
    });
    await expect(ring).toHaveAccessibleName(/Exact 100%.*Excess 100%.*0%.*Invalid N\/A/);
    await expect(ring).toHaveCount(1);
    await expect(panel).toHaveCount(1);
    await ring.click();
    await expect(row('Exact')).toContainText('6:00 PM');
    await expect(row('Excess')).toContainText('Resets Unavailable');
    await expect(row('example.png')).toContainText('Resets Unavailable');
    await expect(row('Invalid')).toContainText('Resets Not started');
    await expect(row('Optional')).toHaveCount(0);
    await expect(panel.locator('img')).toHaveCount(0);
    await expect(async () => page.evaluate(() => UsageRing.mount({ loadUsage() {}, categories: [] }))).rejects.toThrow();
    await expect(ring).toHaveCount(1);

    await page.evaluate(() => UsageRing.mount({ loadUsage: () => ({ five_hour: { utilization: NaN } }) }));
    await expect(ring).toHaveAccessibleName('Usage unavailable');
    await ring.click();
    await expect(status).toHaveText(/usage unavailable/i);
});

test('new reads win, and disposing a pending widget aborts its read and observer', async ({ page, demo }) => {
    const { ring, panel } = demo;
    const superseded = await page.evaluate(async () => {
        window.pending = [];
        window.widget = UsageRing.mount({
            loadUsage: signal => new Promise(resolve => window.pending.push({ signal, resolve })),
        });
        const newer = window.widget.refresh();
        const old = window.pending[0];
        window.pending[1].resolve({ five_hour: { utilization: 72 } });
        await newer;
        old.resolve({ five_hour: { utilization: 2 } });
        return old.signal.aborted;
    });
    expect(superseded).toBe(true);
    await expect(ring).toHaveAccessibleName(/5-hour 72%/);
    await ring.click();
    await expect(panel).toBeVisible();
    const cancelled = await page.evaluate(async () => {
        const pendingRefresh = window.widget.refresh();
        window.widget.dispose();
        window.widget.dispose();
        await pendingRefresh;
        return window.pending[2].signal.aborted;
    });
    expect(cancelled).toBe(true);
    await expect(ring).toHaveCount(0);
    await expect(panel).toHaveCount(0);
    await page.getByRole('button', { name: 'Rebuild composer' }).click();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(ring).toHaveCount(0);
});

test('reattaches after visibility and DOM changes without accumulating controls', async ({ page, demo }) => {
    const { ring, panel } = demo;
    await expect(ring).toHaveAccessibleName(/5-hour 42%/);
    await ring.click();
    const toolbar = page.locator('.composer-toolbar');
    await toolbar.evaluate(node => { node.style.visibility = 'hidden'; });
    await expect(ring).toHaveCount(0);
    await expect(panel).toHaveCount(0);
    await toolbar.evaluate(node => { node.style.visibility = ''; });
    await expect(ring).toBeVisible();
    await expect(panel).toBeHidden();

    const rebuild = page.getByRole('button', { name: 'Rebuild composer' });
    await rebuild.evaluate(async button => {
        for (let i = 0; i < 25; i++) {
            button.click();
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
    });
    await expect(ring).toHaveCount(1);
    await expect(panel).toHaveCount(1);
});
