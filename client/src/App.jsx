import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/authContext";
import AdminLayout from "./layouts/AdminLayout";

const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AddRecord = lazy(() => import("./pages/admin/AddRecord"));
const ManageRecords = lazy(() => import("./pages/admin/ManageRecords"));
const RecordDetails = lazy(() => import("./pages/admin/RecordDetails"));
const VerificationLogs = lazy(() => import("./pages/admin/VerificationLogs"));
const QRManagement = lazy(() => import("./pages/admin/QRManagement"));
const Profile = lazy(() => import("./pages/admin/Profile"));
const Login = lazy(() => import("./pages/auth/Login"));
const PasswordHelp = lazy(() => import("./pages/auth/PasswordHelp"));
const VerifyRecord = lazy(() => import("./pages/public/VerifyRecord"));

function Protected({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <div className="screen-loader">Loading your secure workspace…</div>;
  return admin ? children : <Navigate to="/admin/login" replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="screen-loader">Loading…</div>}>
      <Routes>
        <Route path="/verify/:verificationId" element={<VerifyRecord />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/forgot-password" element={<PasswordHelp />} />
        <Route path="/admin/reset-password" element={<PasswordHelp reset />} />
        <Route path="/admin" element={<Protected><AdminLayout /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="records/new" element={<AddRecord />} />
          <Route path="records" element={<ManageRecords />} />
          <Route path="records/:id" element={<RecordDetails />} />
          <Route path="qr-codes" element={<QRManagement />} />
          <Route path="logs" element={<VerificationLogs />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter><Application /></BrowserRouter>
  );
}

function Application() {
  const isAdminArea = useLocation().pathname.startsWith("/admin");
  const content = <><AppRoutes /><ToastContainer position="top-right" autoClose={3500} /></>;
  return isAdminArea ? <AuthProvider>{content}</AuthProvider> : content;
}
