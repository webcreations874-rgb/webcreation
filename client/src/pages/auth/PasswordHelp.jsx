import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api, { errorMessage } from "../../services/api";

export default function PasswordHelp({ reset = false }) {
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (reset) {
        const { data } = await api.post("/auth/reset-password", { token: params.get("token"), password });
        toast.success(data.message);
      } else {
        const { data } = await api.post("/auth/forgot-password", { email });
        toast.success(data.message);
      }
      setDone(true);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <aside className="login-aside"><div className="brand p-0"><span className="brand-mark">✓</span><span><span className="brand-name">Record Verify</span><span className="brand-subtitle">Organization portal</span></span></div><div><h1>Account recovery</h1><p>Password reset links expire after 30 minutes and can only be used once.</p></div><small className="text-white-50">Keep account recovery links private.</small></aside>
      <main className="login-form-area">
        <form className="login-card" onSubmit={submit}>
          <h2>{reset ? "Choose a new password" : "Forgot your password?"}</h2>
          <p className="intro">{done ? "Your request has been submitted." : reset ? "Create a strong password to secure your account." : "Enter your administrator email and we'll send a recovery link if an active account is found."}</p>
          {!done && (reset ? <>
            <label htmlFor="new-password" className="form-label">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="form-control mb-3" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="field-hint mb-3">Use at least 12 characters.</div>
          </> : <>
            <label htmlFor="email" className="form-label">Email address</label>
            <input id="email" type="email" autoComplete="email" required className="form-control mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />
          </>)}
          {!done && <button className="btn btn-primary w-100 py-2" disabled={busy}>{busy ? "Please wait…" : reset ? "Update password" : "Send recovery link"}</button>}
          <Link className="d-block text-center mt-4 small text-decoration-none" to="/admin/login">Back to sign in</Link>
        </form>
      </main>
    </div>
  );
}
