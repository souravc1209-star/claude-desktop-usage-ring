const { AxeBuilder } = require('@axe-core/playwright');
const { test, expect } = require('./fixture.cjs');

test('WCAG A and AA axe checks in light, dark, and unavailable states', async ({ page, demo }, testInfo) => {
    const { ring, panel, status, changeScenario } = demo;
    const check = async state => {
        const result = await new AxeBuilder({ page })
            .setLegacyMode() // The demo has no frames, so run in its original document.
            .options({ preload: false }) // Use rendered styles under the demo's connection-blocking CSP.
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        if (result.violations.length) {
            await testInfo.attach(`axe-${state}`, { body: JSON.stringify(result.violations, null, 2), contentType: 'application/json' });
        }
        expect.soft(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) })), state).toEqual([]);
    };

    await expect(ring).toHaveAccessibleName(/5-hour 42%/);
    await check('light closed');
    await ring.click();
    await expect(panel.getByRole('progressbar', { name: '5-hour limit' })).toHaveAttribute('aria-valuenow', '42');
    await check('light expanded');
    await page.getByLabel('Dark theme').check();
    await ring.click();
    await check('dark expanded');
    await changeScenario('error', 'Usage unavailable');
    await ring.click();
    await expect(status).toHaveText(/usage unavailable/i);
    await check('dark unavailable');
});

test('keyboard can open, refresh, dismiss, and continue tabbing', async ({ page, demo }) => {
    const { ring, panel, refresh, close, status, scenario } = demo;
    await expect(ring).toHaveAccessibleName(/5-hour 42%/);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('textbox', { name: 'Sample message' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(ring).toBeFocused();
    await page.keyboard.press('Space');
    await expect(ring).toHaveAttribute('aria-expanded', 'true');
    await expect(refresh).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(status).toHaveText('Loading usage…');
    await expect(status).toHaveText(/Updated/);
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(ring).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(refresh).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(scenario).toBeFocused();
    await expect(panel).toBeHidden();
});

test('panels stay in view across responsive layouts and enlarged text', async ({ page, demo }) => {
    const { ring, panel, close, capture } = demo;
    for (const width of [320, 390, 430, 768, 1280, 1920]) {
        await test.step(`${width}px`, async () => {
            await page.setViewportSize({ width, height: width < 500 ? 580 : 800 });
            await ring.scrollIntoViewIfNeeded();
            await ring.click();
            await expect(panel).toBeVisible();
            const [panelBox, ringBox, autoBox] = await Promise.all([
                panel.boundingBox(), ring.boundingBox(), page.getByText('Auto', { exact: true }).boundingBox(),
            ]);
            expect(panelBox.x).toBeGreaterThanOrEqual(0);
            expect(panelBox.y).toBeGreaterThanOrEqual(0);
            expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(width);
            expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(width < 500 ? 580 : 800);
            expect(ringBox.width).toBeGreaterThanOrEqual(24);
            expect(ringBox.height).toBeGreaterThanOrEqual(24);
            expect(ringBox.x).toBeGreaterThanOrEqual(autoBox.x + autoBox.width);
            expect(await panel.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
            if (width === 390) await capture('08-narrow');
            await close.click();
            await expect(panel).toBeHidden();
        });
    }
    await page.setViewportSize({ width: 640, height: 500 });
    await page.locator('html').evaluate(root => { root.style.fontSize = '200%'; });
    await ring.click();
    await expect(panel).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await panel.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await close.click();
});

test.describe('touch and display preferences', () => {
    test.use({ hasTouch: true, forcedColors: 'active', reducedMotion: 'reduce', viewport: { width: 390, height: 640 } });
    test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium covers combined touch and forced-colors emulation.');

    test('touch dismissal and high-contrast ring fallback', async ({ page, demo }) => {
        const { ring, panel, close } = demo;
        await expect(ring).toHaveAccessibleName(/5-hour 42%/);
        expect(await ring.evaluate(node => getComputedStyle(node, '::before').content)).toContain('◔');
        expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
        await ring.tap();
        await expect(panel).toBeVisible();
        await close.tap();
        await expect(panel).toBeHidden();
    });
});
