(() => {
    'use strict';

    let unmount;
    const defaultCategories = [
        { key: 'five_hour', label: '5-hour limit', summary: '5-hour', primary: true },
        { key: 'seven_day', label: 'Weekly · all models', summary: 'Weekly', primary: true },
        { key: 'seven_day_opus', label: 'Weekly · Opus' },
        { key: 'seven_day_sonnet', label: 'Weekly · Sonnet' },
        { key: 'seven_day_fable', label: 'Weekly · Fable' },
    ];

    function percentage(usage) {
        const value = usage?.utilization;
        return Number.isFinite(value) ? Math.round(Math.min(100, Math.max(0, value))) : null;
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function mount({ loadUsage, toolbarSelector = '[class~="group/chin-end"]',
        planLabel = 'Sample data', timeoutMs = 4000, locale, timeZone,
        categories = defaultCategories, warningAt = 70, criticalAt = 90 }) {
        if (typeof loadUsage !== 'function' || !Number.isFinite(timeoutMs) ||
            timeoutMs <= 0 || timeoutMs > 2_147_483_647) {
            throw new TypeError('Provide a usage loader and a positive timeout.');
        }
        if (!Array.isArray(categories) || !categories.length || categories.some(category =>
            typeof category?.key !== 'string' || !category.key || typeof category.label !== 'string' || !category.label) ||
            new Set(categories.map(({ key }) => key)).size !== categories.length ||
            !categories.some(({ primary }) => primary === true)) {
            throw new TypeError('Provide unique usage categories and at least one primary category.');
        }
        if (![warningAt, criticalAt].every(Number.isFinite) || warningAt < 0 ||
            criticalAt > 100 || warningAt >= criticalAt) {
            throw new RangeError('Usage thresholds must increase from 0 to 100.');
        }
        const configuredCategories = categories.map(({ key, label, summary, primary }) =>
            ({ key, label, summary: typeof summary === 'string' && summary ? summary : label, primary: primary === true }));
        const findToolbar = () => Array.from(document.querySelectorAll(toolbarSelector))
            .find(node => node.getClientRects().length && node.clientWidth && node.clientHeight &&
                getComputedStyle(node).visibility === 'visible');
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
        panel.setAttribute('aria-labelledby', 'local-usage-title');
        panel.hidden = true;
        const status = element('p', 'usage-status', 'Loading usage…');
        status.setAttribute('role', 'status');
        const rows = element('div', 'usage-rows');
        const refreshButton = element('button', 'usage-action', 'Refresh');
        refreshButton.type = 'button';
        const closeButton = element('button', 'usage-action', 'Close');
        closeButton.type = 'button';
        const actions = element('div', 'usage-actions');
        actions.append(refreshButton, closeButton);
        const title = element('h2', '', `Your usage limits · ${planLabel}`);
        title.id = 'local-usage-title';
        const header = element('header', 'usage-header');
        header.append(title, actions);
        panel.append(header, rows, status);

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

        function color(value) {
            if (value >= criticalAt) return 'var(--usage-critical, #b63535)';
            if (value >= warningAt) return 'var(--usage-warning, #97520e)';
            return 'var(--usage-normal, #1767c4)';
        }

        function addRow({ label, used, reset }) {
            const section = element('div', 'usage-row');
            const heading = element('div', 'usage-row-heading');
            heading.append(element('span', '', label), element('span', '', used === null ? 'N/A' : `${used}%`));
            const track = element('div', 'usage-track');
            if (used === null) {
                track.setAttribute('aria-hidden', 'true');
            } else {
                track.setAttribute('role', 'progressbar');
                track.setAttribute('aria-label', label);
                track.setAttribute('aria-valuenow', String(used));
            }
            const fill = element('div', 'usage-fill');
            fill.style.width = `${used ?? 0}%`;
            fill.style.backgroundColor = color(used);
            track.append(fill);
            section.append(heading, track, element('div', 'usage-reset', `Resets ${reset}`));
            rows.append(section);
        }

        function positionPanel() {
            if (panel.hidden) return;
            const bounds = ring.getBoundingClientRect();
            const viewportWidth = document.documentElement.clientWidth;
            const viewportHeight = document.documentElement.clientHeight;
            const edge = 12;
            const gap = 10;
            if (bounds.bottom <= 0 || bounds.top >= viewportHeight) {
                closePanel();
                return;
            }
            const above = bounds.top - edge - gap;
            const below = viewportHeight - bounds.bottom - edge - gap;
            const showAbove = panel.scrollHeight <= above || above > below;
            panel.style.maxHeight = `${Math.max(0, showAbove ? above : below)}px`;
            panel.style.left = `${Math.max(edge, Math.min(bounds.right - panel.offsetWidth,
                viewportWidth - panel.offsetWidth - edge))}px`;
            panel.style.top = `${showAbove ? Math.max(edge, bounds.top - panel.offsetHeight - gap) : bounds.bottom + gap}px`;
        }

        function closePanel(returnFocus = false) {
            panel.hidden = true;
            ring.setAttribute('aria-expanded', 'false');
            if (returnFocus) ring.focus({ preventScroll: true });
        }

        async function refresh() {
            if (disposed) return;
            request?.abort();
            const active = new AbortController();
            request = active;
            const timeout = setTimeout(() => active.abort('timeout'), timeoutMs);
            refreshButton.setAttribute('aria-busy', 'true');
            status.textContent = 'Loading usage…';
            positionPanel();
            let cancel;
            const aborted = new Promise((_, reject) => {
                cancel = () => reject(new Error('Usage request cancelled'));
                active.signal.addEventListener('abort', cancel, { once: true });
            });

            try {
                const data = await Promise.race([loadUsage(active.signal), aborted]);
                if (disposed || request !== active) return;
                const usage = configuredCategories.map(category => ({
                    ...category,
                    used: percentage(data?.[category.key]),
                    reset: resetTime(data?.[category.key]),
                }));
                const primary = usage.filter(({ primary }) => primary);
                const values = primary.map(({ used }) => used).filter(used => used !== null);
                if (!values.length) throw new Error('Usage data unavailable');
                const highest = Math.max(...values);
                ring.textContent = '';
                ring.style.setProperty('--usage-percent', `${highest}%`);
                ring.style.setProperty('--usage-color', color(highest));
                ring.classList.add('usage-ring-ready');
                const summary = primary.map(({ summary, used }) => `${summary} ${used === null ? 'N/A' : `${used}%`}`);
                labelRing(`Usage limits. ${summary.join('. ')}.`);
                rows.replaceChildren();
                usage.filter(({ primary, used }) => primary || used !== null).forEach(addRow);
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
                clearTimeout(timeout);
                active.signal.removeEventListener('abort', cancel);
                if (!disposed && request === active) {
                    request = undefined;
                    refreshButton.removeAttribute('aria-busy');
                    positionPanel();
                }
            }
        }

        function restore() {
            const toolbar = findToolbar();
            if (toolbar && ring.parentElement === toolbar && panel.parentElement === toolbar) return;
            const focused = document.activeElement === ring || panel.contains(document.activeElement);
            closePanel();
            if (toolbar) {
                toolbar.append(ring, panel);
                if (focused) ring.focus({ preventScroll: true });
                return;
            }
            ring.remove();
            panel.remove();
        }

        const observer = new MutationObserver(records => {
            if (restoreFrame !== undefined || !records.some(({ target }) => target !== ring && !panel.contains(target))) return;
            restoreFrame = requestAnimationFrame(() => {
                restoreFrame = undefined;
                restore();
            });
        });
        observer.observe(document.body, {
            childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style'],
        });
        const listener = { signal: subscriptions.signal };
        ring.addEventListener('click', () => {
            if (!panel.hidden) {
                closePanel(true);
                return;
            }
            panel.hidden = false;
            ring.setAttribute('aria-expanded', 'true');
            positionPanel();
            if (!panel.hidden) refreshButton.focus({ preventScroll: true });
        }, listener);
        refreshButton.addEventListener('click', refresh, listener);
        closeButton.addEventListener('click', () => closePanel(true), listener);
        panel.addEventListener('focusout', event => {
            if (event.relatedTarget && event.relatedTarget !== ring && !panel.contains(event.relatedTarget)) closePanel();
        }, listener);
        document.addEventListener('click', event => {
            if (!panel.hidden && !ring.contains(event.target) && !panel.contains(event.target)) closePanel();
        }, { ...listener, capture: true });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !panel.hidden) {
                event.preventDefault();
                closePanel(true);
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
