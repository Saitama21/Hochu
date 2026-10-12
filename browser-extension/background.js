const BADGE_TIMEOUT = 2600;
const api = globalThis.browser || globalThis.chrome;
const DEFAULT_APP_URL = 'https://web-app-production-22f3.up.railway.app/';
const isSafari = /Safari/i.test(globalThis.navigator?.userAgent || '') && !/Chrome|Chromium|CriOS/i.test(globalThis.navigator?.userAgent || '');

function setBadge(text, color, title) {
  Promise.resolve(api.action.setBadgeBackgroundColor({ color })).catch(() => {});
  Promise.resolve(api.action.setBadgeText({ text })).catch(() => {});
  if (title) Promise.resolve(api.action.setTitle({ title })).catch(() => {});
  setTimeout(() => Promise.resolve(api.action.setBadgeText({ text: '' })).catch(() => {}), BADGE_TIMEOUT);
}

function normalizedAppUrl(value = '') {
  try {
    const url = new URL(String(value).trim());
    const local = ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) return '';
    url.hash = '';
    return url.href;
  } catch {
    return '';
  }
}

function encodePayload(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function configuredAppUrl() {
  const stored = await api.storage.sync.get({ appUrl: DEFAULT_APP_URL });
  return normalizedAppUrl(stored.appUrl) || DEFAULT_APP_URL;
}

api.runtime.onInstalled.addListener(async details => {
  if (details.reason !== 'install') return;
  const stored = await api.storage.sync.get({ appUrl: '' });
  if (!normalizedAppUrl(stored.appUrl)) await api.storage.sync.set({ appUrl: DEFAULT_APP_URL });
});

api.action.onClicked.addListener(async tab => {
  const appUrl = await configuredAppUrl();
  if (!appUrl) {
    setBadge('!', '#d97706', 'Сначала укажи адрес приложения «Список желаний»');
    if (api.runtime.openOptionsPage) await api.runtime.openOptionsPage();
    return;
  }
  if (!tab?.id || !/^https?:/i.test(tab.url || '')) {
    setBadge('!', '#dc2626', 'Эту вкладку нельзя прочитать');
    return;
  }

  try {
    const execution = await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['extractor.js']
    });
    const product = execution?.[0]?.result;
    if (!product?.url || !product?.title) throw new Error('Карточка товара не распознана');
    const payload = {
      version: 1,
      origin: isSafari ? 'hochu-safari-extension' : 'hochu-browser-extension',
      extensionVersion: api.runtime.getManifest().version,
      extractedAt: new Date().toISOString(),
      ...product
    };
    const target = new URL(appUrl);
    target.hash = `import=${encodePayload(payload)}`;
    await api.tabs.create({ url: target.href });
    setBadge(product.price ? '✓' : '?', product.price ? '#059669' : '#d97706', product.price ? `Цена ${product.price} ₴ передана в «Список желаний»` : 'Карточка передана без цены');
  } catch (error) {
    setBadge('!', '#dc2626', error?.message || 'Не удалось прочитать карточку');
  }
});
