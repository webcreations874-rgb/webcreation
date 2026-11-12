import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { errorMessage } from "../../services/api";

export default function VerificationLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [busy, setBusy] = useState(true);

  const load = useCallback(async (page) => {
    setBusy(true);
    try {
      const { data } = await api.get("/admin/verification-logs", { params: { page, limit: 20 } });
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    api.get("/admin/verification-logs", { params: { page: 1, limit: 20 } })
      .then(({ data }) => {
        if (active) {
          setLogs(data.logs);
          setPagination(data.pagination);
        }
      })
      .catch((error) => { if (active) toast.error(errorMessage(error)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  return (
    <>
      <div className="page-heading"><div><h1>Verification logs</h1><p>Privacy-conscious history of public record lookup attempts.</p></div></div>
      <section className="panel">
        <div className="callout mb-3">Logs contain verification identifiers and status only. Visitor IP addresses are not stored.</div>
        <div className="table-wrap">
          <table className="data-table"><thead><tr><th>Verified at</th><th>Verification ID</th><th>Record</th><th>Result</th></tr></thead>
            <tbody>{logs.map((log) => <tr key={log._id}>
              <td>{new Date(log.verifiedAt).toLocaleString()}</td>
              <td><code>{log.verificationId.slice(0, 14)}…</code></td>
              <td>{log.recordId ? `${log.recordId.registrationNumber} · ${log.recordId.fullName}` : "No matching record"}</td>
              <td><span className={`badge-status badge-${log.verificationStatus === "not_found" ? "revoked" : log.verificationStatus}`}>{log.verificationStatus.replace("_", " ")}</span></td>
            </tr>)}</tbody>
          </table>
          {!logs.length && <div className="empty-state">{busy ? "Loading verification activity…" : "No verification attempts have been logged."}</div>}
        </div>
        <div className="d-flex justify-content-end align-items-center gap-2 mt-3 small text-secondary">
          <span>{pagination.total} lookups</span>
          <button className="btn btn-sm btn-outline-secondary" disabled={pagination.page <= 1 || busy} onClick={() => load(pagination.page - 1)}>Previous</button>
          <span>Page {pagination.page} / {Math.max(pagination.pages, 1)}</span>
          <button className="btn btn-sm btn-outline-secondary" disabled={pagination.page >= pagination.pages || busy} onClick={() => load(pagination.page + 1)}>Next</button>
        </div>
      </section>
    </>
  );
}
