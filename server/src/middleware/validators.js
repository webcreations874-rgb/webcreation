import { body, param } from "express-validator";

const text = (field, label) =>
  body(field).trim().notEmpty().withMessage(`${label} is required.`);

const isValidDate = (value) => {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(trimmed)) {
    return !Number.isNaN(Date.parse(trimmed));
  }
  const match = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (match) {
    const day = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const year = Number.parseInt(match[3], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1800 || year > 2200) return false;
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
  }
  return false;
};

export const loginValidation = [
  body().custom((value) => {
    if (typeof value?.identifier === "string" && value.identifier.trim()) return true;
    if (typeof value?.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) return true;
    throw new Error("Enter your username or a valid email address.");
  }),
  body("password").isString().notEmpty().withMessage("Password is required.")
];

export const recordValidation = [
  text("registrationNumber", "Registration number"),
  text("recordType", "Record type"),
  text("fullName", "Full name"),
  text("gender", "Gender"),
  body("dateOfOccurrence").custom(isValidDate).withMessage("Enter a valid date of death (dd/mm/yyyy)."),
  text("placeOfOccurrence", "Place of death"),
  body("registrationDate").custom(isValidDate).withMessage("Enter a valid registration date (dd/mm/yyyy)."),
  text("registrationUnitName", "Registration unit name"),
  text("registrationUnitCode", "Registration unit code"),
  text("issuingOrganization", "Issuing organization"),
  ...["fatherName", "motherName", "institutionName", "district", "state", "country", "remarks", "supportingDocumentReference"].map((field) =>
    body(field).optional({ values: "falsy" }).isString().withMessage("Must be text.")
  )
];

export const idValidation = [param("id").isMongoId().withMessage("Invalid record identifier.")];
export const verificationIdValidation = [
  param("verificationId").isLength({ min: 20, max: 80 }).matches(/^[A-Za-z0-9_-]+$/).withMessage("Invalid verification identifier.")
];
