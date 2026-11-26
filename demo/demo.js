(() => {
    'use strict';

    const slot = document.querySelector('#composer-slot');
    const template = document.querySelector('#composer-template');
    const scenario = document.querySelector('#scenario');
    const darkMode = document.querySelector('#dark-mode');
    const demoStatus = document.querySelector('#demo-status');
    const resetAt = (hours, now) => new Date(now + hours * 3_600_000).toISOString();

    function replaceComposer() {
        const previousMessage = slot.querySelector('textarea')?.value ?? '';
        slot.replaceChildren(template.content.cloneNode(true));
        slot.querySelector('textarea').value = previousMessage;
    }

    function simulatedUsage(signal) {
        const selected = scenario.value;
        return new Promise((resolve, reject) => {
            const wait = setTimeout(() => {
                signal.removeEventListener('abort', cancel);
                if (selected === 'error') {
                    reject(new Error('Simulated service unavailable'));
                    return;
                }
                const now = Date.now();
                const session = resetAt(2.5, now);
                const weekly = resetAt(3 * 24 + 6, now);
                const limit = (utilization, resets_at) => ({ utilization, resets_at });
                const scenarios = {
                    normal: { five_hour: limit(42, session), seven_day: limit(67, weekly), seven_day_opus: limit(28, weekly) },
                    near: { five_hour: limit(96, session), seven_day: limit(81, weekly), seven_day_sonnet: limit(73, weekly) },
                    reset: { five_hour: limit(0, null), seven_day: limit(8, weekly) },
                    missing: { five_hour: null, seven_day: limit(54, weekly) },
                };
                resolve(scenarios[selected]);
            }, selected === 'slow' ? 6000 : 160);

            function cancel() {
                clearTimeout(wait);
                reject(signal.reason);
            }

            signal.addEventListener('abort', cancel, { once: true });
        });
    }

    replaceComposer();
    const widget = window.UsageRing.mount({ loadUsage: simulatedUsage, timeoutMs: 1200 });
    scenario.addEventListener('change', () => {
        demoStatus.textContent = `${scenario.selectedOptions[0].textContent} selected.`;
        void widget.refresh();
    });
    darkMode.addEventListener('change', () => {
        document.documentElement.dataset.theme = darkMode.checked ? 'dark' : 'light';
    });
    document.querySelector('#replace-composer').addEventListener('click', () => {
        replaceComposer();
        demoStatus.textContent = 'Composer rebuilt. The ring reattaches to the new toolbar.';
    });
})();
