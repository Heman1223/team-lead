const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');
const {
    uploadFile,
    getFiles,
    searchFiles,
    updateFile,
    replaceFile,
    downloadFile,
    deleteFile,
    grantAccess,
    revokeAccess
} = require('../controllers/fileController');
const { protect } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, os.tmpdir());
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Protect all routes
router.use(protect);

// File routes
router.get('/search', searchFiles);
router.get('/', getFiles);
router.post('/upload', upload.single('file'), uploadFile);
router.put('/:id', updateFile);
router.post('/:id/replace', upload.single('file'), replaceFile);
router.get('/:id/download', downloadFile);
router.delete('/:id', deleteFile);

// Permission routes (Admin only)
router.post('/:id/grant-access', grantAccess);
router.delete('/:id/revoke-access/:user_id', revokeAccess);

module.exports = router;
