import { initTRPC } from "@trpc/server";
import { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
// Sem autenticação: protectedProcedure = publicProcedure
export const protectedProcedure = t.procedure;
export const adminProcedure = t.procedure;
