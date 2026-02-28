import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { errorHandler } from './middleware/errorHandler.js';

// crear la aplicacion express
const app = express();

// middleware para que la api acepte solicitudes desde otros origenes (frontend)
app.use(cors());

// middleware para parsear json que viene en el body de las requestss
app.use(bodyParser.json());

// ruta de salud para verificar que el servidor esta arriba
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Servidor activo',
    timestamp: new Date().toISOString()
  });
});

// ruta raiz 
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenido a SaludPlus API',
    version: '1.0.0'
  });
});

// ejemplo 1: leer query params
app.get('/saludar', (req, res) => {
  const nombre = req.query.nombre || 'Anónimo';
  res.json({ saludo: `Hola ${nombre}!` });
});

// ejemplo 2: leer parametros de URL (params y query)
app.get('/usuario/:id', (req, res) => {
  const paramsId = req.params.id;      // captura :id de la ruta
  const queryId = req.query.id;        // captura ?id= de la query
  const nombre = req.query.nombre;     // captura ?nombre= si existe
  
  res.json({ 
    paramsId: paramsId,                // de /usuario/:id
    queryId: queryId || 'no enviado',  // de ?id=
    nombre: nombre || 'no enviado',    // de ?nombre=
    ejemplo: 'Prueba: /usuario/123?id=234&nombre=Juanito'
  });
});

// middleware para rutas que no existen 
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path 
  });
});

// middleware para manejar errores globales (ya importado desde errorHandler.js)
app.use(errorHandler);

export default app;