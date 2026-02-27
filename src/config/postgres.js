import { readFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import { env } from "./env.js";

const pool = new Pool({
    connectionString: env.postgresUri
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TABLES_SQL_PATH = resolve(__dirname, "../../data/tables_saludplus.sql");
const INDEXES_SQL_PATH = resolve(__dirname, "../../data/index.sql");

export { pool };

export async function createTable() {
    const client = await pool.connect();

    try {
        const sqlText = await readFile(TABLES_SQL_PATH, "utf-8");
        await client.query("BEGIN");
        await client.query(sqlText);
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function createIndexes() {
    const client = await pool.connect();

    try {
        const sqlText = await readFile("./data/tables_saludplus.sql", "utf-8"); // leemos el archivo sql con las tablas
        await client.query("BEGIN"); // iniciamos una transacción
        // await client.query(query);
        await client.query(sqlText); // ejecutamos el contenido del archivo SQL
        await client.query("COMMIT"); // confirmamos la transacción
        console.log("Tabla 'users' creada o ya existe.");
    } catch (error) {
        console.error("Error al crear la tabla 'users':", error);
        await client.query("ROLLBACK"); // en caso de error, hacemos un rollback para revertir cualquier cambio parcial
    } finally {
        client.release();
    }
}

export async function createTables() {
    await createTable();
    await createIndexes();
}

export default { pool, createTable, createIndexes, createTables };
