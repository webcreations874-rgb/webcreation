import QRCode from "qrcode";

export function getVerificationUrl(verificationId) {
  const baseUrl = process.env.PUBLIC_BASE_URL;
  if (!baseUrl) throw new Error("PUBLIC_BASE_URL is required to generate verification QR codes.");
  return new URL(`/verify/${encodeURIComponent(verificationId)}`, baseUrl).toString();
}

export function generateQrDataUrl(verificationId) {
  return QRCode.toDataURL(getVerificationUrl(verificationId), {
    errorCorrectionLevel: "H",
    margin: 4,
    width: 640,
    color: { dark: "#000000", light: "#FFFFFF" }
  });
}
