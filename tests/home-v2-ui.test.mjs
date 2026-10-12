import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../public/home-v2.css', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));

const allIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const ids = new Set(allIds);

test('all DOM IDs used by the existing app are still present and unique', () => {
  assert.equal(allIds.length, ids.size, 'Duplicate IDs prevent reliable event binding');
  const usedIds = [...app.matchAll(/\$\('([A-Za-z]\w*)'\)/g)].map(match => match[1]);
  for (const id of usedIds) assert.ok(ids.has(id), 'Missing DOM element: ' + id);
});

test('existing home renderer keeps its live data targets', () => {
  for (const id of [
    'statCount', 'statSaved', 'statSavedSub', 'statOrdered', 'statBought',
    'statActiveText', 'totalActive', 'overallBar', 'overallText',
    'homeSearch', 'homeSort', 'homeTabs', 'homeList', 'homeEmpty', 'mobileAdd'
  ]) assert.ok(ids.has(id), 'Missing dashboard target: ' + id);
  for (const status of ['all','want','plan','ordered','bought']) {
    assert.ok(html.includes('data-status="' + status + '"'));
  }
});

test('bottom navigation exposes home, wishes, statistics and profile', () => {
  const navMarkup = html.match(/<nav id="mobileNav"[\s\S]*?<\/nav>/)?.[0] ?? '';
  const views = [...navMarkup.matchAll(/class="mobile-nav-item[^"]*" data-view="([^"]+)"/g)]
    .map(match => match[1]);
  assert.deepEqual(views, ['home','purchases','stats','settings']);
  assert.match(navMarkup, /id="mobileAdd"/);
  assert.match(styles, /\.mobile-nav,\.mobile-nav\.is-hidden\s*\{/);
  assert.match(styles, /position:fixed!important/);
});

test('new light/dark style is loaded and PWA name changes without breaking share target', () => {
  assert.ok(html.includes('/home-v2.css?v=2.0.0'));
  assert.ok(styles.includes('html[data-theme="dark"]'));
  assert.ok(styles.includes('html[data-theme="system"]'));
  assert.equal(manifest.name,'Список желаний');
  assert.equal(manifest.id,'/');
  assert.equal(manifest.share_target.action,'/share-target');
});
