import { Router } from "express";
import segmentationController from "../controllers/segmentation.controller";
import { body } from "express-validator";

const router = Router();

router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("description").optional(),
    body("criteria").isObject().withMessage("Criteria must be an object"),
  ],
  segmentationController.createSegment
);

router.get("/:segmentId/customers", segmentationController.getSegmentCustomers);
router.get("/", segmentationController.listSegments);

export default router;
