import Record from "../models/Record.js";
import VerificationLog from "../models/VerificationLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyRecord = asyncHandler(async (req, res) => {
  const { verificationId } = req.params;
  const record = await Record.findOne({ verificationId, status: { $ne: "archived" } }).lean();
  const status = !record ? "not_found" : record.status;
  await VerificationLog.create({
    recordId: record?._id ?? null,
    verificationId,
    verificationStatus: status
  });
  res.set("Cache-Control", "no-store");
  res.set("X-Robots-Tag", "noindex, nofollow");
  if (!record) return res.status(404).json({ status: "not_found", message: "No matching record was found." });
  const {
    _id, __v, createdBy, updatedBy, remarks, supportingDocumentReference, district, state, country, institutionName, ...publicRecord
  } = record;
  res.json({
    status: record.status,
    message: record.status === "active"
      ? "Record Found – Verification Successful"
      : "This record is no longer valid. Contact the issuing organization.",
    record: publicRecord,
    disclaimer: "This confirms that a record exists in this organization's system. It is not government authentication or independent proof of the underlying event."
  });
});

export const getVerificationLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const [logs, total] = await Promise.all([
    VerificationLog.find().sort({ verifiedAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate("recordId", "registrationNumber fullName").lean(),
    VerificationLog.countDocuments()
  ]);
  res.json({ logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
