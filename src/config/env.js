import { config } from "dotenv";
import {fileURLToPath} from "url"; // para trabajar la ruta donde está ubicado el archivo .env
import { dirname,resolve } from "path"; // Importa las funciones necesarias para trabajar con rutas de archivos

const __filename = fileURLToPath(import.meta.url); // convierte la URL del módulo actual en una ruta de archivo, lo que nos permite obtener la ubicación del archivo actual (env.js) para luego usarlo para cargar el .env
const __dirname = dirname(__filename); // obtiene el directorio actual, convirtiendo el url del modulo en una ruta
//basicamente convierte a un formato de ruta normal, y sirve para el dirname.
config({ path: resolve(__dirname, "../../.env") }); // Carga las variables de entorno desde el archivo .env ubicado en el mismo directorio que este archivo.
// resolve lo que hace es decirle que a partir de esa ruta va a buscar el archivo 
const required = ["POSTGRES_URI", "MONGO_URI"];

for (const key of required) {
    if (!process.env[key]) {
        console.log(`Error: Variable de entorno requerida ${key}`);
        throw new Error(`Variable de entorno requerida ${key} no encontrada`);
    }
};

const asBoolean = (value, fallback = false) => {
    if (value === undefined || value === null || value === "") return fallback;
    return String(value).toLowerCase() === "true";
};

// aquí se verifica las variables de entorno a las cuales podemos acceder desde cualquier parte de la api
export const env = {
    port: process.env.PORT || 3000,
    postgresUri: process.env.POSTGRES_URI,
    mongoUri: process.env.MONGO_URI,
    fileDataCsv: process.env.FILE_DATA_CSV ?? "./data/data_simulated.csv",
    runMigrationOnStartup: asBoolean(process.env.RUN_MIGRATION, false),
    nodeEnv: process.env.NODE_ENV || "development"
};

