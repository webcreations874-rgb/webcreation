import { useState } from "react";

const initial = {
  registrationNumber: "", recordType: "", registrationDate: "", registrationUnitName: "", registrationUnitCode: "",
  issuingOrganization: "", fullName: "", gender: "", dateOfOccurrence: "", fatherName: "", motherName: "",
  placeOfOccurrence: "", institutionName: "", district: "", state: "", country: "", remarks: "", supportingDocumentReference: ""
};

const groups = [
  {
    title: "Registration information",
    fields: [
      ["registrationNumber", "Registration number", true], ["recordType", "Record type", true],
      ["registrationDate", "Registration date", true, "date"], ["registrationUnitName", "Registration unit name", true],
      ["registrationUnitCode", "Registration unit code", true], ["issuingOrganization", "Issuing organization", true]
    ]
  },
  {
    title: "Personal information",
    fields: [
      ["fullName", "Full name", true], ["gender", "Gender", true, "select"],
      ["dateOfOccurrence", "Date of occurrence", true, "date"], ["fatherName", "Father's name"],
      ["motherName", "Mother's name"]
    ]
  },
  {
    title: "Location information",
    fields: [
      ["placeOfOccurrence", "Place of occurrence", true], ["institutionName", "Hospital / institution"],
      ["district", "District"], ["state", "State"], ["country", "Country"]
    ]
  },
  {
    title: "Additional information",
    fields: [
      ["supportingDocumentReference", "Supporting document reference"], ["remarks", "Remarks", false, "textarea"]
    ]
  }
];

export default function RecordForm({ initialValues, onSubmit, submitLabel = "Save record", busy = false }) {
  const [values, setValues] = useState({ ...initial, ...initialValues });
  const [preview, setPreview] = useState(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function fieldControl([field, , required, type]) {
    const common = {
      id: field,
      className: "form-control",
      required: Boolean(required),
      maxLength: field === "remarks" ? 2000 : 240,
      value: values[field] ?? "",
      onChange: (event) => update(field, event.target.value)
    };
    if (type === "textarea") return <textarea {...common} rows={3} />;
    if (type === "select") {
      return (
        <select {...common} className="form-select">
          <option value="">Select gender</option>
          {["Female", "Male", "Other", "Not specified"].map((item) => <option key={item}>{item}</option>)}
        </select>
      );
    }
    return <input {...common} type={type || "text"} />;
  }

  return (
    <>
      <form onSubmit={(event) => { event.preventDefault(); onSubmit(values); }}>
        {groups.map((group) => (
          <section className="form-panel" key={group.title}>
            <h2 className="form-section-title">{group.title}</h2>
            <div className="row g-3">
              {group.fields.map((field) => (
                <div className={field[0] === "remarks" ? "col-12" : "col-12 col-md-6"} key={field[0]}>
                  <label className="form-label" htmlFor={field[0]}>{field[1]}{field[2] && <span className="text-danger"> *</span>}</label>
                  {fieldControl(field)}
                </div>
              ))}
            </div>
          </section>
        ))}
        <div className="callout mb-3">The QR code stores only a random verification URL. Review applicable privacy rules before making personal record details publicly available.</div>
        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => setPreview(true)}>Preview record</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : submitLabel}</button>
        </div>
      </form>
      {preview && <div className="modal d-block preview-modal-backdrop" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 rounded-3">
            <div className="modal-header"><h2 className="modal-title fs-5">Record preview</h2><button className="btn-close" onClick={() => setPreview(false)} aria-label="Close" /></div>
            <div className="modal-body">
              <p className="text-secondary small">Confirm the entered details before saving.</p>
              <dl className="detail-list">
                {Object.entries(values).filter(([, value]) => value).map(([field, value]) => (
                  <div className="detail-row" key={field}><dt>{field.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setPreview(false)}>Back to form</button><button type="button" className="btn btn-primary" disabled={busy} onClick={() => { setPreview(false); onSubmit(values); }}>{submitLabel}</button></div>
          </div>
        </div>
      </div>}
    </>
  );
}
