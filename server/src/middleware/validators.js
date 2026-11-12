import { body, param } from "express-validator";

const text = (field, label, max = 160) =>
  body(field).trim().notEmpty().withMessage(`${label} is required.`).isLength({ max }).withMessage(`${label} is too long.`);

export const loginValidation = [
  body().custom((value) => {
    if (typeof value?.identifier === "string" && value.identifier.trim()) return true;
    if (typeof value?.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) return true;
    throw new Error("Enter your username or a valid email address.");
  }),
  body("password").isString().notEmpty().withMessage("Password is required.")
];

export const recordValidation = [
  text("registrationNumber", "Registration number", 80),
  text("recordType", "Record type", 80),
  text("fullName", "Full name"),
  text("gender", "Gender", 40),
  body("dateOfOccurrence").isISO8601().withMessage("Enter a valid occurrence date."),
  text("placeOfOccurrence", "Place of occurrence", 240),
  body("registrationDate").isISO8601().withMessage("Enter a valid registration date."),
  text("registrationUnitName", "Registration unit name"),
  text("registrationUnitCode", "Registration unit code", 80),
  text("issuingOrganization", "Issuing organization"),
  ...["fatherName", "motherName", "institutionName", "district", "state", "country", "remarks", "supportingDocumentReference"].map((field) =>
    body(field).optional({ values: "falsy" }).isString().withMessage("Must be text.")
  )
];

export const idValidation = [param("id").isMongoId().withMessage("Invalid record identifier.")];
export const verificationIdValidation = [
  param("verificationId").isLength({ min: 20, max: 80 }).matches(/^[A-Za-z0-9_-]+$/).withMessage("Invalid verification identifier.")
];
