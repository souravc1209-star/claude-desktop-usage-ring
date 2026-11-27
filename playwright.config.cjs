const { defineConfig } = require('@playwright/test');

const supported = ['chromium', 'firefox', 'webkit'];
const selected = process.env.PW_BROWSERS?.split(',') ?? supported;
if (selected.some(browser => !supported.includes(browser))) {
    throw new Error(`PW_BROWSERS must list browser engines from ${supported.join(', ')}.`);
}

module.exports = defineConfig({
    testDir: './tests',
    forbidOnly: Boolean(process.env.CI),
    workers: 2,
    reporter: 'list',
    timeout: 20_000,
    use: {
        locale: 'en-US',
        timezoneId: 'UTC',
        viewport: { width: 1024, height: 720 },
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
    projects: selected.map(browserName => ({
        name: browserName,
        use: {
            browserName,
            launchOptions: {
                timeout: 20_000,
                executablePath: browserName === 'chromium' ? process.env.CHROMIUM_PATH : undefined,
            },
        },
    })),
});
