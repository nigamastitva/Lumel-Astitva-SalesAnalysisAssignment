import { Request, Response } from "express";
import segmentationService from "../services/segmentation.service";
import { validationResult } from "express-validator";

class SegmentationController {
  async createSegment(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { name, description, criteria } = req.body;
      const segment = await segmentationService.createSegment(
        name,
        description,
        criteria
      );
      res.status(201).json(segment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create segment" });
    }
  }

  async getSegmentCustomers(req: Request, res: Response) {
    try {
      const { segmentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await segmentationService.getCustomersBySegment(
        segmentId,
        page,
        limit
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to get segment customers" });
    }
  }

  async listSegments(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await segmentationService.getSegments(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to list segments" });
    }
  }
}

export default new SegmentationController();
