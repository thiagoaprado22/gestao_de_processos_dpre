import "dotenv/config";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./trpc/context";
import { db } from "./db";
import { sql } from "drizzle-orm";

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

// Inicializar banco de dados
async function initDb() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS processos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_processo VARCHAR(100) NOT NULL,
        objeto TEXT NOT NULL,
        modalidade VARCHAR(50) NOT NULL DEFAULT 'IRP',
        tipo_contratacao VARCHAR(50) NOT NULL DEFAULT 'Material',
        parecer_referencial VARCHAR(10) NOT NULL DEFAULT 'Não',
        divulgado VARCHAR(10) NOT NULL DEFAULT 'Não',
        quantidade_itens INT DEFAULT 0,
        numero_irp VARCHAR(100) DEFAULT '',
        numero_pregao VARCHAR(100) DEFAULT '',
        valor_estimado DECIMAL(15,2) DEFAULT 0.00,
        situacao VARCHAR(30) NOT NULL DEFAULT 'Em andamento',
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fases_processo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        processo_id INT NOT NULL,
        ordem INT NOT NULL,
        nome VARCHAR(255) NOT NULL,
        observacao TEXT,
        data_inicio DATE,
        data_fim DATE,
        tempo_dias INT DEFAULT 0,
        status VARCHAR(30) NOT NULL DEFAULT 'Pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_processo_id (processo_id)
      )
    `);

    await db.execute(sql`ALTER TABLE processos ADD COLUMN IF NOT EXISTS divulgado VARCHAR(10) NOT NULL DEFAULT 'Não'`);
    console.log("✅ Banco de dados inicializado com sucesso");
  } catch (err) {
    console.error("❌ Erro ao inicializar banco:", err);
    process.exit(1);
  }
}

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 tRPC disponível em http://localhost:${PORT}/api/trpc`);
  });
});
