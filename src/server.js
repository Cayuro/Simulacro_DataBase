import app from "./app.js";
import { createTables, pool } from "./config/postgres.js";
import { env } from "./config/env.js";
import { migrate } from "./services/migrationService.js";
import { migrateMongo } from "./services/migrateMongoService.js";

const PORT = Number(env.port) || 3000;

async function bootstrap() {
    await createTables();

    if (env.runMigrationOnStartup) {
        const postgresStats = await migrate(true);
        const mongoStats = await migrateMongo(true);
        console.log("Startup migration completed", { postgresStats, mongoStats });
    }

    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

bootstrap().catch(async (error) => {
    console.error("Bootstrap error:", error);
    await pool.end();
    process.exit(1);
});
