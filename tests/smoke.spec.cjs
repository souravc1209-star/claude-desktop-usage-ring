const { test, expect } = require('./fixture.cjs');

test('usage scenarios, refresh, draft, and composer reconstruction', async ({ page, demo }) => {
    const { ring, panel, scenario, status, row, refresh, close, changeScenario, capture } = demo;

    await expect(ring).toHaveAccessibleName(/5-hour 42%.*weekly 67%/i);
    expect(await ring.evaluate(node => node.previousElementSibling.textContent)).toBe('Auto');
    await expect(ring).toHaveAttribute('aria-expanded', 'false');
    await capture('01-composer');
    await ring.click();
    await expect(row('5-hour limit')).toContainText('42%');
    await expect(row('5-hour limit')).toContainText('Fri, Nov 27, 12:30 PM');
    await expect(row('Weekly · all models')).toContainText('67%');
    await expect(row('Weekly · Opus')).toContainText('28%');
    await capture('02-typical');
    await page.getByRole('heading', { name: 'Usage Ring', exact: true }).click();
    await expect(panel).toBeHidden();

    await changeScenario('near', /5-hour 96%.*weekly 81%/i);
    const theme = page.getByLabel('Dark theme');
    await theme.check();
    await theme.uncheck();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await theme.check();
    await ring.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(row('Weekly · Sonnet')).toContainText('73%');
    await expect(row('Weekly · Opus')).toHaveCount(0);
    await capture('03-near-limit');

    await changeScenario('reset', /5-hour 0%.*weekly 8%/i);
    await ring.click();
    await expect(row('5-hour limit')).toContainText('0%');
    await expect(row('5-hour limit')).toContainText('Resets Not started');
    await changeScenario('missing', /5-hour N\/A.*weekly 54%/i);
    await ring.click();
    await expect(row('5-hour limit')).toContainText('N/A');
    await expect(row('5-hour limit')).toContainText('Resets Unavailable');
    await capture('04-partial');

    await changeScenario('error', 'Usage unavailable');
    await ring.click();
    await expect(status).toHaveText(/usage unavailable/i);
    await capture('05-error');
    await refresh.click();
    await expect(status).toHaveText('Loading usage…');
    await expect(status).toHaveText(/usage unavailable/i);
    await close.click();
    await scenario.selectOption('slow');
    await ring.click();
    await expect(status).toHaveText(/request timed out/i);

    await close.click();
    await scenario.selectOption('slow');
    await scenario.selectOption('normal');
    await expect(ring).toHaveAccessibleName(/5-hour 42%/i);
    const draft = page.getByRole('textbox', { name: 'Sample message' });
    await draft.fill('A local draft');
    const previousToolbar = await page.locator('.composer-toolbar').elementHandle();
    await page.getByRole('button', { name: 'Rebuild composer' }).click();
    await expect(ring).toBeVisible();
    expect(await previousToolbar.evaluate(node => node.isConnected)).toBe(false);
    await expect(draft).toHaveValue('A local draft');
    await expect(ring).toHaveCount(1);
    await expect(panel).toHaveCount(1);
    await draft.clear();
    await capture('06-rebuilt');
    await ring.click();
    await expect(row('5-hour limit')).toContainText('42%');
    await capture('07-reattached');
});
