import { Router } from "express";
import { getRevenueReportController } from "../controllers/reportsController.js";

const reportsRouter = Router();

reportsRouter.get("/revenue", getRevenueReportController);

export default reportsRouter;
