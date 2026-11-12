export function notFound(req, res) {
  res.status(404).json({ message: "The requested resource was not found." });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(error.errors).map((item) => item.message).join(" ") });
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern ?? {})[0] ?? "value";
    return res.status(409).json({ message: `A record with this ${field} already exists.` });
  }
  if (error.type === "entity.parse.failed") return res.status(400).json({ message: "Request body must contain valid JSON." });
  console.error(error);
  res.status(error.statusCode ?? 500).json({
    message: error.statusCode ? error.message : "An unexpected server error occurred."
  });
}
