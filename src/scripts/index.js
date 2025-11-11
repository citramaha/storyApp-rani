import "../styles/styles.css";
import App from "./pages/app";
import IdbHelper from './data/idb.js';
import { postStory } from './data/api.js';
import syncPendingStories from "./sync-handler.js";

window.addEventListener('online', async () => {
  console.log('KONEKSI: online — melakukan sinkronisasi pending...');
  await syncPendingStories();
});


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => console.log("SW registered:", registration.scope))
      .catch((err) => console.error("SW registration failed:", err));
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const token = localStorage.getItem("token");

  if (!isLoggedIn || !token) {
    window.location.hash = "#/login";
  }
    
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  await app.renderPage(app);

  window.addEventListener('hashchange', async () => {
  if (!document.startViewTransition) {
    await app.renderPage(); 
    return;
  }

  document.startViewTransition(async () => {
    await app.renderPage();
  });
});

window.addEventListener('online', async () => {
  console.log('🌐 Koneksi kembali online, mulai sinkronisasi data offline...');

  const pendingStories = await IdbHelper.getAllPendingStories();

  for (const story of pendingStories) {
  const photoFile = new File([story.image], "photo.jpg", { type: story.image.type || "image/jpeg" });

  const result = await postStory(story.description, photoFile, story.lat, story.lon);

  if (!result.error) {
    console.log("✅ Cerita tersinkron:", story.description);
  } else {
    console.error("❌ Gagal sinkron:", result.message);
  }
}
  await IdbHelper.clearPendingStories();
});

const skipLink = document.querySelector(".skip-link");
  if (skipLink) {
    skipLink.addEventListener("click", (event) => {
      const storyList = document.querySelector("#story-list");
      if (storyList) {
        event.preventDefault();
        storyList.scrollIntoView({ behavior: "smooth" });
        storyList.focus();
      }
    });
  }

});

