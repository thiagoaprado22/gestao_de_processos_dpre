import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { licitacoes } from "../db/schema";
import { protectedProcedure, router } from "../trpc/trpc";

const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

const licitacaoSchema = z.object({
  objeto: z.string().trim().min(1),
  tipo: z.enum(["Material", "Serviço"]),
  solicitante: z.string().trim().min(1),
  status: z.enum(["Prevista", "Em andamento", "Finalizada"]).default("Prevista"),
  mesPrevisto: z.enum(meses).nullable().optional(),
});

const monthOrderSql = sql<number>`CASE ${licitacoes.mesPrevisto}
  WHEN 'Janeiro' THEN 1
  WHEN 'Fevereiro' THEN 2
  WHEN 'Março' THEN 3
  WHEN 'Abril' THEN 4
  WHEN 'Maio' THEN 5
  WHEN 'Junho' THEN 6
  WHEN 'Julho' THEN 7
  WHEN 'Agosto' THEN 8
  WHEN 'Setembro' THEN 9
  WHEN 'Outubro' THEN 10
  WHEN 'Novembro' THEN 11
  WHEN 'Dezembro' THEN 12
  ELSE 13
END`;

export const licitacoesRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select().from(licitacoes).orderBy(asc(monthOrderSql), asc(licitacoes.status), asc(licitacoes.objeto));
  }),

  create: protectedProcedure.input(licitacaoSchema).mutation(async ({ input }) => {
    const result = await db.insert(licitacoes).values({
      objeto: input.objeto,
      tipo: input.tipo,
      solicitante: input.solicitante,
      status: input.status,
      mesPrevisto: input.mesPrevisto ?? null,
    });

    return { id: result[0].insertId, success: true };
  }),

  update: protectedProcedure
    .input(licitacaoSchema.partial().extend({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const { id, ...values } = input;
      if (Object.keys(values).length === 0) return { success: true };

      await db.update(licitacoes).set(values).where(eq(licitacoes.id, id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await db.delete(licitacoes).where(eq(licitacoes.id, input.id));
      return { success: true };
    }),
});
