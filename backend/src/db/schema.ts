import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  timestamp,
  date,
} from "drizzle-orm/mysql-core";

export const processos = mysqlTable("processos", {
  id: int("id").autoincrement().primaryKey(),
  numeroProcesso: varchar("numero_processo", { length: 100 }).notNull(),
  objeto: text("objeto").notNull(),
  modalidade: varchar("modalidade", { length: 50 }).notNull().default("IRP"),
  tipoContratacao: varchar("tipo_contratacao", { length: 50 }).notNull().default("Material"),
  parecerReferencial: varchar("parecer_referencial", { length: 10 }).notNull().default("Não"),
  quantidadeItens: int("quantidade_itens").default(0),
  numeroIrp: varchar("numero_irp", { length: 100 }).default(""),
  numeroPregao: varchar("numero_pregao", { length: 100 }).default(""),
  valorEstimado: decimal("valor_estimado", { precision: 15, scale: 2 }).default("0.00"),
  situacao: varchar("situacao", { length: 30 }).notNull().default("Em andamento"),
  observacoes: text("observacoes").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const fasesProcesso = mysqlTable("fases_processo", {
  id: int("id").autoincrement().primaryKey(),
  processoId: int("processo_id").notNull(),
  ordem: int("ordem").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  observacao: text("observacao").default(""),
  dataInicio: date("data_inicio"),
  dataFim: date("data_fim"),
  tempoDias: int("tempo_dias").default(0),
  status: varchar("status", { length: 30 }).notNull().default("Pendente"),
  naoSeAplica: int("nao_se_aplica").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type Processo = typeof processos.$inferSelect;
export type NewProcesso = typeof processos.$inferInsert;
export type FaseProcesso = typeof fasesProcesso.$inferSelect;
export type NewFaseProcesso = typeof fasesProcesso.$inferInsert;
