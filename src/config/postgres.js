// import pg from "pg";
import {readFile} from "fs/promises"; // para leer el archivo sql con las tablas
import { Pool } from "pg";
import { env } from "./env.js";

// const { Pool } = pg; // aquí se está declarando pool dos veces, si se hace en el import no es necesario
// lo que nos permite pool es crear una conexión a la base de datos y manejarla de forma eficiente
// posibilida el reuso de conexiones, lo que mejora el rendimiento y escalabilidad de aplicaciones para evitar sobrecarga
const pool = new Pool({
    connectionString: env.postgresUri,
});

export async function createTable() {
    const client = await pool.connect(); // obtenemos una conexión del pool
    
    // esta queri por ejemplo es lo que podemos tener para ingresar en base de datos
    // desde donde hacemos el client.query que es donde hacemos la query a sql. (generamos scripts sql)
    


    // const query = `
    //     CREATE TABLE IF NOT EXISTS users (
    //         id SERIAL PRIMARY KEY,
    //         name VARCHAR(100) NOT NULL,
    //         email VARCHAR(100) NOT NULL UNIQUE,
    //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //     );
    // `;

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
        client.release(); // liberamos la conexión al cliente
    // si el pool de conexiones no se libera, puede llevar a que se quede ahí esperando
    // a poder generar una conexión, pues normalmente se limita a un numero de conexiones
    }
}

// Llamamos a la función para crear la tabla al iniciar la aplicación
// createTable().catch(error => console.error("Error al crear la tabla:", error)); // manejamos cualquier error que pueda ocurrir al crear la tabla
export default {pool, createTable}; // exportamos el pool para utilizarlo en otras partes de la aplicaciones, y con este podemos usarlo hasta para consultas.