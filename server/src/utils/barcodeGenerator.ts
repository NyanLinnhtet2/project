import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

export const generateBarcode = (sku: string, variantId?: string): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const variant = variantId ? `-${variantId.substring(0, 4)}` : "";
  return `${sku}${variant}-${timestamp}-${random}`;
};

export const generateQRCode = async (data: {
  productId: string;
  variantId?: string;
  sku: string;
  barcode: string;
  name: string;
}): Promise<string> => {
  try {
    const qrData = JSON.stringify(data);
    const qrCode = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCode;
  } catch (error) {
    console.error("QR Code generation error:", error);
    return "";
  }
};
