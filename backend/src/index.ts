import "dotenv/config";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./trpc/context";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — permitir qualquer origem (necessário para Vercel + Railway)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.options("*", cors({ origin: true, credentials: true }));

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// tRPC
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error }) {
      console.error("tRPC Error:", error);
    },
  })
);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 tRPC disponível em http://localhost:${PORT}/api/trpc`);
});
