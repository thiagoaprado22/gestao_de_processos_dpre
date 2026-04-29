import { router } from "../trpc/trpc";
import { processosRouter } from "./processos";

export const appRouter = router({
  processos: processosRouter,
});

export type AppRouter = typeof appRouter;
