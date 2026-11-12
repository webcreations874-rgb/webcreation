import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import RecordForm from "../../components/RecordForm";
import api, { errorMessage } from "../../services/api";

export default function AddRecord() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function create(values) {
    setBusy(true);
    try {
      const { data } = await api.post("/records", values);
      toast.success("Record created and verification QR is ready.");
      navigate(`/admin/records/${data.record._id}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading"><div><h1>Add a new record</h1><p>Enter the registration details. A unique verification QR is generated on save.</p></div></div>
      <RecordForm onSubmit={create} busy={busy} />
    </>
  );
}
