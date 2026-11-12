import PDFDocument from "pdfkit";
import Record from "../models/Record.js";
import AuditLog from "../models/AuditLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateVerificationId } from "../utils/generateVerificationId.js";
import { generateQrDataUrl, getVerificationUrl } from "../services/qrService.js";

const editableFields = [
  "registrationNumber", "recordType", "fullName", "gender", "dateOfOccurrence", "fatherName", "motherName",
  "placeOfOccurrence", "institutionName", "district", "state", "country", "registrationDate",
  "registrationUnitName", "registrationUnitCode", "issuingOrganization", "remarks", "supportingDocumentReference"
];

export const createRecord = asyncHandler(async (req, res) => {
  const values = Object.fromEntries(editableFields.map((field) => [field, req.body[field]]));
  const record = await Record.create({
    ...values,
    verificationId: generateVerificationId(),
    createdBy: req.admin.id,
    updatedBy: req.admin.id
  });
  await AuditLog.create({ adminId: req.admin.id, action: "record.created", recordId: record.id });
  res.status(201).json({ record, verificationUrl: getVerificationUrl(record.verificationId) });
});

export const listRecords = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const filter = {};
  if (req.query.status && !["active", "revoked", "archived"].includes(req.query.status)) {
    return res.status(400).json({ message: "Choose active, revoked, or archived status." });
  }
  for (const date of [req.query.from, req.query.to]) {
    if (date && Number.isNaN(Date.parse(date))) return res.status(400).json({ message: "Enter a valid registration date filter." });
  }
  const search = String(req.query.search ?? "").trim().slice(0, 100);
  if (search) {
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = ["fullName", "registrationNumber", "verificationId"].map((field) => ({
      [field]: { $regex: safeSearch, $options: "i" }
    }));
  }
  if (req.query.status && ["active", "revoked", "archived"].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.recordType) filter.recordType = String(req.query.recordType).slice(0, 80);
  if (req.query.from || req.query.to) {
    filter.registrationDate = {};
    if (req.query.from) filter.registrationDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.registrationDate.$lte = new Date(`${req.query.to}T23:59:59.999Z`);
  }
  const sortBy = ["registrationDate", "fullName", "createdAt"].includes(req.query.sort) ? req.query.sort : "createdAt";
  const order = req.query.order === "asc" ? 1 : -1;
  const [records, total] = await Promise.all([
    Record.find(filter).sort({ [sortBy]: order }).skip((page - 1) * limit).limit(limit).lean(),
    Record.countDocuments(filter)
  ]);
  res.json({ records, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getRecord = asyncHandler(async (req, res) => {
  const record = await Record.findById(req.params.id).lean();
  if (!record) return res.status(404).json({ message: "Record not found." });
  res.json({ record, verificationUrl: getVerificationUrl(record.verificationId) });
});

export const updateRecord = asyncHandler(async (req, res) => {
  const values = Object.fromEntries(editableFields.filter((field) => field in req.body).map((field) => [field, req.body[field]]));
  values.updatedBy = req.admin.id;
  const record = await Record.findByIdAndUpdate(req.params.id, values, {
    new: true,
    runValidators: true
  });
  if (!record) return res.status(404).json({ message: "Record not found." });
  await AuditLog.create({ adminId: req.admin.id, action: "record.updated", recordId: record.id });
  res.json({ record });
});

export const updateRecordStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["active", "revoked", "archived"].includes(status)) {
    return res.status(400).json({ message: "Choose active, revoked, or archived status." });
  }
  const record = await Record.findByIdAndUpdate(req.params.id, { status, updatedBy: req.admin.id }, { new: true });
  if (!record) return res.status(404).json({ message: "Record not found." });
  await AuditLog.create({ adminId: req.admin.id, action: `record.${status}`, recordId: record.id });
  res.json({ record });
});

export const downloadQr = asyncHandler(async (req, res) => {
  const record = await Record.findById(req.params.id).select("verificationId registrationNumber fullName");
  if (!record) return res.status(404).json({ message: "Record not found." });
  const dataUrl = await generateQrDataUrl(record.verificationId);
  if (req.query.format === "preview") return res.json({ qrDataUrl: dataUrl });
  const image = Buffer.from(dataUrl.split(",")[1], "base64");
  const name = `qr-${record.registrationNumber.replace(/[^a-z0-9_-]/gi, "-")}`;
  if (req.query.format === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${name}.pdf"`);
    const pdf = new PDFDocument({ size: "A5", margin: 36 });
    pdf.pipe(res);
    pdf.fontSize(18).fillColor("#173B67").text("QR Record Verify", { align: "center" });
    pdf.moveDown(0.5).fontSize(12).fillColor("#202938").text(record.fullName, { align: "center" });
    pdf.fontSize(10).text(`Registration: ${record.registrationNumber}`, { align: "center" });
    pdf.image(image, 120, 110, { fit: [260, 260], align: "center" });
    pdf.fontSize(9).fillColor("#576579").text(getVerificationUrl(record.verificationId), 36, 390, { width: 350, align: "center" });
    pdf.end();
    return;
  }
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", `attachment; filename="${name}.png"`);
  res.send(image);
});
