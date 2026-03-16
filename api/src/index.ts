import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "API is running",
    project: "Docker Image Optimization Demo",
    technique: "Multi-stage build + esbuild bundle — zero node_modules in production",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
