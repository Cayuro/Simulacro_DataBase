import { rebuildPatientHistoriesFromCsv } from "./patientHistoryService.js";

export async function migrateMongo(clearBefore = false) {
    return rebuildPatientHistoriesFromCsv(clearBefore);
}

export const migrateMongoService = migrateMongo;
