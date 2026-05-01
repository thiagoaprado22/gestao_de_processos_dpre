import { router } from "../trpc/trpc";
import { licitacoesRouter } from "./licitacoesPrevistas";
import { processosRouter } from "./processos";

export const appRouter = router({
  processos: processosRouter,
  licitacoes: licitacoesRouter,
});

export type AppRouter = typeof appRouter;
