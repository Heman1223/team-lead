const express = require('express');
const router = express.Router();
const {
    getLeads,
    getLeadById,
    createLead,
    updateLead,
    assignLead,
    convertToProject,
    importLeads,
    previewLeads,
    getLeadStats,
    deleteLead,
    restoreLead,
    escalateLead,
    getLeadActivities,
    addNote
} = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for CSV uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/csv');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `import-${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (file.mimetype === 'text/csv' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel' ||
            ext === '.csv' ||
            ext === '.xlsx' ||
            ext === '.xls') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed'), false);
        }
    }
});

router.use(protect);

router.get('/stats', getLeadStats);
router.get('/activities', getLeadActivities);

router.route('/')
    .get(getLeads)
    .post(createLead);

router.post('/preview', authorize('admin'), upload.single('file'), previewLeads);
router.post('/import', authorize('admin'), importLeads);

router.route('/:id')
    .get(protect, getLeadById)
    .put(protect, updateLead)
    .delete(protect, deleteLead);
router.route('/:id/notes').post(protect, addNote);
router.put('/:id/restore', authorize('admin'), restoreLead);
router.put('/:id/assign', authorize('admin', 'team_lead'), assignLead);
router.post('/:id/convert', authorize('admin', 'team_lead'), convertToProject);
router.post('/:id/escalate', authorize('team_lead'), escalateLead);

module.exports = router;
