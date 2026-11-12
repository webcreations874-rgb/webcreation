import mongoose from "mongoose";

const verificationLogSchema = new mongoose.Schema(
  {
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: "Record", default: null },
    verificationId: { type: String, required: true, maxlength: 80 },
    verificationStatus: { type: String, enum: ["active", "revoked", "not_found"], required: true },
    verifiedAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

verificationLogSchema.index({ verifiedAt: -1 });
export default mongoose.model("VerificationLog", verificationLogSchema);
