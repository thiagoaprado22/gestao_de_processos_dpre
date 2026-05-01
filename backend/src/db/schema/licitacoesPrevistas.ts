import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const licitacoes = mysqlTable("licitacoes", {
  id: int("id").autoincrement().primaryKey(),
  objeto: text("objeto").notNull(),
  tipo: mysqlEnum("tipo", ["Material", "Serviço"]).notNull(),
  solicitante: text("solicitante").notNull(),
  status: mysqlEnum("status", ["Prevista", "Em andamento", "Finalizada"]).notNull().default("Prevista"),
  mesPrevisto: varchar("mes_previsto", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Licitacao = typeof licitacoes.$inferSelect;
export type NewLicitacao = typeof licitacoes.$inferInsert;
