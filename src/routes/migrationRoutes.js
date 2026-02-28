import express from 'express';
import { runMigration } from '../controllers/migrationController.js';

const router = express.Router();

// ruta: POST /api/migrate
// ejecuta la migración completa de CSV a ambas bases de datos
router.post('/migrate', runMigration);

export default router;
