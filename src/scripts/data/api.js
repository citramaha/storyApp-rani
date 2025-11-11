import CONFIG from "../config";

const ENDPOINTS = {
  STORIES: `${CONFIG.BASE_URL}/stories`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  REGISTER: `${CONFIG.BASE_URL}/register`,
};

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email, password) {
  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.error) throw new Error(result.message);
    localStorage.setItem("token", result.loginResult.token);
    console.log("Token tersimpan:", result.loginResult.token);

    return result;
  } catch (error) {
    console.error("Gagal login:", error);
    return { error: true, message: error.message };
  }
}

export async function register(name, email, password) {
  try {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const result = await response.json();
    if (result.error) throw new Error(result.message);
    return result;
  } catch (error) {
    console.error("Gagal register:", error);
    return { error: true, message: error.message };
  }
}

export async function getData() {
  try {
    const response = await fetch(ENDPOINTS.STORIES, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error("Gagal mengambil data");
    return await response.json();
  } catch (error) {
    console.error("Terjadi kesalahan saat mengambil data:", error);
    return { listStory: [] };
  }
}

export async function postData(description, photo, lat, lon) {
  try {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("description", description);
    formData.append("photo", photo);

    if (lat && lon) {
      formData.append("lat", lat.toString());
      formData.append("lon", lon.toString());
    }

    const response = await fetch(ENDPOINTS.STORIES, {
      method: "POST",
      headers: new Headers({
        Authorization: `Bearer ${token}`,
      }),
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Gagal mengirim data");
    }

    return result;
  } catch (error) {
    console.error("Terjadi kesalahan saat menambahkan data:", error);
    return { error: true, message: error.message };
  }
}


export async function getVapidKey() {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/push/web/vapid`);
    if (!response.ok) throw new Error("Gagal mendapatkan VAPID key");
    const result = await response.json();
    return result.data.publicKey;
  } catch (error) {
    console.error("Error mengambil VAPID key:", error);
    throw error;
  }
}

export async function sendPushSubscription(subscription) {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/push/web/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) throw new Error("Gagal mendaftarkan subscription");
    return await response.json();
  } catch (error) {
    console.error("Error mengirim subscription:", error);
    throw error;
  }
}

export { postData as postStory };