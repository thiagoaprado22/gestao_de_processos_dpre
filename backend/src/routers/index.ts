import { router } from "../trpc/trpc";
import { licitacoesPrevistasRouter } from "./licitacoesPrevistas";
import { processosRouter } from "./processos";

export const appRouter = router({
  processos: processosRouter,
  licitacoesPrevistas: licitacoesPrevistasRouter,
});

export type AppRouter = typeof appRouter;
