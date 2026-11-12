import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

if (!baseURL) {
  throw new Error("VITE_API_URL is missing in the frontend .env configuration.");
}

const TOKEN_STORAGE_KEY = "qr_admin_token";

export function setAuthToken(token) {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage access errors when browser privacy settings block sessionStorage.
  }
}

export function getAuthToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
    }
    return Promise.reject(error);
  }
);

export async function saveFile(url, filename) {
  const { data } = await api.get(url, { responseType: "blob" });
  const objectUrl = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function errorMessage(error) {
  const response = error.response?.data;
  const fields = response?.errors?.map((item) => item.message).filter(Boolean);
  if (fields?.length) return `${response.message} ${fields.join(" ")}`;
  return response?.message || error.message || "Something went wrong. Please try again.";
}

export default api;
