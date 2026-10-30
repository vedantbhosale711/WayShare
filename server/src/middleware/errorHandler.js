export const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }
  if (err.code === '23505') {
    return res.status(409).json({ message: 'Duplicate entry — this record already exists' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ message: 'Referenced record does not exist' });
  }
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message });
};

export const notFound = (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
};
