import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=file('public/index.html');
const js=file('public/app.js');
const styles=['public/home-v2.css','public/liquid-finance-v2.css','public/product-pages-v2.css'].map(file);
const appManifest=JSON.parse(file('public/manifest.webmanifest'));
const extensionManifest=JSON.parse(file('browser-extension/manifest.json'));

test('every screen and dialogue keeps its dynamic bindings after the full redesign',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size,'Duplicate element IDs');
  const required=['view-home','view-purchases','view-categories','view-stores','view-stats','view-admin',
    'view-settings','loginView','editorDialog','accessDialog','forgotDialog','resetPasswordDialog',
    'installGuideDialog','mobileNav','homeList','allList','categoryGrid','storesGrid',
    'categoryProgress','profileAvatarPreview'];
  for(const id of required)assert.ok(ids.includes(id),'Missing screen or panel '+id);
  for(const [,id] of js.matchAll(/\$\('([A-Za-z]\w*)'\)/g))assert.ok(ids.includes(id),'Broken DOM reference: '+id);
});
test('all product pages share the approved two-theme design and fixed mobile dock',()=>{
  for(const name of ['home-v2','liquid-finance-v2','product-pages-v2']){
    assert.ok(html.includes('/'+name+'.css?v=2.0.0'),'Missing CSS import: '+name);
  }
  const [home,liquid,rest]=styles;
  assert.match(liquid,/html\[data-theme="dark"\]/);
  assert.match(liquid,/prefers-color-scheme:dark/);
  for(const sel of ['#view-purchases','#view-categories','#view-stores','#view-stats','#view-settings','#view-admin','#editorDialog'])
    assert.ok(rest.includes(sel),'Missing full redesign screen: '+sel);
  assert.match(home,/\.mobile-nav,\.mobile-nav\.is-hidden\s*\{/);
  assert.match(rest,/transform:translateX\(-50%\)!important/);
  for(const css of styles)assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Unbalanced CSS');
});
test('brand identity, icons and user-facing app titles are consistent',()=>{
  assert.equal(appManifest.name,'Список желаний');
  assert.equal(appManifest.short_name,'Желания');
  assert.equal(extensionManifest.name,'В желания');
  assert.match(html,/<title>Список желаний/);
  assert.doesNotMatch(html,/«Хочу»/);
  assert.match(html,/wishlist-icon\.webp/);
  assert.match(file('server.js'),/const VERSION = '2.0.0'/);
  for(const name of ['favicon-32.png','icon-192.png','icon-512.png','apple-touch-icon.png']){
    assert.ok(appManifest.icons.some(icon=>icon.src.endsWith(name)) || html.includes(name),'Icon reference not found: '+name);
  }
});
test('preview examples cannot seed a connected production database',()=>{
  const server=file('server.js');
  assert.match(server,/PREVIEW_DEMO_ITEMS === '1' && !DATABASE_URL/);
  assert.match(server,/ADMIN_USERNAME === 'preview'/);
  assert.match(server,/if \(PREVIEW_DEMO\) seedPreviewWishlist\(id\)/);
});
