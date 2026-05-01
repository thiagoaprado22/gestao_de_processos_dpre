import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { licitacoes } from "../db/schema";
import { protectedProcedure, router } from "../trpc/trpc";

const licitacaoSchema = z.object({
  objeto: z.string().trim().min(1),
  tipo: z.enum(["Material", "Serviço"]),
  solicitante: z.string().trim().min(1),
  status: z.enum(["Prevista", "Em andamento", "Finalizada"]).default("Prevista"),
});

export const licitacoesRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select().from(licitacoes).orderBy(desc(licitacoes.createdAt));
  }),

  create: protectedProcedure.input(licitacaoSchema).mutation(async ({ input }) => {
    const result = await db.insert(licitacoes).values({
      objeto: input.objeto,
      tipo: input.tipo,
      solicitante: input.solicitante,
      status: input.status,
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
