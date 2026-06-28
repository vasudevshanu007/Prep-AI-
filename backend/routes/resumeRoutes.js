const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const { uploadResume, analyzeResume, deleteResume } = require('../controllers/resumeController');

// PDF magic bytes: %PDF-
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      fs.mkdirSync('./uploads', { recursive: true });
      cb(null, './uploads');
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    // Sanitize original filename — keep only alphanumeric, dash, underscore, dot
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  // 1. MIME type check (client-reported, not trusted alone)
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed'), false);
  }
  // 2. Extension check
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf') {
    return cb(new Error('Only PDF files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB hard limit
    files: 1,                   // one file per request
  },
});

// Magic-byte verification middleware — runs after multer saves the file
const verifyPdfMagicBytes = (req, res, next) => {
  if (!req.file) return next();
  try {
    const fd = fs.openSync(req.file.path, 'r');
    const buf = Buffer.alloc(5);
    fs.readSync(fd, buf, 0, 5, 0);
    fs.closeSync(fd);

    if (!buf.equals(PDF_MAGIC)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Uploaded file is not a valid PDF' });
    }
    next();
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
};

router.use(protect);
router.post('/upload', upload.single('resume'), verifyPdfMagicBytes, uploadResume);
router.post('/analyze', upload.single('resume'), verifyPdfMagicBytes, analyzeResume);
router.delete('/', deleteResume);

module.exports = router;
