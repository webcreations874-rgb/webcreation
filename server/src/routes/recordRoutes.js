import { Router } from "express";
import {
  createRecord, downloadQr, getRecord, listRecords, updateRecord, updateRecordStatus
} from "../controllers/recordController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { idValidation, recordValidation } from "../middleware/validators.js";

const router = Router();
router.use(requireAuth);
router.post("/", recordValidation, validateRequest, createRecord);
router.get("/", listRecords);
router.get("/:id/qr", idValidation, validateRequest, downloadQr);
router.patch("/:id/status", idValidation, validateRequest, updateRecordStatus);
router.get("/:id", idValidation, validateRequest, getRecord);
router.put("/:id", idValidation, recordValidation, validateRequest, updateRecord);

export default router;
