// clase personalizada para errores HTTP
export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);                  // llama al constructor de Error
    this.statusCode = statusCode;    // guarda el código HTTP (404, 400, etc)
    this.name = 'HttpError';         // nombre del error
  }
}

// ejemplo de uso:
// throw new HttpError(404, 'Paciente no encontrado');
// throw new HttpError(400, 'Email inválido');
