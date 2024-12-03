const multer = require('multer')

// Cấu hình bộ nhớ
const storage = multer.memoryStorage();
const uploadImage = multer({ storage });

module.exports = uploadImage;