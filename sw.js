/* WebChem offline-first app shell. Never cache API/auth/account responses. */
const CACHE_NAME='webchem-shell-v4';
const BASE=new URL('./',self.location.href);
const APP_URL=new URL('./index.html',BASE).href;
const SHELL=[BASE.href,APP_URL,new URL('./manifest.webmanifest',BASE).href];

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('webchem-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',event=>{
 if(event.data?.type==='WEB CHEM_SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||req.headers.has('range'))return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 const path=url.pathname.toLowerCase();
 // Never store API, authentication, progress, or user-specific responses.
 if(path.includes('/api/')||path.endsWith('/api')||path.includes('/auth')||path.includes('/progress')||path.includes('/profile')||path.includes('/account'))return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(APP_URL,copy));}
   return response;
  }).catch(async()=>{
   const cached=await caches.match(req,{ignoreSearch:true});
   return cached||await caches.match(APP_URL)||new Response('WebChem is offline. Open the app once while online to save its learning shell.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }));
  return;
 }
 // Cache only static same-origin assets, not arbitrary data or JSON.
 if(!/\.(css|js|mjs|png|jpg|jpeg|webp|svg|woff2?|ttf|ico|webmanifest)$/i.test(path))return;
 event.respondWith(caches.open(CACHE_NAME).then(async cache=>{
  const cached=await cache.match(req);
  const network=fetch(req).then(response=>{
   if(response.ok&&response.type==='basic')cache.put(req,response.clone());
   return response;
  }).catch(()=>null);
  return cached||await network||Response.error();
 }));
});
