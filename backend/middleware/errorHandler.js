const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
    stack: err.stack,
    statusCode: err.status || err.statusCode || 500,
    userId: req.user?._id,
  });

  // Mongoose document validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages[0], errors: messages });
  }

  // MongoDB duplicate key (e.g., unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const label = field.charAt(0).toUpperCase() + field.slice(1);
    return res.status(400).json({ success: false, message: `${label} already exists` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Multer file size exceeded
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File size cannot exceed 5 MB' });
  }

  // Multer wrong file type (thrown as plain Error from fileFilter)
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Cast error (invalid MongoDB ObjectId in a param)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  const statusCode = err.status || err.statusCode || 500;

  // Never leak internal messages in production for 5xx errors
  const message =
    statusCode >= 500 && !isDev ? 'Internal Server Error' : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
