import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/authContext";
import api, { errorMessage } from "../../services/api";

export default function Profile() {
  const { admin, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(admin?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function updateName(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.put("/auth/profile", { name });
      await refresh();
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put("/auth/password", { currentPassword, newPassword });
      toast.success(data.message);
      try {
        await logout();
      } catch {
        toast.error("The server could not confirm sign-out. The local session has been cleared.");
      }
      navigate("/admin/login");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading"><div><h1>Administrator profile</h1><p>Update your account information and credentials.</p></div></div>
      <div className="row g-3">
        <div className="col-12 col-xl-6"><form className="form-panel" onSubmit={updateName}>
          <h2 className="form-section-title">Profile information</h2>
          <label className="form-label" htmlFor="admin-name">Name</label><input id="admin-name" className="form-control mb-3" maxLength={120} required value={name} onChange={(e) => setName(e.target.value)} />
          <label className="form-label" htmlFor="admin-email">Email address</label><input id="admin-email" className="form-control mb-3" value={admin?.email || ""} readOnly />
          <button className="btn btn-primary" disabled={busy}>Save profile</button>
        </form></div>
        <div className="col-12 col-xl-6"><form className="form-panel" onSubmit={updatePassword}>
          <h2 className="form-section-title">Change password</h2>
          <label className="form-label" htmlFor="current-password">Current password</label><input id="current-password" type="password" autoComplete="current-password" className="form-control mb-3" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <label className="form-label" htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} className="form-control mb-2" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <p className="field-hint mb-3">At least 12 characters. Changing your password ends this session.</p>
          <button className="btn btn-primary" disabled={busy}>Update password</button>
        </form></div>
      </div>
    </>
  );
}
