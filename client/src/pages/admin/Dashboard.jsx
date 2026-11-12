import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiActivity, FiCheckCircle, FiFileText, FiPlusCircle, FiXCircle } from "react-icons/fi";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "react-toastify";
import StatusBadge from "../../components/StatusBadge";
import api, { errorMessage } from "../../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    Promise.all([api.get("/dashboard/stats"), api.get("/dashboard/recent-records")])
      .then(([statsResponse, recordsResponse]) => {
        setStats(statsResponse.data.stats);
        setRecent(recordsResponse.data.records);
      })
      .catch((error) => toast.error(errorMessage(error)));
  }, []);

  const cards = [
    ["Total records", stats?.total ?? "—", <FiFileText key="records" />],
    ["Active records", stats?.active ?? "—", <FiCheckCircle key="active" />],
    ["Revoked records", stats?.revoked ?? "—", <FiXCircle key="revoked" />],
    ["Created today", stats?.createdToday ?? "—", <FiPlusCircle key="today" />],
    ["QR codes generated", stats?.qrCodesGenerated ?? "—", <FiActivity key="qrs" />]
  ];
  return (
    <>
      <div className="page-heading"><div><h1>Dashboard</h1><p>Overview of your organization's records and verification activity.</p></div><Link to="/admin/records/new" className="btn btn-primary">+ Add new record</Link></div>
      <div className="stat-grid">
        {cards.map(([label, value, icon]) => <div className="stat-card" key={label}><div className="stat-top"><span className="stat-label">{label}</span><span className="stat-icon">{icon}</span></div><strong className="stat-value">{value}</strong></div>)}
        <div className="stat-card"><div className="stat-top"><span className="stat-label">QR verifications</span><span className="stat-icon"><FiActivity /></span></div><strong className="stat-value">{stats?.verifications ?? "—"}</strong></div>
      </div>
      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <section className="panel chart-panel">
            <h2 className="panel-title">Records created over time</h2><p className="panel-subtitle">Monthly record creation for the recent period</p>
            {stats?.monthly?.length ? <ResponsiveContainer width="100%" height={225}>
              <LineChart data={stats.monthly} margin={{ left: -20, right: 12, top: 10 }}>
                <CartesianGrid stroke="#edf0f4" vertical={false} />
                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: "#738095" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#738095" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#138a8a" strokeWidth={3} dot={{ r: 4, fill: "#138a8a" }} />
              </LineChart>
            </ResponsiveContainer> : <div className="empty-state">{stats ? "No records have been created in the reporting period." : "Loading dashboard data…"}</div>}
          </section>
        </div>
        <div className="col-12 col-xl-5">
          <section className="panel h-100">
            <div className="d-flex justify-content-between align-items-center mb-3"><h2 className="panel-title">Recent records</h2><Link to="/admin/records" className="small text-decoration-none">View all</Link></div>
            {!recent.length ? <div className="empty-state">Records you create will appear here.</div> : recent.map((record) => <Link key={record._id} to={`/admin/records/${record._id}`} className="d-flex justify-content-between align-items-center py-3 border-bottom text-decoration-none">
              <span className="person-cell"><strong>{record.fullName}</strong><small>{record.registrationNumber}</small></span><StatusBadge status={record.status} />
            </Link>)}
          </section>
        </div>
      </div>
    </>
  );
}
