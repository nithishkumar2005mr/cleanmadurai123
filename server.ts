import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import { initDb } from "./src/db/database.ts";
import authRoutes from "./src/routes/auth.ts";
import reportRoutes from "./src/routes/reports.ts";
import analyticsRoutes from "./src/routes/analytics.ts";
import communityRoutes from "./src/routes/community.ts";
import awarenessRoutes from "./src/routes/awareness.ts";
import wardRoutes from "./src/routes/wards.ts";
import notificationRoutes from "./src/routes/notifications.ts";
import feedbackRoutes from "./src/routes/feedback.ts";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  initDb();

  app.use(cors());
  app.use(express.json());

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/community", communityRoutes);
  app.use("/api/awareness", awarenessRoutes);
  app.use("/api/wards", wardRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/feedback", feedbackRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Madurai Clean 3.0 API is running" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
