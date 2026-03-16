const notFound = (req, res, next) => {
  const err = new Error('Route Not Found');
  err.status = 404;
  next(err);
};

const errorHandler = (err, req, res, next) => {
  const status = Number.isInteger(err?.status) ? err.status : 500;
  const message = err?.message || 'Internal Server Error';

  console.error(`[${req.method} ${req.originalUrl}]`, {
    status,
    message,
    stack: err?.stack,
  });

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({
    message: status >= 500 ? 'Internal Server Error' : message,
  });
};

module.exports = { errorHandler, notFound };
