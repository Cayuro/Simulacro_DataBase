import {readFile} from "fs/promises"; // para leer el archivo sql con las tablas y hacerlo como promesas (asincrono)
import { Pool } from "pg";
import { env } from "./env.js";

// el pool posibilida el reuso de conexiones, lo que mejora el rendimiento y escalabilidad de aplicaciones para evitar sobrecarga
const pool = new Pool({
    connectionString: env.postgresUri,
});

export { pool };

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
export async function createIndexes() {
    const client = await pool.connect();

    try {
        const indexSql = await readFile("./data/index.sql", "utf-8");
        await client.query("BEGIN");
        await client.query(indexSql);
        await client.query("COMMIT");
        console.log("Índices creados o ya existentes.");

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error al crear índices:", error);
    } finally {
        client.release();
    }
}

export default {pool, createTable, createIndexes}; // exportamos el pool para utilizarlo en otras partes de la aplicaciones, y con este podemos usarlo hasta para consultas.

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const sqlPath = path.join(__dirname, "data", "tables_saludplus.sql");

// const sqlText = await readFile(sqlPath, "utf-8");