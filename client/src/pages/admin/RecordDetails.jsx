import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import StatusBadge from "../../components/StatusBadge";
import RecordForm from "../../components/RecordForm";
import api, { errorMessage, saveFile } from "../../services/api";

const details = [
  ["Registration number", "registrationNumber"], ["Record type", "recordType"], ["Full name", "fullName"],
  ["Gender", "gender"], ["Date of occurrence", "dateOfOccurrence"], ["Father's name", "fatherName"],
  ["Mother's name", "motherName"], ["Place of occurrence", "placeOfOccurrence"], ["Institution", "institutionName"],
  ["District", "district"], ["State", "state"], ["Country", "country"], ["Registration date", "registrationDate"],
  ["Registration unit", "registrationUnitName"], ["Unit code", "registrationUnitCode"],
  ["Issuing organization", "issuingOrganization"], ["Remarks", "remarks"],
  ["Supporting document reference", "supportingDocumentReference"]
];

function showValue(record, key) {
  const value = record[key];
  if (!value) return "—";
  return key.toLowerCase().includes("date") ? new Date(value).toLocaleDateString() : value;
}

export default function RecordDetails() {
  const { id } = useParams();
  const [query] = useSearchParams();
  const [record, setRecord] = useState(null);
  const [loadedId, setLoadedId] = useState(null);
  const [qr, setQr] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api.get(`/records/${id}`)
      .then(({ data }) => {
        if (!active) return null;
        setRecord(data.record);
        return api.get(`/records/${id}/qr?format=preview`);
      })
      .then((response) => {
        if (active && response) {
          setQr(response.data.qrDataUrl);
          setLoadedId(id);
        }
      })
      .catch((error) => { if (active) toast.error(errorMessage(error)); });
    return () => { active = false; };
  }, [id]);
  useEffect(() => {
    if (query.get("print") === "1" && record && qr) window.setTimeout(() => window.print(), 400);
  }, [query, record, qr]);

  async function update(values) {
    setBusy(true);
    try {
      const { data } = await api.put(`/records/${id}`, values);
      setRecord(data.record);
      setEditing(false);
      toast.success("Record updated. Its verification ID and QR destination are unchanged.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status) {
    if (!window.confirm(`Are you sure you want to ${status === "active" ? "restore" : status} this record?`)) return;
    try {
      const { data } = await api.patch(`/records/${id}/status`, { status });
      setRecord(data.record);
      toast.success(`Record ${status}.`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function download(format) {
    try {
      await saveFile(`/records/${id}/qr?format=${format}`, `qr-${record.registrationNumber}.${format}`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  if (!record || loadedId !== id) return <div className="empty-state">Loading record…</div>;
  return (
    <>
      <div className="page-heading">
        <div><h1>{editing ? "Edit record" : "Record details"}</h1><p>{record.registrationNumber} · created {new Date(record.createdAt).toLocaleDateString()}</p></div>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/admin/records" className="btn btn-outline-secondary">Back to records</Link>
          {!editing && <button className="btn btn-outline-secondary" onClick={() => setEditing(true)}>Edit record</button>}
          {!editing && <button className="btn btn-primary" onClick={() => download("png")}>Download QR</button>}
          {!editing && <button className="btn btn-outline-primary" onClick={() => download("pdf")}>QR PDF</button>}
        </div>
      </div>
      {editing ? <RecordForm initialValues={{ ...record, dateOfOccurrence: record.dateOfOccurrence.slice(0, 10), registrationDate: record.registrationDate.slice(0, 10) }} onSubmit={update} submitLabel="Save changes" busy={busy} /> : <>
        <div className="record-detail-grid">
          <section className="panel">
            <div className="d-flex justify-content-between align-items-center mb-3"><h2 className="panel-title">Registration information</h2><StatusBadge status={record.status} /></div>
            <dl className="detail-list">
              {details.map(([label, key]) => <div className="detail-row" key={key}><dt>{label}</dt><dd>{showValue(record, key)}</dd></div>)}
              <div className="detail-row"><dt>Verification ID</dt><dd><code>{record.verificationId}</code></dd></div>
              <div className="detail-row"><dt>Verification URL</dt><dd><a href={`/verify/${record.verificationId}`} target="_blank" rel="noreferrer">Open public verification</a></dd></div>
            </dl>
            <div className="d-flex flex-wrap gap-2 mt-4 d-print-none">
              {record.status === "active" ? <button className="btn btn-outline-danger btn-sm" onClick={() => setStatus("revoked")}>Revoke record</button> : <button className="btn btn-outline-success btn-sm" onClick={() => setStatus("active")}>Restore record</button>}
              <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>Print summary</button>
            </div>
          </section>
          <section className="panel text-center">
            <h2 className="panel-title text-start">Verification QR</h2>
            {qr ? <img className="qr-preview" src={qr} alt="QR code for public record verification" /> : <div className="empty-state">Preparing QR code…</div>}
            <p className="text-secondary small">QR contains the verification URL only.</p>
            <a className="d-block small text-break" href={`/verify/${record.verificationId}`} target="_blank" rel="noreferrer">{window.location.origin}/verify/{record.verificationId}</a>
          </section>
        </div>
        <p className="field-hint mt-3">Public verification confirms that a record is present in this organization's system. It does not claim government authentication.</p>
      </>}
    </>
  );
}
