const CACHE_NAME='webchem-shell-v3';
const BASE=new URL('./',self.location.href);
const SHELL=[new URL('./',BASE).href,new URL('./index.html',BASE).href,new URL('./manifest.webmanifest',BASE).href];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('webchem-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin)return;
 // Never cache API/auth/progress responses: they may contain private or account-specific data.
 const path=url.pathname.toLowerCase();
 if(['/api','/auth','/progress'].some(prefix=>path===prefix||path.startsWith(prefix+'/')))return;
 event.respondWith(fetch(req).then(response=>{if(response&&response.ok&&url.href.startsWith(BASE.href)){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));}return response}).catch(()=>caches.match(req).then(cached=>cached||(req.mode==='navigate'?caches.match(new URL('./index.html',BASE).href):Response.error()))));
});
