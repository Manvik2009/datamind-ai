import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
const ALLOWED_EXTENSIONS = new Set(['.csv', '.xlsx', '.xls']);

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error('Unsupported file extension'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export const uploadMiddleware = upload.single('file');

export const validateUpload = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: 'File exceeds maximum allowed size' },
      });
    }
    return res.status(400).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: err.message },
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.message },
    });
  }
  next();
};

export const validateUploadedFile = (req: Request, res: Response, next: NextFunction): Response | void => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { code: 'NO_FILE', message: 'No file uploaded' },
    });
  }
  const ext = '.' + req.file.originalname.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return res.status(400).json({
      success: false,
      error: { code: 'UNSUPPORTED_TYPE', message: 'Unsupported file type' },
    });
  }
  next();
};
