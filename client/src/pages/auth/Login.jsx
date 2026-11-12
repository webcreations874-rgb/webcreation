import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiShield } from "react-icons/fi";
import { useAuth } from "../../context/authContext";
import { errorMessage } from "../../services/api";

export default function Login() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  if (admin) return <Navigate to="/admin" replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await login(form.identifier, form.password);
      navigate("/admin");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <aside className="login-aside">
        <div className="brand p-0"><span className="brand-mark">✓</span><span><span className="brand-name">Record Verify</span><span className="brand-subtitle">Organization portal</span></span></div>
        <div>
          <span className="badge rounded-pill text-bg-light px-3 py-2">PRIVATE ORGANIZATION SYSTEM</span>
          <h1>Trust, built on clear records.</h1>
          <p>Manage your organization's records, create secure QR codes, and provide controlled public verification.</p>
        </div>
        <small className="text-white-50">A record lookup confirms system presence only; it is not government authentication.</small>
      </aside>
      <main className="login-form-area">
        <form className="login-card" onSubmit={submit}>
          <div className="brand p-0 text-decoration-none"><span className="brand-mark brand-inverse"><FiShield /></span><span className="brand-name login-brand-title">Administrator sign in</span></div>
          <h2>Welcome back</h2><p className="intro">Use your authorized administrator account to continue.</p>
          <label className="form-label" htmlFor="identifier">Username or email address</label>
          <input id="identifier" type="text" autoComplete="username" required className="form-control mb-3" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} />
          <label className="form-label" htmlFor="password">Password</label>
          <div className="input-group mb-3">
            <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button>
          </div>
          <div className="text-end mb-4"><Link className="small text-decoration-none" to="/admin/forgot-password">Forgot password?</Link></div>
          <button type="submit" className="btn btn-primary w-100 py-2" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}</button>
          <div className="callout mt-4">Administrator accounts are provisioned by your organization's system operator. Public registration is disabled.</div>
        </form>
      </main>
    </div>
  );
}
