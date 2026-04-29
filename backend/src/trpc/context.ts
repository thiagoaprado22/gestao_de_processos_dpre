import { Request, Response } from "express";

export interface Context {
  req: Request;
  res: Response;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export function createContext({ req, res }: { req: Request; res: Response }): Context {
  // Usuário mockado fixo — sem autenticação nesta versão
  const user = {
    id: 1,
    name: "Usuário",
    email: "usuario@ufmg.br",
    role: "admin",
  };
  return { req, res, user };
}
