import app from './app.js';
import { pool, testConnection, createTables, closePool } from './config/postgres.js';
import { connectMongoDB, closeMongoDB } from './config/mongoDB.js';
import { env } from './config/env.js';

// obtener el puerto del archivo .env (si no hay, usa 3000)
const PORT = env.port;

// variable para almacenar el server (para poder cerrarlo despues)
let server;

// funcion para arrancar el servidor
async function startServer() {
  try {
    console.log('\n--- INICIANDO SALUDPLUS API ---\n');

    // paso 1: conectar a postgresql
    console.log('[1/3] Conectando a PostgreSQL...');
    await testConnection();

    // paso 2: conectar a mongodb
    console.log('[2/3] Conectando a MongoDB...');
    await connectMongoDB();

    // paso 3: crear las tablas en postgres si no existen
    console.log('[3/3] Creando tablas en PostreSQL...');
    await createTables();

    // paso 4: escuchar en el puerto
    server = app.listen(PORT, () => {
      console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health\n`);
    });

  } catch (error) {
    console.error('\n❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
}

// funcion para cerrar todo de forma limpia
async function shutdown() {
  console.log('\n--- APAGANDO SERVIDOR ---\n');

  // cerrar el server http
  if (server) {
    server.close(async () => {
      console.log('[1/3] Servidor HTTP cerrado');

      // cerrar conexion a postgres
      await closePool();
      console.log('[2/3] PostgreSQL desconectado');

      // cerrar conexion a mongodb
      await closeMongoDB();
      console.log('[3/3] MongoDB desconectado');

      console.log('\n✅ Apagado completado\n');
      process.exit(0);
    });
  }
}

// escuchar cuando el usuario presiona Ctrl+C
process.on('SIGINT', shutdown);

// escuchar errores no manejados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada sin manejar:', reason);
  process.exit(1);
});

// arrancar el servidor
startServer();
