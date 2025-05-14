import app from "./config/app";
import "./routes/segmentation.routes"; //

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
