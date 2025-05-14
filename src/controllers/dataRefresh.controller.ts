import { Request, Response, NextFunction } from "express";
import dataImportService from "../services/dataImport.service";

class DataRefreshController {
  async refreshData(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filePath = req.body.filePath;
      if (!filePath) {
        res.status(400).json({ error: "filePath is required" });
        return;
      }

      const result = await dataImportService.processCSV(filePath);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getRefreshLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await dataImportService.getRefreshLogs(page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new DataRefreshController();
