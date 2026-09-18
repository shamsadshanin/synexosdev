/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GridWiseService } from "./src/services/gridwise-service";
import { OptimizeRequest } from "./src/types";

async function startServer() {
  const app = express();
  const port = 3000;
  const service = new GridWiseService();

  app.use(express.json({ limit: "1mb" }));

  // API routes go here FIRST
  // GET /health
  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  // POST /optimize-energy
  app.post("/optimize-energy", async (req: Request, res: Response) => {
    try {
      const request = req.body as OptimizeRequest;

      // Basic validation
      if (!request.scenario_id || !Array.isArray(request.operator_notes) || !Array.isArray(request.hours) || !request.battery) {
        return res.status(400).json({ error: "Malformed request. Missing required top-level fields." });
      }

      if (request.hours.length !== 24) {
        return res.status(400).json({ error: "Exactly 24 hourly records are required." });
      }

      const response = await service.optimize(request);
      res.status(200).json(response);
    } catch (error: any) {
      console.error("Optimization failed:", error);
      
      // Check for specific error types if needed
      if (error.message?.includes("infeasible")) {
        return res.status(422).json({ error: "The optimization problem is infeasible under current constraints." });
      }

      res.status(500).json({ 
        error: "An internal server error occurred during optimization.",
        message: error.message 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`GridWise service listening at http://0.0.0.0:${port}`);
  });
}

startServer();
