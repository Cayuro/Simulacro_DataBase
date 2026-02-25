import app from "./app.js"; // aquí se importa el app para conexión a express
import { createTable } from "./config/postgres.js";
import { env } from "./config/env.js";

// aquí el puerto hasta ahora para escuchar el servidor, desplegarlo en este puerto
const PORT = env.port || 3000;
// con esto se puede utilizar como una API.

try {
    console.log("Creando la conexión con postgres, creandose tablas");
    if (process.env.RUN_MIGRATION === "true") {
  await createTable();
  await loadMigrationData();
  await normalizeData();
} // Llamamos a la función para crear la tabla al iniciar la aplicación
    console.log("Tabla creada o ya existe."); 
    
    app.listen(PORT, () => {
        console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
} catch (error) {
    console.error("Error al crear la tabla:", error);
    process.exit(1); // Salimos del proceso con un código de error
}
