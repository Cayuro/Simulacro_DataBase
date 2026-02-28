import { HttpError } from '../utils/httpError.js';

// middleware que captura errores y responde con el formato correcto
export function errorHandler(err, req, res, next) {
  // si es un HttpError personalizado, usa su statusCode
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode
    });
  }

  // si es otro tipo de error, devuelve 500 (error del servidor)
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    statusCode: 500
  });
}
