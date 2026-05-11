/**
 * Centralized Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.stack}`);

  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Security: Don't leak stack traces in production
  const response = {
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  // Log suspicious activities
  if (statusCode === 401 || statusCode === 403) {
    console.warn(`[SECURITY ALERT] ${req.method} ${req.originalUrl} - Access denied for IP: ${req.ip}`);
  }

  res.status(statusCode).json(response);
};
