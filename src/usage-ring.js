(() => {
    'use strict';

    let unmount;
    const limits = [
        ['five_hour', '5-hour limit'],
        ['seven_day', 'Weekly · all models'],
        ['seven_day_opus', 'Weekly · Opus'],
        ['seven_day_sonnet', 'Weekly · Sonnet'],
        ['seven_day_fable', 'Weekly · Fable'],
    ];

    function percentage(usage) {
        const value = usage?.utilization;
        return Number.isFinite(value) ? Math.round(Math.min(100, Math.max(0, value))) : null;
    }

    function color(value) {
        if (value >= 90) return '#e05252';
        if (value >= 70) return '#b36e1a';
        return '#3185ef';
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function mount({ loadUsage, toolbarSelector = '[class~="group/chin-end"]',
        planLabel = 'Sample data', timeoutMs = 4000, locale, timeZone }) {
        if (typeof loadUsage !== 'function' || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
            throw new TypeError('Provide a usage loader and a positive timeout.');
        }
        const findToolbar = () => Array.from(document.querySelectorAll(toolbarSelector))
            .find(node => node.getClientRects().length && node.clientWidth && node.clientHeight);
        findToolbar(); // Validate the selector before changing an existing mount.
        const dateFormat = new Intl.DateTimeFormat(locale, {
            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone,
        });
        const clockFormat = new Intl.DateTimeFormat(locale, {
            hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone,
        });

        unmount?.();
        let disposed = false;
        let request;
        let restoreFrame;
        const subscriptions = new AbortController();
        const ring = element('button', 'usage-ring', '◌');
        ring.type = 'button';
        ring.id = 'local-usage-ring';
        ring.setAttribute('aria-expanded', 'false');
        ring.setAttribute('aria-controls', 'local-usage-panel');
        labelRing('Your usage limits');

        const panel = element('section', 'usage-panel');
        panel.id = 'local-usage-panel';
        panel.setAttribute('aria-label', 'Your usage limits');
        panel.hidden = true;
        const status = element('p', 'usage-status', 'Loading usage…');
        status.setAttribute('role', 'status');
        const rows = element('div', 'usage-rows');
        const refreshButton = element('button', 'usage-refresh', 'Refresh');
        refreshButton.type = 'button';
        const header = element('header', 'usage-header');
        header.append(element('h2', '', `Your usage limits · ${planLabel}`), refreshButton);
        panel.append(header, rows, status);
        document.body.append(panel);

        function labelRing(label) {
            ring.title = label;
            ring.setAttribute('aria-label', label);
        }

        function resetTime(usage) {
            if (!usage) return 'Unavailable';
            if (usage.resets_at === null) return 'Not started';
            const value = usage.resets_at;
            const timestamp = typeof value === 'string' ? Date.parse(value) : NaN;
            return Number.isFinite(timestamp) ? dateFormat.format(timestamp) : 'Unavailable';
        }

        function addRow(label, usage) {
            const used = percentage(usage);
            const section = element('div', 'usage-row');
            const heading = element('div', 'usage-row-heading');
            heading.append(element('span', '', label), element('span', '', used === null ? 'N/A' : `${used}%`));
            const track = element('div', 'usage-track');
            track.setAttribute('aria-hidden', 'true');
            const fill = element('div', 'usage-fill');
            fill.style.width = `${used ?? 0}%`;
            fill.style.backgroundColor = color(used);
            track.append(fill);
            section.append(heading, track, element('div', 'usage-reset', `Resets ${resetTime(usage)}`));
            rows.append(section);
        }

        function positionPanel() {
            if (panel.hidden) return;
            const bounds = ring.getBoundingClientRect();
            const edge = 12;
            const gap = 10;
            const above = bounds.top - edge - gap;
            const below = innerHeight - bounds.bottom - edge - gap;
            const showAbove = panel.scrollHeight <= above || above > below;
            panel.style.maxHeight = `${Math.max(0, showAbove ? above : below)}px`;
            panel.style.left = `${Math.max(edge, Math.min(bounds.right - panel.offsetWidth,
                innerWidth - panel.offsetWidth - edge))}px`;
            panel.style.top = `${showAbove ? Math.max(edge, bounds.top - panel.offsetHeight - gap) : bounds.bottom + gap}px`;
        }

        function closePanel() {
            panel.hidden = true;
            ring.setAttribute('aria-expanded', 'false');
        }

        async function refresh() {
            if (disposed) return;
            request?.abort();
            const active = new AbortController();
            request = active;
            const start = setTimeout(() => active.abort('timeout'), timeoutMs);
            refreshButton.setAttribute('aria-busy', 'true');
            status.textContent = 'Loading usage…';
            positionPanel();
            const aborted = new Promise((_, reject) => active.signal.addEventListener('abort',
                () => reject(new Error('Usage request cancelled')), { once: true }));

            try {
                const data = await Promise.race([loadUsage(active.signal), aborted]);
                if (disposed || request !== active) return;
                const primary = limits.slice(0, 2).map(([key]) => percentage(data?.[key]));
                const values = primary.filter(value => value !== null);
                if (!values.length) throw new Error('Usage data unavailable');
                const highest = Math.max(...values);
                ring.textContent = '';
                ring.style.setProperty('--usage-percent', `${highest}%`);
                ring.style.setProperty('--usage-color', color(highest));
                ring.classList.add('usage-ring-ready');
                labelRing(`Usage limits. 5-hour ${primary[0] === null ? 'N/A' : `${primary[0]}%`}. ` +
                    `Weekly ${primary[1] === null ? 'N/A' : `${primary[1]}%`}.`);
                rows.replaceChildren();
                limits.forEach(([key, label], index) => {
                    if (index < 2 || percentage(data?.[key]) !== null) addRow(label, data?.[key]);
                });
                status.textContent = `Updated ${clockFormat.format(new Date())}${timeZone ? ` (${timeZone})` : ''}`;
            } catch {
                if (disposed || request !== active) return;
                ring.classList.remove('usage-ring-ready');
                ring.textContent = '!';
                labelRing('Usage unavailable');
                rows.replaceChildren();
                status.textContent = active.signal.reason === 'timeout'
                    ? 'Usage request timed out. Choose Refresh to try again.'
                    : 'Usage unavailable. Choose Refresh to try again.';
            } finally {
                clearTimeout(start);
                if (!disposed && request === active) {
                    request = undefined;
                    refreshButton.removeAttribute('aria-busy');
                    positionPanel();
                }
            }
        }

        function restore() {
            const toolbar = findToolbar();
            if (toolbar && ring.parentElement !== toolbar) {
                const focused = document.activeElement === ring || panel.contains(document.activeElement);
                closePanel();
                toolbar.append(ring);
                if (focused) ring.focus();
            } else if (!toolbar && ring.isConnected) {
                closePanel();
                ring.remove();
            } else if (!toolbar) {
                closePanel();
            }
        }

        const observer = new MutationObserver(() => {
            if (restoreFrame !== undefined) return;
            restoreFrame = requestAnimationFrame(() => {
                restoreFrame = undefined;
                restore();
            });
        });
        observer.observe(document.body, {
            childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'],
        });
        const listener = { signal: subscriptions.signal };
        ring.addEventListener('click', () => {
            if (!panel.hidden) {
                closePanel();
                return;
            }
            panel.hidden = false;
            ring.setAttribute('aria-expanded', 'true');
            positionPanel();
            refreshButton.focus({ preventScroll: true });
        }, listener);
        refreshButton.addEventListener('click', refresh, listener);
        document.addEventListener('click', event => {
            if (!ring.contains(event.target) && !panel.contains(event.target)) closePanel();
        }, { ...listener, capture: true });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !panel.hidden) {
                closePanel();
                ring.focus();
            }
        }, listener);
        window.addEventListener('resize', positionPanel, listener);
        window.addEventListener('scroll', positionPanel, listener);

        const dispose = () => {
            if (disposed) return;
            disposed = true;
            subscriptions.abort();
            request?.abort();
            observer.disconnect();
            if (restoreFrame !== undefined) cancelAnimationFrame(restoreFrame);
            ring.remove();
            panel.remove();
            if (unmount === dispose) unmount = undefined;
        };
        unmount = dispose;
        restore();
        void refresh();
        return { refresh, dispose };
    }

    window.UsageRing = Object.freeze({ mount });
})();
