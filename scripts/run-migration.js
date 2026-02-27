import { createTables, pool } from "../src/config/postgres.js";
import { migrate } from "../src/services/migrationService.js";
import { migrateMongo } from "../src/services/migrateMongoService.js";

async function run() {
    try {
        await createTables();
        const postgresStats = await migrate(true);
        const mongoStats = await migrateMongo(true);

        console.log("Migration completed successfully");
        console.log(JSON.stringify({ postgresStats, mongoStats }, null, 2));
    } catch (error) {
        console.error("Migration failed", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
        process.exit();
    }
}

run();
