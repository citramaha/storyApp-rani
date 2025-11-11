import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { postData} from "../../data/api.js";
import IdbHelper from "../../data/idb.js";

export default class AddStoryPage {
  #map = null;
  #lat = null;
  #lon = null;

  async render() {
    return `
      <section class="container">
        <h1>Tambah Story Baru</h1>
        <form aria-label="Form Tambah Story" id="add-story-form" class="add-story-form">
          <div>
            <label for="description">Deskripsi:</label><br>
            <textarea id="description" name="description" required></textarea>
          </div>

          <div>
            <label for="photo">Foto:</label><br>
            <input type="file" id="photo" name="photo" accept="image/*" required>
           
            <div style="margin-top: 10px;">
                <button type="button" id="open-camera">Gunakan Kamera</button>
                <button type="button" id="capture-photo" disabled>Ambil Foto</button>
                <button type="button" id="close-camera" disabled>Tutup Kamera</button>
            </div>

            <video id="camera-preview" autoplay playsinline style="display:none; width:100%; border-radius:8px; margin-top:10px;"></video>
            <canvas id="photo-canvas" style="display:none;"></canvas>
            <img id="photo-preview" alt="Preview foto" style="display:none; width:100%; border-radius:8px; margin-top:10px;"/>
          </div>

          <div id="map" style="height:300px; margin-top:10px;"></div>
          <p id="coords" style="margin-top:5px;">Klik pada peta untuk memilih lokasi.</p>

          <button type="submit" style="margin-top:15px;">Kirim Story</button>
        </form>
        <p id="message"></p>
      </section>
    `;
  }

  async afterRender() {
    this.#map = L.map("map").setView([-6.2, 106.8], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(this.#map);

    const openCameraBtn = document.getElementById("open-camera");
    const capturePhotoBtn = document.getElementById("capture-photo");
    const closeCameraBtn = document.getElementById("close-camera");
    const video = document.getElementById("camera-preview");
    const canvas = document.getElementById("photo-canvas");
    const photoPreview = document.getElementById("photo-preview");
    let stream = null;

    openCameraBtn.addEventListener("click", async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.style.display = "block";
        capturePhotoBtn.disabled = false;
        closeCameraBtn.disabled = false;
        openCameraBtn.disabled = true;
      } catch (err) {
        alert("Tidak dapat mengakses kamera: " + err.message);
      }
    });

    capturePhotoBtn.addEventListener("click", () => {
      if (!stream) return;
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const file = new File([blob], "camera-photo.jpg", {type: "image/jpeg",});
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        document.getElementById("photo").files = dataTransfer.files;

        const photoURL = URL.createObjectURL(blob);
        photoPreview.src = photoURL;
        photoPreview.style.display = "block";
      }, "image/jpeg");

      stream.getTracks().forEach((track) => track.stop());
      stream = null;
      video.style.display = "none";
      capturePhotoBtn.disabled = true;
      closeCameraBtn.disabled = true;
      openCameraBtn.disabled = false;
      alert("Foto berhasil diambil dan disiapkan untuk dikirim.");
    });

    closeCameraBtn.addEventListener("click", () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      video.style.display = "none";
      capturePhotoBtn.disabled = true;
      closeCameraBtn.disabled = true;
      openCameraBtn.disabled = false;
    });

    this.#map.on("click", (e) => {
      this.#lat = e.latlng.lat;
      this.#lon = e.latlng.lng;
      L.marker([this.#lat, this.#lon]).addTo(this.#map);
      document.getElementById("coords").textContent =
        `Lokasi dipilih: ${this.#lat}, ${this.#lon}`;
    });

    const form = document.getElementById("add-story-form");
    const messageEl = document.getElementById("message");

  form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const description = document.getElementById("description").value;
  const photo = document.getElementById("photo").files[0];

  if (!this.#lat || !this.#lon) {
    messageEl.textContent = "Mohon pilih lokasi di peta terlebih dahulu.";
    return;
  }

let imageBlob = null;

if (photo && photo instanceof File) {
  const buffer = await photo.arrayBuffer();
  imageBlob = new Blob([buffer], { type: photo.type });
}

const storyData = {
  description,
  image: imageBlob,
  lat: this.#lat,
  lon: this.#lon,
  date: new Date().toISOString(),
};

  if (navigator.onLine) {
    try {
      messageEl.textContent = "Loading: Mengirim data...";
      const result = await postData(description, photo, this.#lat, this.#lon);

      if (result.error) throw new Error(result.message);
      messageEl.textContent = "✅ Story berhasil ditambahkan!";

      form.reset();
      this.#map.eachLayer((layer) => {
        if (layer instanceof L.Marker) this.#map.removeLayer(layer);
      });
      document.getElementById("coords").textContent =
        "Klik pada peta untuk memilih lokasi.";
      photoPreview.style.display = "none";

      setTimeout(() => {
        location.hash = "/";
      }, 2000);
    } catch (error) {
      console.error(error);
      messageEl.textContent = "Gagal menambahkan story. Coba lagi.";
    }
  } else {
    await IdbHelper.addPendingStory(storyData);
    messageEl.textContent =
          "📦 Anda sedang offline. Story disimpan sementara dan akan dikirim otomatis saat online.";

        form.reset();
        this.#map.eachLayer((layer) => {
          if (layer instanceof L.Marker) this.#map.removeLayer(layer);
        });
        document.getElementById("coords").textContent = "Klik pada peta untuk memilih lokasi.";
        photoPreview.style.display = "none";
      }
    });

    window.addEventListener("beforeunload", () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    });

    requestAnimationFrame(() => {
      const section = document.querySelector(".container");
      if (section) section.classList.add("fade-in");
    });
  }
}