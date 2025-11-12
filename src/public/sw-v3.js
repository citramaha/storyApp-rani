/* eslint-disable no-restricted-globals */

const BASE = self.location.pathname.includes('/storyApp-rani/')
  ? '/storyApp-rani/'
  : '/';

const STATIC_CACHE = "storyapp-static-v2";
const DYNAMIC_CACHE = "storyapp-dynamic-v1";

const STATIC_ASSETS = [
  BASE,
  BASE + "index.html",
  BASE + "scripts/index.js",
  BASE + "images/icons/icon-96x96.png",
  BASE + "images/icons/icon-192x192.png",
];

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing…");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  ); 
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);


  if (requestUrl.origin.includes("story-api.dicoding.dev")) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);
          
         if (event.request.method === "GET") {
            cache.put(event.request, networkResponse.clone());
            console.log(`[Service Worker] ✅ Cached (GET): ${event.request.url}`);
          } else {
            console.log(`[Service Worker] ⏩ Skipped cache (method: ${event.request.method})`);
          }

          return networkResponse;

        } catch (error) {
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) return cachedResponse;

          return new Response(
            JSON.stringify({
              error: true,
              message: "Offline - data tidak tersedia.",
              listStory: [],
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
      })
    );
    return;
  }

 
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => caches.match(BASE +"/index.html"))
      );
    })
  );
});


self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push diterima:", event);

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || "Story Baru dari Story App!";
  const options = data.options || {
    body: "Ada story baru!",
    icon: BASE + "/images/icons/icon-192x192.png",
    badge: BASE + "/images/icons/icon-96x96.png",
    data: {
      url: BASE  
    },
    actions: [
      { action: "open", title: "Lihat Story" },
      { action: "dismiss", title: "Tutup" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "open") {
    event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
  }
});


