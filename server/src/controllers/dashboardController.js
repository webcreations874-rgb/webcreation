import Record from "../models/Record.js";
import VerificationLog from "../models/VerificationLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getStats = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [total, active, revoked, createdToday, verifications, qrCodesGenerated, monthly] = await Promise.all([
    Record.countDocuments({ status: { $ne: "archived" } }),
    Record.countDocuments({ status: "active" }),
    Record.countDocuments({ status: "revoked" }),
    Record.countDocuments({ createdAt: { $gte: startOfDay } }),
    VerificationLog.countDocuments(),
    Record.countDocuments(),
    Record.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ]);
  res.json({ stats: { total, active, revoked, createdToday, verifications, qrCodesGenerated, monthly } });
});

export const getRecentRecords = asyncHandler(async (req, res) => {
  const records = await Record.find({ status: { $ne: "archived" } }).sort({ createdAt: -1 }).limit(8).lean();
  res.json({ records });
});
