import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

// Crear el pool de conexiones
export const pool = new Pool({
  connectionString: env.postgresUri,
  max: 20,
  idleTimeoutMillis: 1000000,
  connectionTimeoutMillis: 2000,
});

// Evento: conexión exitosa
pool.on('connect', () => {
  console.log(' Conexión a PostgreSQL establecida');
});

// Evento: error en el pool
pool.on('error', (err) => {
  console.error(' Error inesperado en PostgreSQL:', err);
  process.exit(-1);
});

// Función para crear las tablas
export async function createTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── patients ──
    await client.query(`CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      email VARCHAR(50) NOT NULL UNIQUE,
      phone VARCHAR(20) NOT NULL,
      address VARCHAR(100) NOT NULL)`);

    // ── treatments ──
    await client.query(`CREATE TABLE IF NOT EXISTS treatments (
      code VARCHAR(50) PRIMARY KEY,
      description TEXT NOT NULL,
      cost INTEGER NOT NULL)`);

    // ── insurances_providers ──
    await client.query(`CREATE TABLE IF NOT EXISTS insurances_providers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      coverage_percentage INTEGER NOT NULL)`);

    // ── specialitys ──
    await client.query(`CREATE TABLE IF NOT EXISTS specialitys (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE)`);

    // ── doctors ──
    await client.query(`CREATE TABLE IF NOT EXISTS doctors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      email VARCHAR(50) NOT NULL UNIQUE,
      speciality_id INTEGER NOT NULL REFERENCES specialitys(id))`);

    // ── appointments ──
    await client.query(`CREATE TABLE IF NOT EXISTS appointments (
      id VARCHAR(50) PRIMARY KEY,
      date DATE NOT NULL,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
      doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
      treatment_code VARCHAR(50) NOT NULL REFERENCES treatments(code) ON DELETE RESTRICT,
      insurance_provider_id INTEGER NOT NULL REFERENCES insurances_providers(id) ON DELETE RESTRICT,
      amount_paid NUMERIC(10,2) NOT NULL)`);

    // ── Indexes for frequent queries ──
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_treatment ON appointments(treatment_code)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_insurance ON appointments(insurance_provider_id)`);

    await client.query('COMMIT');
    console.log(' Tablas creadas exitosamente');
  } catch (error) {
    console.error(' Error al crear tablas:', error);
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release(); // Liberar la conexión
  }
}

// Función para probar la conexión
export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log(' PostgreSQL conectado en:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error(' Error al conectar a PostgreSQL:', error.message);
    throw error;
  }
}

// Función para cerrar el pool (cuando cierres el servidor)
export async function closePool() {
  try {
    await pool.end();
    console.log(' Pool de PostgreSQL cerrado correctamente');
  } catch (error) {
    console.error(' Error al cerrar el pool:', error);
  }
}
