import { migrate } from "../services/migrationService.js";
import { migrateMongo } from "../services/migrateMongoService.js";

export async function runMigrationController(req, res, next) {
    try {
        const clearBefore = req.body?.clearBefore ?? true;

        const postgres = await migrate(Boolean(clearBefore));
        const mongo = await migrateMongo(Boolean(clearBefore));

        res.status(200).json({
            success: true,
            message: "Migration completed",
            stats: {
                postgres,
                mongo
            }
        });
    } catch (error) {
        next(error);
    }
}
