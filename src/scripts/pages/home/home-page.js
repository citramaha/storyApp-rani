import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getData } from "../../data/api.js";
import PushHelper from "../../utils/push-helper";
import IdbHelper from "../../data/idb.js";

export default class HomePage {
  async render() {
    return `
      <section class="container">
        <h1>Home Page</h1>
        <button id="toggle-push">Aktifkan Notifikasi</button>
        <div id="map" style="height: 400px; border-radius: 12px; margin-bottom: 20px;"></div>
        <input type="text" id="search-input" placeholder="Cari cerita..." style="margin-bottom: 10px; width:100%; padding:8px;">

        <h2>Daftar Cerita</h2>
        <div id="stories-list" class="stories-list"></div>
      </section>
    `;
  }

  async afterRender() {
    const btn = document.getElementById("toggle-push");

    if ("serviceWorker" in navigator && "PushManager" in window) {
      const registration = await navigator.serviceWorker.ready;
      const isSubscribed = localStorage.getItem("pushSubscribed");

      btn.textContent = isSubscribed ? "Nonaktifkan Notifikasi" : "Aktifkan Notifikasi";

    btn.addEventListener("click", async () => {

      const subscribedNow = localStorage.getItem("pushSubscribed");

  if (subscribedNow) {
    console.log("🔕 Menonaktifkan notifikasi...");
    await PushHelper.unregisterPush(registration);
    localStorage.removeItem("pushSubscribed");
    btn.textContent = "Aktifkan Notifikasi";
  } else {
    console.log("🔔 Mengaktifkan notifikasi...");
    await PushHelper.registerPush(registration);
    localStorage.setItem("pushSubscribed", "true");
    btn.textContent = "Nonaktifkan Notifikasi";
  }
});
}

const storiesContainer = document.querySelector("#stories-list");

let data;
try {
  data = await getData();
  if (data.listStory && data.listStory.length > 0) {
    // Simpan ke IndexedDB
    await IdbHelper.clearStories();
    for (const story of data.listStory) {
      await IdbHelper.addStory(story);
    }
  }
} catch (err) {
  console.warn("Gagal ambil dari API, gunakan data lokal.");
  const localStories = await IdbHelper.getAllStories();
  data = { listStory: localStories };
}

    if (!data.listStory || data.listStory.length === 0) {
      storiesContainer.innerHTML = `<p>Tidak ada data story atau kamu belum login.</p>`;
      return;
    }

    const baseLayers = {
      OpenStreetMap: L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "&copy; OpenStreetMap contributors",
        },
      ),
      "Esri Satellite": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles © Esri" },
      ),
    };

    const map = L.map("map", {
      center: [-2.5, 118],
      zoom: 5,
      layers: [baseLayers.OpenStreetMap],
    });

    L.control.layers(baseLayers).addTo(map);

    const markers = [];

    data.listStory.forEach((story) => {
      const { name, description, photoUrl, lat, lon } = story;

      if (lat && lon) {
        const marker = L.marker([lat, lon]).addTo(map);
        marker.bindPopup(`
          <b>${name}</b><br>${description}<br>
          <img src="${photoUrl}" width="100" />
        `);
        markers.push({ marker, lat, lon });
      }

      const storyCard = document.createElement("div");
      storyCard.className = "story-card";
      storyCard.setAttribute("tabindex", "0");
      storyCard.innerHTML = `
        <img src="${photoUrl}" alt="${name}" loading="lazy" />
        <div class="story-info">
          <h3>${name}</h3>
          <p>${description}</p>
          ${lat && lon ? `<small>Koordinat: ${lat.toFixed(2)}, ${lon.toFixed(2)}</small>` : ""}
        </div>
      `;

      if (lat && lon) {
        storyCard.addEventListener("click", () => {
          map.setView([lat, lon], 10, { animate: true });
          const targetMarker = markers.find(
            (m) => m.lat === lat && m.lon === lon,
          );
          if (targetMarker) targetMarker.marker.openPopup();

          document
            .querySelectorAll(".story-card")
            .forEach((c) => c.classList.remove("active"));
          storyCard.classList.add("active");
        });
      }

      storiesContainer.appendChild(storyCard);
    });
    
    const searchInput = document.getElementById("search-input");

    searchInput.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase();
      const cards = document.querySelectorAll(".story-card");

      cards.forEach((card) => {
        const title = card.querySelector("h3").textContent.toLowerCase();
        card.style.display = title.includes(keyword) ? "block" : "none";
      });
    });
  }
}


