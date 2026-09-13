"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const { initDb } = require("./db/models");

// --- routes ---
const authRouter = require("./routes/auth");
const booksRouter = require("./routes/books");
const ordersRouter = require("./routes/orders");
const pagesRouter = require("./routes/pages");

const app = express();
const PORT = process.env.PORT || 4000;

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/openapi.json", (_req, res) => res.json(swaggerSpec));
app.use("/api", pagesRouter);
app.use("/api", authRouter);
app.use("/api/auth", authRouter);
app.use("/api/catalogue", booksRouter);
app.use("/api/books", booksRouter);
app.use("/api/payment", ordersRouter);
app.use("/api/orders", ordersRouter);

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error." });
});

// ---------------------------------------------------------------------------
// Boot: sync DB first, then start HTTP server
// ---------------------------------------------------------------------------
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `[server] Leaf & Letter API running on http://localhost:${PORT}`,
      );
    });
  })
  .catch((err) => {
    console.error("[fatal] Failed to initialise database:", err);
    process.exit(1);
  });

module.exports = app;
