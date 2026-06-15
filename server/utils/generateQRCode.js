const QRCode = require('qrcode');

/**
 * Generates a base64 QR Code image data URI for the given text.
 * @param {string} text The target URL to encode
 * @returns {Promise<string>} Base64 Data URI string
 */
const generateQRCode = async (text) => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR Code base64:', error.message);
    // Return a public API fallback in case of local package error
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(text)}`;
  }
};

module.exports = generateQRCode;
