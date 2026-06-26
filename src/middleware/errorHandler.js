/**
 * Global error handling middleware.
 * Must have 4 params for Express to treat it as an error handler.
 */
function errorHandler(err, req, res, next) {
  console.error('[GlobalError]', err.stack || err.message);

  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: err.message || 'Something went wrong.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 handler — catch-all for unmatched routes.
 */
function notFound(req, res) {
  return res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
}

module.exports = { errorHandler, notFound };
