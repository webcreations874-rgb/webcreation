import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    action: { type: String, required: true, maxlength: 80 },
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: "Record", default: null },
    details: { type: String, maxlength: 300, default: "" }
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

export default mongoose.model("AuditLog", auditLogSchema);
