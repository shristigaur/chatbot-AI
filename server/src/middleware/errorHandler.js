export function errorHandler(error, req, res, next) {
  console.error(error);
  if (res.headersSent) return next(error);
  return res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Internal server error' });
}