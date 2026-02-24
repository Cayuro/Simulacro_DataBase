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

export default {pool, createTable}; // exportamos el pool para utilizarlo en otras partes de la aplicaciones, y con este podemos usarlo hasta para consultas.