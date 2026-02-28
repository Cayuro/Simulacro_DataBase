## FLUJO VISUAL DE LO QUE VA HASTA AHORA
Cliente hace: GET /api/patients/ana@mail.com

1. Express recibe la petición
2. Entra al controlador
3. El controlador llama al servicio
4. El servicio busca en MongoDB
5. No encuentra el paciente
6. El servicio lanza: throw new HttpError(404, 'Paciente no encontrado')
7. Express captura el error
8. Express ejecuta errorHandler(err, req, res, next)
9. errorHandler verifica: ¿es HttpError? Sí
10. Responde: { "error": "Paciente no encontrado", "statusCode": 404 }