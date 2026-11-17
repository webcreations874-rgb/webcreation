import { useState, useRef, useEffect } from "react";
import { FiCalendar } from "react-icons/fi";
import { toDDMMYYYY, toISODate, toPickerDate } from "../utils/dateUtils";

const initial = {
  registrationNumber: "", recordType: "", registrationDate: "", registrationUnitName: "", registrationUnitCode: "",
  issuingOrganization: "", fullName: "", gender: "", dateOfOccurrence: "", fatherName: "", motherName: "",
  placeOfOccurrence: "", institutionName: "", district: "", state: "", country: "", remarks: "", supportingDocumentReference: ""
};

const fieldLabels = {
  registrationNumber: "Registration number",
  recordType: "Record type",
  registrationDate: "Registration date",
  registrationUnitName: "Registration unit name",
  registrationUnitCode: "Registration unit code",
  issuingOrganization: "Issuing organization",
  fullName: "Full name",
  gender: "Gender",
  dateOfOccurrence: "Date of death",
  fatherName: "Father's name",
  motherName: "Mother's name",
  placeOfOccurrence: "Place of death",
  institutionName: "Hospital / institution",
  district: "District",
  state: "State",
  country: "Country",
  supportingDocumentReference: "Supporting document reference",
  remarks: "Remarks"
};

const groups = [
  {
    title: "Registration information",
    fields: [
      ["registrationNumber", "Registration number", true, "text", "Enter registration number"],
      ["recordType", "Record type", true, "text", "Enter record type (e.g. Death)"],
      ["registrationDate", "Registration date", true, "date", "dd/mm/yyyy"],
      ["registrationUnitName", "Registration unit name", true, "text", "Enter registration unit name"],
      ["registrationUnitCode", "Registration unit code", true, "text", "Enter registration unit code"],
      ["issuingOrganization", "Issuing organization", true, "text", "Enter issuing organization"]
    ]
  },
  {
    title: "Personal information",
    fields: [
      ["fullName", "Full name", true, "text", "Enter full name"],
      ["gender", "Gender", true, "select", "Select gender"],
      ["dateOfOccurrence", "Date of death", true, "date", "dd/mm/yyyy"],
      ["fatherName", "Father's name", false, "text", "Enter father's name"],
      ["motherName", "Mother's name", false, "text", "Enter mother's name"]
    ]
  },
  {
    title: "Location information",
    fields: [
      ["placeOfOccurrence", "Place of death", true, "text", "Enter place of death"],
      ["institutionName", "Hospital / institution", false, "text", "Enter hospital / institution"],
      ["district", "District", false, "text", "Enter district"],
      ["state", "State", false, "text", "Enter state"],
      ["country", "Country", false, "text", "Enter country"]
    ]
  },
  {
    title: "Additional information",
    fields: [
      ["supportingDocumentReference", "Supporting document reference", false, "text", "Enter supporting document reference"],
      ["remarks", "Remarks", false, "textarea", "Enter remarks"]
    ]
  }
];

function AutoResizeTextarea({ id, name, value, onChange, required, placeholder, rows = 1, minHeight = 42 }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
    }
  }, [value, minHeight]);

  const handleInput = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = `${Math.max(minHeight, e.target.scrollHeight)}px`;
  };

  return (
    <textarea
      ref={textareaRef}
      id={id}
      name={name}
      className={`form-control ${minHeight > 42 ? "tall" : ""}`}
      required={Boolean(required)}
      rows={rows}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={onChange}
      onInput={handleInput}
      style={{
        minHeight: `${minHeight}px`,
        resize: "vertical",
        fontFamily: "inherit",
        lineHeight: "1.5"
      }}
    />
  );
}

function DateInput({ id, name, value, onChange, required, placeholder = "dd/mm/yyyy" }) {
  const hiddenDateRef = useRef(null);

  const handleCalendarClick = () => {
    if (hiddenDateRef.current) {
      if (typeof hiddenDateRef.current.showPicker === "function") {
        hiddenDateRef.current.showPicker();
      } else {
        hiddenDateRef.current.focus();
      }
    }
  };

  const handlePickerChange = (e) => {
    const isoVal = e.target.value;
    if (isoVal) {
      onChange(toDDMMYYYY(isoVal));
    }
  };

  return (
    <div className="input-group">
      <input
        type="text"
        id={id}
        name={name}
        className="form-control"
        placeholder={placeholder}
        required={Boolean(required)}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        pattern="^(\d{1,2}[/.-]\d{1,2}[/.-]\d{4}|\d{4}-\d{2}-\d{2})$"
        title="Enter date in dd/mm/yyyy format"
      />
      <button
        type="button"
        className="btn btn-outline-secondary d-flex align-items-center justify-content-center px-3"
        style={{ borderColor: "#dce2e9", color: "#506176" }}
        onClick={handleCalendarClick}
        title="Choose date from calendar"
        tabIndex={-1}
      >
        <FiCalendar size={15} />
      </button>
      <input
        ref={hiddenDateRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
        value={toPickerDate(value)}
        onChange={handlePickerChange}
      />
    </div>
  );
}

export default function RecordForm({ initialValues, onSubmit, submitLabel = "Save record", busy = false }) {
  const [values, setValues] = useState(() => ({
    ...initial,
    ...initialValues,
    registrationDate: toDDMMYYYY(initialValues?.registrationDate),
    dateOfOccurrence: toDDMMYYYY(initialValues?.dateOfOccurrence)
  }));
  const [preview, setPreview] = useState(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function fieldControl([field, , required, type, placeholder]) {
    if (type === "date") {
      return (
        <DateInput
          id={field}
          name={field}
          required={required}
          placeholder={placeholder || "dd/mm/yyyy"}
          value={values[field] ?? ""}
          onChange={(val) => update(field, val)}
        />
      );
    }
    if (type === "select") {
      return (
        <select
          id={field}
          name={field}
          className="form-select"
          required={Boolean(required)}
          value={values[field] ?? ""}
          onChange={(event) => update(field, event.target.value)}
        >
          <option value="">{placeholder || "Select gender"}</option>
          {["Female", "Male", "Other", "Not specified"].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      );
    }
    return (
      <AutoResizeTextarea
        id={field}
        name={field}
        required={required}
        placeholder={placeholder}
        rows={type === "textarea" ? 3 : 1}
        minHeight={type === "textarea" ? 90 : 42}
        value={values[field] ?? ""}
        onChange={(event) => update(field, event.target.value)}
      />
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      ...values,
      registrationDate: toISODate(values.registrationDate),
      dateOfOccurrence: toISODate(values.dateOfOccurrence)
    };
    onSubmit(payload);
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        {groups.map((group) => (
          <section className="form-panel" key={group.title}>
            <h2 className="form-section-title">{group.title}</h2>
            <div className="row g-3">
              {group.fields.map((field) => (
                <div className={field[0] === "remarks" ? "col-12" : "col-12 col-md-6"} key={field[0]}>
                  <label className="form-label" htmlFor={field[0]}>
                    {field[1]}{field[2] && <span className="text-danger"> *</span>}
                  </label>
                  {fieldControl(field)}
                </div>
              ))}
            </div>
          </section>
        ))}
        <div className="callout mb-3">
          The QR code stores only a random verification URL. Review applicable privacy rules before making personal record details publicly available.
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => setPreview(true)}>
            Preview record
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
      {preview && (
        <div className="modal d-block preview-modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-3">
              <div className="modal-header">
                <h2 className="modal-title fs-5">Record preview</h2>
                <button className="btn-close" onClick={() => setPreview(false)} aria-label="Close" />
              </div>
              <div className="modal-body">
                <p className="text-secondary small">Confirm the entered details before saving.</p>
                <dl className="detail-list">
                  {Object.entries(values)
                    .filter(([, value]) => value)
                    .map(([field, value]) => (
                      <div className="detail-row" key={field}>
                        <dt>{fieldLabels[field] || field.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}</dt>
                        <dd style={{ whiteSpace: "pre-wrap" }}>{value}</dd>
                      </div>
                    ))}
                </dl>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setPreview(false)}>
                  Back to form
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => {
                    setPreview(false);
                    const payload = {
                      ...values,
                      registrationDate: toISODate(values.registrationDate),
                      dateOfOccurrence: toISODate(values.dateOfOccurrence)
                    };
                    onSubmit(payload);
                  }}
                >
                  {submitLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
