import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

if (!baseURL) {
  throw new Error("VITE_API_URL is missing in the frontend .env configuration.");
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

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
