import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, required: true, trim: true, unique: true },
    recordType: { type: String, required: true, trim: true },
    verificationId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, required: true, trim: true },
    dateOfOccurrence: { type: Date, required: true },
    fatherName: { type: String, trim: true, default: "" },
    motherName: { type: String, trim: true, default: "" },
    placeOfOccurrence: { type: String, required: true, trim: true },
    institutionName: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    registrationDate: { type: Date, required: true },
    registrationUnitName: { type: String, required: true, trim: true },
    registrationUnitCode: { type: String, required: true, trim: true },
    issuingOrganization: { type: String, required: true, trim: true },
    remarks: { type: String, trim: true, default: "" },
    supportingDocumentReference: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["active", "revoked", "archived"], default: "active", index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }
  },
  { timestamps: true }
);

recordSchema.index({ fullName: "text", registrationNumber: "text", verificationId: "text" });
recordSchema.index({ recordType: 1, registrationDate: -1, status: 1 });

export default mongoose.model("Record", recordSchema);
