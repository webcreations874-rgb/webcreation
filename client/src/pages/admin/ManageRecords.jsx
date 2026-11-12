import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiDownload, FiEye, FiPrinter } from "react-icons/fi";
import StatusBadge from "../../components/StatusBadge";
import api, { errorMessage, saveFile } from "../../services/api";

export default function ManageRecords() {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: "", status: "", recordType: "", from: "", to: "", sort: "createdAt", order: "desc" });
  const [busy, setBusy] = useState(true);

  const load = useCallback(async (page = 1) => {
    setBusy(true);
    try {
      const { data } = await api.get("/records", { params: { ...filters, page, limit: 10 } });
      setRecords(data.records);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }, [filters]);

  useEffect(() => {
    let active = true;
    api.get("/records", { params: { ...filters, page: 1, limit: 10 } })
      .then(({ data }) => {
        if (active) {
          setRecords(data.records);
          setPagination(data.pagination);
        }
      })
      .catch((error) => { if (active) toast.error(errorMessage(error)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [filters]);

  async function updateStatus(record, status) {
    const action = status === "revoked" ? "revoke" : status === "active" ? "restore" : "archive";
    if (!window.confirm(`Are you sure you want to ${action} this record?`)) return;
    try {
      await api.patch(`/records/${record._id}/status`, { status });
      toast.success(`Record ${status}.`);
      load(pagination.page);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function download(record, format) {
    try {
      const ext = format === "pdf" ? "pdf" : "png";
      await saveFile(`/records/${record._id}/qr?format=${ext}`, `qr-${record.registrationNumber}.${ext}`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <>
      <div className="page-heading"><div><h1>Manage records</h1><p>Search, review, and manage the organization's records.</p></div><Link className="btn btn-primary" to="/admin/records/new">+ Add record</Link></div>
      <section className="panel">
        <div className="search-toolbar">
          <input className="form-control search-input" placeholder="Search name, registration or verification ID" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option><option value="active">Active</option><option value="revoked">Revoked</option><option value="archived">Archived</option></select>
          <input className="form-control" placeholder="Record type" aria-label="Filter by record type" value={filters.recordType} onChange={(e) => setFilters({ ...filters, recordType: e.target.value })} />
          <input type="date" className="form-control" aria-label="From registration date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <input type="date" className="form-control" aria-label="To registration date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          <select className="form-select" aria-label="Sort records" value={`${filters.sort}:${filters.order}`} onChange={(e) => { const [sort, order] = e.target.value.split(":"); setFilters({ ...filters, sort, order }); }}>
            <option value="createdAt:desc">Newest first</option><option value="registrationDate:desc">Registration date: newest</option><option value="registrationDate:asc">Registration date: oldest</option><option value="fullName:asc">Name: A–Z</option>
          </select>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Registration</th><th>Person</th><th>Record type</th><th>Registration date</th><th>Verification ID</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {records.map((record) => <tr key={record._id}>
                <td>{record.registrationNumber}</td>
                <td className="person-cell"><strong>{record.fullName}</strong></td>
                <td>{record.recordType}</td>
                <td>{new Date(record.registrationDate).toLocaleDateString()}</td>
                <td><code>{record.verificationId.slice(0, 9)}…</code></td>
                <td><StatusBadge status={record.status} /></td>
                <td><div className="action-group">
                  <Link className="action-btn" title="View details" to={`/admin/records/${record._id}`}><FiEye /></Link>
                  <button className="action-btn" title="Download QR PNG" onClick={() => download(record, "png")}><FiDownload /></button>
                  <button className="action-btn" title="Print record details" onClick={() => window.open(`/admin/records/${record._id}?print=1`, "_blank", "noopener,noreferrer")}><FiPrinter /></button>
                  {record.status === "active" ? <button className="action-btn text-danger" onClick={() => updateStatus(record, "revoked")}>Revoke</button> : <button className="action-btn text-success" onClick={() => updateStatus(record, "active")}>Restore</button>}
                  {record.status !== "archived" && <button className="action-btn" onClick={() => updateStatus(record, "archived")}>Archive</button>}
                </div></td>
              </tr>)}
            </tbody>
          </table>
          {!records.length && <div className="empty-state"><strong>{busy ? "Loading records…" : "No records found"}</strong>{!busy && "Try changing the search or filters, or add a new record."}</div>}
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3 small text-secondary">
          <span>{pagination.total} records</span>
          <div className="d-flex gap-2 align-items-center">
            <button className="btn btn-sm btn-outline-secondary" disabled={pagination.page <= 1 || busy} onClick={() => load(pagination.page - 1)}>Previous</button>
            <span>Page {pagination.page} of {Math.max(pagination.pages, 1)}</span>
            <button className="btn btn-sm btn-outline-secondary" disabled={pagination.page >= pagination.pages || busy} onClick={() => load(pagination.page + 1)}>Next</button>
          </div>
        </div>
      </section>
    </>
  );
}
