import { migrateDataToPostgres } from '../services/migrationService.js';
import { migratePatientHistoryToMongo } from '../services/patientHistoryService.js';
import { HttpError } from '../utils/httpError.js';

// controlador: ejecutar la migración completa (PostgreSQL + MongoDB)
export async function runMigration(req, res, next) {
  try {
    console.log('Iniciando migración completa...');

    // paso 1: migrar datos a PostgreSQL
    console.log('[1/2] Migrando a PostgreSQL...');
    const postgresResult = await migrateDataToPostgres(false);

    // paso 2: migrar datos a MongoDB
    console.log('[2/2] Migrando a MongoDB...');
    const mongoResult = await migratePatientHistoryToMongo();

    // responder con el resultado exitoso
    res.status(200).json({
      success: true,
      message: 'Migración completada exitosamente',
      postgres: postgresResult,
      mongodb: mongoResult,
    });

  } catch (error) {
    // si algo falla, pasar el error al middleware de errores
    console.error('Error en migración:', error.message);
    next(new HttpError(500, `Error en migración: ${error.message}`));
  }
}
