import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiActivity, FiArchive, FiFilePlus, FiGrid, FiLogOut, FiMenu, FiUser, FiMaximize2
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../context/authContext";

const links = [
  { to: "/admin", label: "Dashboard", icon: <FiGrid />, end: true },
  { to: "/admin/records/new", label: "Add new record", icon: <FiFilePlus /> },
  { to: "/admin/records", label: "Manage records", icon: <FiArchive /> },
  { to: "/admin/qr-codes", label: "QR code management", icon: <FiMaximize2 /> },
  { to: "/admin/logs", label: "Verification logs", icon: <FiActivity /> },
  { to: "/admin/profile", label: "Administrator profile", icon: <FiUser /> }
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const title = links.find((item) => item.to === location.pathname)?.label || "Record details";

  async function signOut() {
    try {
      await logout();
    } catch {
      toast.error("The server could not confirm sign-out. The local session has been cleared.");
    }
    navigate("/admin/login");
  }

  return (
    <div className="app-shell">
      <button className={`overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)} aria-label="Close navigation" />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <NavLink className="brand" to="/admin" onClick={() => setOpen(false)}>
          <span className="brand-mark">✓</span>
          <span><span className="brand-name">Record Verify</span><span className="brand-subtitle">Organization portal</span></span>
        </NavLink>
        <div className="nav-caption">Workspace</div>
        <nav>
          {links.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `side-link${isActive ? " active" : ""}`}>
              {icon}<span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user"><strong>{admin?.name}</strong><small>{admin?.email}</small></div>
          <button type="button" className="side-link side-button" onClick={signOut}><FiLogOut /> Sign out</button>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="d-flex align-items-center gap-2">
            <button type="button" className="menu-toggle" onClick={() => setOpen(true)} aria-label="Open navigation"><FiMenu /></button>
            <span className="topbar-title">Workspace / <strong>{title}</strong></span>
          </div>
          <span className="topbar-title d-none d-sm-inline">Secure administrator access</span>
        </header>
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  );
}
