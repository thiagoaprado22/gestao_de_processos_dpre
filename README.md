# UFMG Pré-Compras

Sistema institucional de gestão e análise de desempenho de processos de pré-compras da UFMG.

> **Autenticação:** desativada nesta versão. O sistema é de acesso aberto, sem login ou OAuth.

---

## Visão Geral

O UFMG Pré-Compras permite registrar processos licitatórios, acompanhar as 14 fases padrão do fluxo de pré-compras e identificar gargalos automaticamente por meio de um painel analítico completo.

### Funcionalidades

- Cadastro e edição de processos com 14 fases padrão geradas automaticamente
- Linha do tempo interativa de fases com registro de datas de início e conclusão
- Dashboard analítico: Resumo Executivo, alertas inteligentes e gráficos
- Ranking Top 10 processos críticos por tempo em aberto
- Análise por etapa: distribuição e tempo médio por fase atual
- Evolução temporal: processos iniciados e finalizados por mês
- Indicadores de fluxo: % finalizados, em andamento e cancelados
- Identificação automática de fase crítica por processo
- Badge "Acima da média" calculado em tempo real
- Exportação CSV com dados analíticos incluídos
- Cores de prioridade: verde (≤ 5 dias), amarelo (6–10 dias), vermelho (> 10 dias)
- Alerta "Tempo elevado" para processos acima de 10 dias em aberto (nunca "Atrasado")

---

## Arquitetura

```
ufmg-precompras/
├── frontend/          → Vercel  (Vite + React + TypeScript + tRPC client)
└── backend/           → Railway (Express + tRPC + Drizzle ORM + MySQL)
```

### Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Vite 5, React 18, TypeScript, React Router v6 |
| Estado / API | tRPC v10, TanStack Query v4 |
| Gráficos | Recharts |
| Backend | Node.js, Express, tRPC v10 |
| ORM | Drizzle ORM |
| Banco de dados | MySQL (Railway) |
| Deploy frontend | Vercel |
| Deploy backend | Railway |

---

## Integridade do Backend

> **O backend NÃO foi alterado nas versões de redesign visual e análise de desempenho.**

Todos os arquivos abaixo permanecem idênticos à versão original de criação:

| Arquivo | Status |
|---|---|
| `backend/src/db/schema.ts` | ✅ Inalterado |
| `backend/src/db/index.ts` | ✅ Inalterado |
| `backend/src/routers/processos.ts` | ✅ Inalterado |
| `backend/src/routers/index.ts` | ✅ Inalterado |
| `backend/src/trpc/context.ts` | ✅ Inalterado |
| `backend/src/trpc/trpc.ts` | ✅ Inalterado |
| `backend/src/fases-padrao.ts` | ✅ Inalterado |
| `backend/src/index.ts` | ✅ Inalterado |

As melhorias de análise de desempenho (gargalos, rankings, alertas, evolução temporal) foram implementadas **exclusivamente no frontend**, no arquivo `frontend/src/lib/analytics.ts`, sem nenhuma alteração em endpoints, banco de dados ou lógica de cálculo do backend.

---

## Variáveis de Ambiente

### Backend — Railway

| Variável | Obrigatória | Descrição | Exemplo |
|---|---|---|---|
| `DATABASE_URL` | ✅ Sim | URL de conexão MySQL completa | `mysql://user:pass@host:3306/db` |
| `PORT` | Opcional | Porta do servidor (padrão: 3000) | `3000` |
| `FRONTEND_URL` | Opcional | URL do frontend para CORS | `https://ufmg-precompras.vercel.app` |

> O Railway fornece a `DATABASE_URL` automaticamente ao provisionar um banco MySQL.
> Se `FRONTEND_URL` não for definida, o CORS aceita qualquer origem (`origin: true`).

### Frontend — Vercel

| Variável | Obrigatória | Descrição | Exemplo |
|---|---|---|---|
| `VITE_API_URL` | ✅ Sim | URL pública do backend no Railway | `https://ufmg-precompras-production.up.railway.app` |

> **Importante:** nunca use `localhost` como valor de `VITE_API_URL` em produção.
> O prefixo `VITE_` é obrigatório para que o Vite exponha a variável ao bundle do browser.

---

## Deploy — Passo a Passo

### 1. Preparar o repositório

```bash
git init
git add .
git commit -m "chore: initial commit"
git remote add origin https://github.com/SEU_USUARIO/ufmg-precompras.git
git push -u origin main
```

---

### 2. Deploy do Backend no Railway

1. Acesse [railway.app](https://railway.app) e faça login
2. Clique em **New Project → Deploy from GitHub repo**
3. Selecione o repositório e configure:
   - **Root Directory:** `backend`
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `node dist/index.js`
4. Clique em **Add Service → Database → MySQL**
5. Nas variáveis de ambiente do serviço backend, adicione:
   - `DATABASE_URL` → copie o valor gerado pelo serviço MySQL do Railway
6. Aguarde o deploy. Copie a **URL pública** gerada (ex: `https://ufmg-precompras-production.up.railway.app`)

> O backend cria as tabelas automaticamente na primeira execução (`CREATE TABLE IF NOT EXISTS`).
> Não é necessário rodar migrations manualmente.

---

### 3. Deploy do Frontend no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **Add New → Project**
3. Importe o repositório e configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `pnpm build`
   - **Output Directory:** `dist`
4. Em **Environment Variables**, adicione:
   - `VITE_API_URL` → URL pública do backend copiada no passo anterior
5. Clique em **Deploy**

> O arquivo `frontend/vercel.json` já está configurado com rewrite para SPA (`/*` → `/index.html`),
> garantindo que o F5 e links diretos funcionem sem erro 404.

---

### 4. Configurar CORS (opcional)

Para restringir o CORS ao domínio do Vercel, adicione no Railway:

```
FRONTEND_URL=https://ufmg-precompras.vercel.app
```

---

## Desenvolvimento Local

### Pré-requisitos

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- MySQL local ou Docker

### Backend

```bash
cd backend
cp .env.example .env
# Edite .env com sua DATABASE_URL local
pnpm install
pnpm dev
# Servidor em http://localhost:3000
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edite .env.local: VITE_API_URL=http://localhost:3000
pnpm install
pnpm dev
# App em http://localhost:5173
```

---

## Comandos de Build

### Backend

```bash
cd backend
pnpm build    # Compila com esbuild → dist/index.js
pnpm start    # Inicia em produção
```

### Frontend

```bash
cd frontend
pnpm build    # Gera dist/ para deploy no Vercel
```

---

## Estrutura de Arquivos

```
ufmg-precompras/
│
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts              # Tabelas: processos, fases_processo
│   │   │   └── index.ts               # Conexão Drizzle + MySQL
│   │   ├── routers/
│   │   │   ├── processos.ts           # CRUD + dashboard + updateFase
│   │   │   └── index.ts               # Router raiz tRPC
│   │   ├── trpc/
│   │   │   ├── context.ts             # Contexto (sem autenticação)
│   │   │   └── trpc.ts                # Instância tRPC base
│   │   ├── fases-padrao.ts            # 14 fases padrão do fluxo
│   │   └── index.ts                   # Servidor Express + CORS
│   ├── .env.example
│   ├── drizzle.config.ts
│   ├── railway.json
│   ├── Procfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── trpc.ts                # Cliente tRPC configurado
│   │   │   ├── design.ts              # Tokens de design institucional
│   │   │   └── analytics.ts           # Motor de análise de desempenho (frontend only)
│   │   ├── components/
│   │   │   └── Layout.tsx             # Sidebar + topbar institucional
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Painel analítico completo
│   │   │   ├── ProcessosList.tsx      # Lista com badges analíticos
│   │   │   ├── ProcessoForm.tsx       # Formulário em seções organizadas
│   │   │   └── ProcessoDetalhes.tsx   # Linha do tempo de fases
│   │   ├── types/
│   │   │   └── router.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vercel.json                    # Rewrite SPA (sem 404 no F5)
│   ├── .env.local.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Fases Padrão do Processo

Cada processo criado recebe automaticamente as 14 fases abaixo:

| # | Fase |
|---|---|
| 1 | Recebido → Lançamento no SIASG |
| 2 | Lançamento no SIASG → Divulgação da IRP |
| 3 | Divulgação da IRP → Compilados da Documentação |
| 4 | Compilados da Documentação → Envio ao Div. de Planejamento |
| 5 | Div. Planejamento → Elaboração do TR, ETP, MP |
| 6 | TR, ETP, MP pelo DPL → Elaboração dos Autos do Processo |
| 7 | Autos do Processo → Solicitação de Nota Técnica |
| 8 | Recebimento de Nota Técnica → Atendimento Solicitante |
| 9 | Recebimento de Nota Técnica → Atendimento DPRE |
| 10 | Ajuste nos Autos do Processo → Envio para Procuradoria Jurídica |
| 11 | Recebimento do Parecer da PJ → Atendimento Solicitante |
| 12 | Recebimento do Parecer da PJ → Atendimento DPRE |
| 13 | Ajuste nos Autos do Processo → Publicação dos Autos |
| 14 | Publicação → Despacho para o Setor de Pregão |

---

## Regras de Negócio

| Regra | Descrição |
|---|---|
| Tempo em aberto | Calculado desde o início da fase atual até hoje |
| Tempo total | Soma dos tempos de todas as fases com datas registradas |
| Verde | Tempo em aberto ≤ 5 dias |
| Amarelo | Tempo em aberto entre 6 e 10 dias |
| Vermelho | Tempo em aberto > 10 dias |
| Tempo elevado | Badge exibido quando tempo em aberto > 10 dias |
| Acima da média | Processo cujo tempo total supera a média geral de todos os processos |
| Fase crítica | Fase com maior `tempoDias` registrado no processo |
| Situações válidas | Em andamento · Finalizado · Cancelado |

---

## Pontos Seguros para Alteração Futura

Esta seção indica os arquivos que podem ser editados com segurança para personalizar o sistema, e os que não devem ser alterados sem necessidade.

### Pode alterar com segurança

| O que alterar | Arquivo | Observação |
|---|---|---|
| Fases padrão | `backend/src/fases-padrao.ts` | Fonte única das 14 fases. Alterações só afetam processos novos. |
| Indicadores e métricas | `frontend/src/lib/analytics.ts` | Toda a lógica de análise de desempenho está aqui. |
| Textos visuais e layout | `frontend/src/pages/*.tsx` | Componentes de página do frontend. |
| Tokens de design | `frontend/src/lib/design.ts` | Cores, tipografia, espaçamentos. |

### Não alterar sem necessidade

| Arquivo | Motivo |
|---|---|
| `frontend/src/lib/trpc.ts` | Conexão com o backend. Alteração pode quebrar toda a comunicação. |
| `backend/src/index.ts` | Servidor Express, CORS e rota tRPC. |
| `backend/src/trpc/context.ts` | Contexto sem autenticação. Não adicionar login. |
| `backend/src/trpc/trpc.ts` | Procedures abertas. Não adicionar middleware de auth. |
| `backend/src/db/schema.ts` | Estrutura do banco. Alteração requer migração. |

### Variáveis de ambiente

| Plataforma | Variável | Valor |
|---|---|---|
| Vercel (frontend) | `VITE_API_URL` | URL pública do backend no Railway |
| Railway (backend) | `DATABASE_URL` | URL de conexão MySQL (gerada pelo Railway) |

---

## Observações

- Não há autenticação. Qualquer pessoa com o link pode acessar o sistema.
- O banco de dados é criado automaticamente na primeira inicialização do backend.
- O CORS está configurado para aceitar qualquer origem (`origin: true`) por padrão.
- O arquivo `vercel.json` garante que o refresh/F5 não cause erro 404.
- Toda a lógica de análise de desempenho roda no frontend, sem custo adicional de API.
