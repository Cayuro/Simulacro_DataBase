import {readFile} from "fs/promises"; // para leer el archivo sql con las tablas
import { Pool } from "pg";
import { env } from "./env.js";

// el pool posibilida el reuso de conexiones, lo que mejora el rendimiento y escalabilidad de aplicaciones para evitar sobrecarga
const pool = new Pool({
    connectionString: env.postgresUri,
});

export async function createTable() {
    const client = await pool.connect(); // obtenemos una conexión del pool

    try {
        const sqlText = await readFile("./data/tables_saludplus.sql", "utf-8"); // leemos el archivo sql con las tablas
        await client.query("BEGIN");
        await client.query(sqlText); // ejecutamos el contenido del archivo SQL
        await client.query("COMMIT"); // confirmamos la transacción
        console.log("Tabla 'users' creada o ya existe.");
    } catch (error) {
        console.error("Error al crear la tabla 'users':", error);
        await client.query("ROLLBACK"); // en caso de error, hacemos un rollback para revertir cualquier cambio parcial
    } finally {
        client.release(); // liberamos la conexión al cliente
    // si el pool de conexiones no se libera, puede llevar a que se quede ahí esperando
    // a poder generar una conexión, pues normalmente se limita a un numero de conexiones
    }

}
export async function loadMigrationData() {
    const client = await pool.connect();

    try {
        const csv = await readFile("./data/data_simulated.csv", "utf-8");

        const rows = csv.split("\n").slice(1); // quitar header

        await client.query("BEGIN");

        for (const row of rows) {
            if (!row.trim()) continue;

            const values = row.split(",");

            await client.query(`
                INSERT INTO migration (
                    appointment_id,
                    appointment_date,
                    patient_name,
                    patient_email,
                    patient_phone,
                    patient_address,
                    doctor_name,
                    doctor_email,
                    specialty,
                    treatment_code,
                    treatment_description,
                    treatment_cost,
                    insurance_provider,
                    coverage_percentage,
                    amount_paid
                )
                VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
                )
                ON CONFLICT (appointment_id) DO NOTHING
            `, values);
        }

        await client.query("COMMIT");
        console.log("Datos migrados a tabla migration");

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error migrando CSV:", error);
    } finally {
        client.release();
    }
}

export async function normalizeData() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const files = [
            "insert_specialties.sql",
            "insert_insurances.sql",
            "insert_treatments.sql",
            "insert_patients.sql",
            "insert_doctors.sql",
            "insert_appointments.sql"
        ];

        for (const file of files) {
            const sql = await readFile(`./sql/${file}`, "utf8");
            await client.query(sql);
        }

        await client.query("COMMIT");
        console.log("Normalización completada ✅");

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error en normalización:", error);
    } finally {
        client.release();
    }
}

export default {pool, createTable, loadMigrationData, normalizeData}; // exportamos el pool para utilizarlo en otras partes de la aplicaciones, y con este podemos usarlo hasta para consultas.

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const sqlPath = path.join(__dirname, "data", "tables_saludplus.sql");

// const sqlText = await readFile(sqlPath, "utf-8");