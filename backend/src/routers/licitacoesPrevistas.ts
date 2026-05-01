import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { licitacoesPrevistas } from "../db/schema";
import { protectedProcedure, router } from "../trpc/trpc";

const licitacaoSchema = z.object({
  objeto: z.string().trim().min(1),
  tipo: z.enum(["Material", "Serviço"]),
  solicitante: z.string().trim().min(1),
  status: z.enum(["Prevista", "Em andamento", "Finalizada"]).default("Prevista"),
});

export const licitacoesPrevistasRouter = router({
  listLicitacoes: protectedProcedure.query(async () => {
    return db.select().from(licitacoesPrevistas).orderBy(desc(licitacoesPrevistas.createdAt));
  }),

  createLicitacao: protectedProcedure.input(licitacaoSchema).mutation(async ({ input }) => {
    const id = randomUUID();
    await db.insert(licitacoesPrevistas).values({ ...input, id });
    return { id, success: true };
  }),

  updateLicitacao: protectedProcedure
    .input(licitacaoSchema.partial().extend({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { id, ...values } = input;
      if (Object.keys(values).length === 0) return { success: true };

      await db.update(licitacoesPrevistas).set(values).where(eq(licitacoesPrevistas.id, id));
      return { success: true };
    }),

  deleteLicitacao: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db.delete(licitacoesPrevistas).where(eq(licitacoesPrevistas.id, input.id));
      return { success: true };
    }),
});
