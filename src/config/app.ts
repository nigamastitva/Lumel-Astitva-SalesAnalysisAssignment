import express from "express";
import segmentationRouter from "../routes/segmentation.routes";
import dataRefreshRouter from "../routes/dataRefresh.routes";
const app = express();
app.use(express.json());

app.use("/api/v1/segments", segmentationRouter);
app.use("/api/v1/data", dataRefreshRouter);
export default app;
