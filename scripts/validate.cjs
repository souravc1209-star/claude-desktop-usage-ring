const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { version, dependencies } = require('../package.json');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checkLocalLinks = (file, links) => {
    for (const link of links) {
        if (/^https?:\/\//.test(link) || link.startsWith('#')) continue;
        const target = path.resolve(root, path.dirname(file), link.split(/[?#]/)[0]);
        assert.ok(target === root || target.startsWith(`${root}${path.sep}`), `${file} links outside the project`);
        assert.ok(fs.existsSync(target), `${file} has a broken link to ${link}`);
    }
};

const demo = read('demo/index.html');
const csp = demo.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
for (const directive of ["default-src 'none'", "connect-src 'none'", "form-action 'none'", "base-uri 'none'"]) {
    assert.ok(csp?.split(';').map(section => section.trim()).includes(directive), `Missing CSP ${directive}`);
}
assert.ok(!dependencies || !Object.keys(dependencies).length, 'The public widget must have no npm runtime dependencies');
assert.ok(demo.includes(`v${version} · Independent project`), 'Demo and package versions differ');
assert.ok(read('CHANGELOG.md').includes(`## ${version} ·`), 'Changelog and package versions differ');
const remoteCode = /\b(?:XMLHttpRequest|WebSocket|EventSource|sendBeacon|fetch|innerHTML|localStorage|sessionStorage)\b/;
for (const file of ['src/usage-ring.js', 'demo/demo.js']) {
    assert.doesNotMatch(read(file), remoteCode, `${file} enables unsafe markup, a network request, or browser storage`);
}

for (const file of ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md',
    ...fs.readdirSync(path.join(root, 'docs')).filter(name => name.endsWith('.md')).map(name => `docs/${name}`)]) {
    checkLocalLinks(file, [...read(file).matchAll(/\]\(([^)\s]+)\)/g)].map(match => match[1]));
}
for (const file of ['index.html', 'demo/index.html']) {
    checkLocalLinks(file, [...read(file).matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]));
    assert.doesNotMatch(read(file), /<(?:script|link)\b[^>]*(?:src|href)="https?:\/\//i, `${file} imports external assets`);
}
console.log('Project links, version, offline runtime, and Content Security Policy verified.');
