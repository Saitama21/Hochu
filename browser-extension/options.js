const input = document.getElementById('appUrl');
const save = document.getElementById('save');
const status = document.getElementById('status');
const api = globalThis.browser || globalThis.chrome;
const DEFAULT_APP_URL = 'https://web-app-production-22f3.up.railway.app/';

function validate(value) {
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

api.storage.sync.get({ appUrl: DEFAULT_APP_URL }).then(({ appUrl }) => { input.value = appUrl || DEFAULT_APP_URL; });

save.addEventListener('click', async () => {
  const appUrl = validate(input.value);
  if (!appUrl) {
    status.textContent = 'Нужен полный HTTPS-адрес приложения.';
    status.className = 'error';
    return;
  }
  await api.storage.sync.set({ appUrl });
  input.value = appUrl;
  status.textContent = 'Адрес сохранён ✓ Теперь открой товар и нажми значок «В желания».';
  status.className = 'success';
});
