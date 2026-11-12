import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api, { setAuthToken } from "../services/api";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/me")
      .then(({ data }) => setAdmin(data.admin))
      .catch((error) => {
        setAdmin(null);
        if (error.response?.status !== 401) {
          toast.error(error.response?.data?.message || "Unable to check the administrator session.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    admin,
    loading,
    async login(identifier, password) {
      const { data } = await api.post("/auth/login", { identifier, password });
      if (data.token) setAuthToken(data.token);
      setAdmin(data.admin);
    },
    async logout() {
      try {
        await api.post("/auth/logout");
      } finally {
        setAuthToken(null);
        setAdmin(null);
      }
    },
    async refresh() {
      const { data } = await api.get("/auth/me");
      setAdmin(data.admin);
    }
  }), [admin, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
