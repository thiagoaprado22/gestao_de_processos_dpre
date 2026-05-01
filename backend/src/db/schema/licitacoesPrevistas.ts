import { mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const licitacoesPrevistas = mysqlTable("licitacoes_previstas", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  objeto: text("objeto").notNull(),
  tipo: mysqlEnum("tipo", ["Material", "Serviço"]).notNull(),
  solicitante: text("solicitante").notNull(),
  status: mysqlEnum("status", ["Prevista", "Em andamento", "Finalizada"]).notNull().default("Prevista"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type LicitacaoPrevista = typeof licitacoesPrevistas.$inferSelect;
export type NewLicitacaoPrevista = typeof licitacoesPrevistas.$inferInsert;
