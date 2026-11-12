import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api, { errorMessage, saveFile } from "../../services/api";

export default function QRManagement() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let active = true;
    api.get("/records", { params: { search, page: 1, limit: 50 } })
      .then(({ data }) => { if (active) setRecords(data.records); })
      .catch((error) => { if (active) toast.error(errorMessage(error)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [search]);

  async function preview(record) {
    setSelected(record);
    setQr("");
    try {
      const { data } = await api.get(`/records/${record._id}/qr?format=preview`);
      setQr(data.qrDataUrl);
    } catch (error) {
      toast.error(errorMessage(error));
      setSelected(null);
    }
  }

  async function download(record, format) {
    try {
      await saveFile(`/records/${record._id}/qr?format=${format}`, `qr-${record.registrationNumber}.${format}`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function copyUrl(record) {
    const url = `${window.location.origin}/verify/${record.verificationId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Verification URL copied.");
    } catch {
      toast.error("Clipboard access is unavailable in this browser.");
    }
  }

  return (
    <>
      <div className="page-heading"><div><h1>QR code management</h1><p>Preview and regenerate downloads for each record's stable verification link.</p></div></div>
      <div className="callout mb-3">QR codes contain only a random verification URL. Downloading a replacement does not change the record's verification ID or destination.</div>
      <section className="panel">
        <div className="search-toolbar"><input className="form-control search-input" placeholder="Search by name, registration or verification ID" value={search} onChange={(event) => setSearch(event.target.value)} /><Link className="btn btn-outline-secondary" to="/admin/records/new">Add record</Link></div>
        <div className="table-wrap">
          <table className="data-table"><thead><tr><th>Registration</th><th>Person</th><th>Type</th><th>Status</th><th>QR actions</th></tr></thead>
            <tbody>{records.map((record) => <tr key={record._id}>
              <td>{record.registrationNumber}</td><td>{record.fullName}</td><td>{record.recordType}</td><td>{record.status}</td>
              <td><div className="action-group">
                <button className="action-btn" onClick={() => preview(record)}>Preview</button>
                <button className="action-btn" onClick={() => download(record, "png")}>PNG</button>
                <button className="action-btn" onClick={() => download(record, "pdf")}>PDF</button>
                <button className="action-btn" onClick={() => copyUrl(record)}>Copy link</button>
              </div></td>
            </tr>)}</tbody>
          </table>
          {!records.length && <div className="empty-state"><strong>{busy ? "Loading QR codes…" : "No matching records"}</strong>{!busy && "QR codes are available for records after they are created."}</div>}
        </div>
      </section>
      {selected && <div className="preview-modal-backdrop modal d-block" role="dialog" aria-modal="true" aria-label="QR code preview">
        <div className="modal-dialog modal-dialog-centered"><div className="modal-content border-0 rounded-3">
          <div className="modal-header"><h2 className="modal-title fs-5">QR code · {selected.registrationNumber}</h2><button className="btn-close" onClick={() => setSelected(null)} aria-label="Close preview" /></div>
          <div className="modal-body text-center">
            {qr ? <img className="qr-preview" src={qr} alt={`Verification QR for ${selected.registrationNumber}`} /> : <div className="empty-state">Generating QR code…</div>}
            <strong className="d-block">{selected.fullName}</strong>
            <Link to={`/admin/records/${selected._id}`} onClick={() => setSelected(null)} className="small">View record details</Link>
          </div>
          <div className="modal-footer"><button className="btn btn-outline-secondary" onClick={() => setSelected(null)}>Close</button><button className="btn btn-primary" onClick={() => download(selected, "png")}>Download PNG</button><button className="btn btn-outline-primary" onClick={() => download(selected, "pdf")}>Download PDF</button></div>
        </div></div>
      </div>}
    </>
  );
}
