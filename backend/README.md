# Backend - Migrations com Drizzle (MySQL)

## Fluxo seguro para mudanças de schema

Sempre aplique migrations **antes** de subir código que usa novas colunas.

1. Altere o schema Drizzle em `src/db/schema.ts`.
2. Gere a migration:
   ```bash
   pnpm db:generate
   ```
3. Revise o SQL gerado em `drizzle/*.sql` e faça commit do arquivo.
4. Aplique a migration no ambiente correto:
   ```bash
   pnpm db:migrate
   ```
5. Só depois publique código que lê/escreve as novas colunas.

## Scripts

- `pnpm db:generate` -> gera migration com base nas mudanças de schema.
- `pnpm db:migrate` -> aplica migrations pendentes no banco alvo (`DATABASE_URL`).
- `pnpm db:push` -> sincroniza schema diretamente (evite em produção).

## Railway (produção)

> Não exponha `DATABASE_URL` em logs, tickets ou documentação pública.

### Opção 1: Railway CLI (recomendada)

No diretório `backend`:

```bash
railway run pnpm db:migrate
```

Esse comando executa a migration usando as variáveis do serviço Railway.

### Opção 2: Railway Shell

Abra um shell no serviço backend e rode:

```bash
pnpm db:migrate
```

### Opção 3: etapa manual antes do deploy

Antes de liberar versão nova do backend/frontend que depende de coluna nova:

```bash
pnpm db:migrate
```

Somente após migration concluída faça o deploy da aplicação.

## Observação importante

O backend não deve executar `ALTER TABLE` automaticamente no startup (`initDb`, `index.ts`, `server.ts`, etc.).
Mudanças de schema devem acontecer apenas via migrations versionadas no diretório `drizzle/`.
