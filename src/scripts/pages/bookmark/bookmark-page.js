// src/scripts/pages/bookmark/bookmark-page.js
import BookmarkIdb from "../../data/bookmark-idb.js";

export default class BookmarkPage {
  async render() {
    return `
      <section class="container">
        <h1>Favorit</h1>
        <input id="fav-search" type="text" placeholder="Cari favorit..." style="width:100%; padding:8px; margin-bottom:12px;">
        <div id="bookmark-list" class="stories-list"></div>
      </section>
    `;
  }

  async afterRender() {
    const container = document.getElementById("bookmark-list");
    const searchInput = document.getElementById("fav-search");

    const renderList = async () => {
      container.innerHTML = "";
      const stories = await BookmarkIdb.getAll();

      if (!stories || stories.length === 0) {
        container.innerHTML = "<p>Belum ada favorit.</p>";
        return;
      }

      const keyword = searchInput.value.toLowerCase();

      stories.forEach((story) => {
        const { id, name, description, photoUrl, lat, lon } = story;
        if (keyword && !name.toLowerCase().includes(keyword)) return;

        const div = document.createElement("div");
        div.className = "story-card";
        div.innerHTML = `
          <img src="${photoUrl}" alt="${name}" loading="lazy" />
          <div class="story-info">
            <h3>${name}</h3>
            <p>${description}</p>
            ${lat && lon ? `<small>Koordinat: ${lat.toFixed(2)}, ${lon.toFixed(2)}</small>` : ""}
            <div style="margin-top:8px;">
              <button class="remove-fav" data-id="${id}" style="background:#ff4d4f;color:white;border:none;padding:6px 10px;border-radius:8px;cursor:pointer;">❌ Hapus</button>
            </div>
          </div>
        `;
        container.appendChild(div);

        div.querySelector(".remove-fav").addEventListener("click", async (e) => {
          e.stopPropagation();
          const confirmDelete = confirm("Hapus dari favorit?");
          if (!confirmDelete) return;
          await BookmarkIdb.remove(id);
          await renderList();
        });
      });
    };

    searchInput.addEventListener("input", renderList);
    await renderList();
  }
}
