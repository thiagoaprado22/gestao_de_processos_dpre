import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";

// Tipos do AppRouter definidos inline para evitar dependência direta do backend
// Mantidos em sincronia com backend/src/routers/index.ts
export type AppRouter = any;

export const trpc = createTRPCReact<AppRouter>();

export function getApiUrl() {
  const url = (import.meta as any).env?.VITE_API_URL;
  if (!url) {
    console.error(
      "VITE_API_URL não configurada. Configure a variável no Vercel."
    );
    // Retorna string vazia para forçar falha visível em produção.
    // Em desenvolvimento local, defina VITE_API_URL no .env.local
    return "";
  }
  return url;
}

export function getTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiUrl()}/api/trpc`,
        headers() {
          return {};
        },
      }),
    ],
  });
}
