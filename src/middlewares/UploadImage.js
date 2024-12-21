const multer = require('multer')

// Cấu hình bộ nhớ tạm thời
const storage = multer.memoryStorage();

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh!'), false);
    }
};

const uploadImage = multer({
    storage: storage,
    //fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
        files: 5 // Tối đa 5 file
    }
});

module.exports = {uploadImage, fileFilter};