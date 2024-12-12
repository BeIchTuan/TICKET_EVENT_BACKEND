const QRCode = require('qrcode');

const generateQRCode = async (data) => {
    try {
        return await QRCode.toDataURL(data);
    } catch (err) {
        throw new Error('Error generating QR code');
    }
};

module.exports = {
    generateQRCode
};
