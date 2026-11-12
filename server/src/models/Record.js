import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, required: true, trim: true, maxlength: 80, unique: true },
    recordType: { type: String, required: true, trim: true, maxlength: 80 },
    verificationId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true, maxlength: 160 },
    gender: { type: String, required: true, trim: true, maxlength: 40 },
    dateOfOccurrence: { type: Date, required: true },
    fatherName: { type: String, trim: true, maxlength: 160, default: "" },
    motherName: { type: String, trim: true, maxlength: 160, default: "" },
    placeOfOccurrence: { type: String, required: true, trim: true, maxlength: 240 },
    institutionName: { type: String, trim: true, maxlength: 160, default: "" },
    district: { type: String, trim: true, maxlength: 120, default: "" },
    state: { type: String, trim: true, maxlength: 120, default: "" },
    country: { type: String, trim: true, maxlength: 120, default: "" },
    registrationDate: { type: Date, required: true },
    registrationUnitName: { type: String, required: true, trim: true, maxlength: 160 },
    registrationUnitCode: { type: String, required: true, trim: true, maxlength: 80 },
    issuingOrganization: { type: String, required: true, trim: true, maxlength: 160 },
    remarks: { type: String, trim: true, maxlength: 2000, default: "" },
    supportingDocumentReference: { type: String, trim: true, maxlength: 200, default: "" },
    status: { type: String, enum: ["active", "revoked", "archived"], default: "active", index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }
  },
  { timestamps: true }
);

recordSchema.index({ fullName: "text", registrationNumber: "text", verificationId: "text" });
recordSchema.index({ recordType: 1, registrationDate: -1, status: 1 });

export default mongoose.model("Record", recordSchema);
