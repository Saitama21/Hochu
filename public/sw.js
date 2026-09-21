const CACHE='hochu-static-v1.6.0-dockfix1';
const STATIC=['/assets/icons/favicon-32.png','/assets/icons/favicon-64.png','/assets/icons/favicon.ico','/assets/icons/icon-192.png','/assets/icons/icon-512.png','/assets/icons/icon-1024.png','/assets/icons/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
  self.clients.claim()
])));
self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);
  if(req.method!=='GET' || url.origin!==self.location.origin) return;
  // Always go to Railway for app shell/code/data so deployments cannot mix versions.
  if(url.pathname==='/' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.startsWith('/api/')) return;
  if(url.pathname.startsWith('/assets/icons/')){
    event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res;})));
  }
});
