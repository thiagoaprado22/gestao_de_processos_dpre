import { z } from "zod";
import { eq, desc, like, or, and } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc/trpc";
import { db } from "../db";
import { processos, fasesProcesso } from "../db/schema";
import { FASES_PADRAO } from "../fases-padrao";

// Calcula tempo em dias entre duas datas
function calcularTempoDias(dataInicio: string | null, dataFim: string | null): number {
  if (!dataInicio) return 0;
  const inicio = new Date(dataInicio);
  const fim = dataFim ? new Date(dataFim) : new Date();
  const diff = fim.getTime() - inicio.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function normalizarData(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return raw;
  const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const [, dd, mm, yyyy] = brMatch;
    return `${yyyy}-${mm}-${dd}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}



function enriquecerFases(fases: any[]) {
  return fases.map((f) => {
    const ignored = !!f.naoSeAplica;
    const dataInicio = f.dataInicio ? String(f.dataInicio) : null;
    const dataFim = f.dataFim ? String(f.dataFim) : null;
    return {
      ...f,
      dataInicio,
      dataFim,
      ignorada: ignored,
      status: ignored ? "Não se aplica" : f.status,
      tempoDias: ignored ? 0 : calcularTempoDias(dataInicio, dataFim),
    };
  });
}
// Determina etapa atual e tempo em aberto
function calcularEtapaAtual(fases: Array<{
  ordem: number;
  nome: string;
  dataInicio: string | null;
  dataFim: string | null;
  ignorada?: boolean;
}>) {
  const fasesAtivas = fases.filter(f => !f.ignorada);

  const faseAtual = fasesAtivas.find(f => f.dataInicio && !f.dataFim);
  if (faseAtual) {
    return {
      etapaAtual: faseAtual.nome,
      tempoEmAberto: calcularTempoDias(faseAtual.dataInicio, null),
    };
  }

  const proximaFase = fasesAtivas.find(f => !f.dataInicio && !f.dataFim);
  if (proximaFase) {
    return { etapaAtual: proximaFase.nome, tempoEmAberto: 0 };
  }

  const todasFinalizadas = fasesAtivas.every(f => f.dataFim);
  if (todasFinalizadas && fasesAtivas.length > 0) {
    return { etapaAtual: "Processo finalizado", tempoEmAberto: 0 };
  }

  return { etapaAtual: fasesAtivas[0]?.nome ?? "—", tempoEmAberto: 0 };
}

export const processosRouter = router({
  // Listar processos com filtros
  list: protectedProcedure
    .input(
      z.object({
        situacao: z.string().optional(),
        modalidade: z.string().optional(),
        tipoContratacao: z.string().optional(),
        busca: z.string().optional(),
        tempoAberto: z.string().optional(),
        divulgado: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const rows = await db.select().from(processos).orderBy(desc(processos.createdAt));

      const result = await Promise.all(
        rows.map(async (p) => {
          const fases = await db
            .select()
            .from(fasesProcesso)
            .where(eq(fasesProcesso.processoId, p.id))
            .orderBy(fasesProcesso.ordem);

          // Campo legado: mantemos na resposta sem depender da coluna no MySQL.
          const divulgado = "Não";
          const fasesComTempo = enriquecerFases(fases);

          const tempoTotal = fasesComTempo.reduce((acc, f) => acc + f.tempoDias, 0);
          const { etapaAtual, tempoEmAberto } = calcularEtapaAtual(fasesComTempo);

          return {
            ...p,
            divulgado,
            valorEstimado: p.valorEstimado ? String(p.valorEstimado) : "0.00",
            fases: fasesComTempo,
            etapaAtual,
            tempoEmAberto,
            tempoTotal,
          };
        })
      );

      // Filtros
      let filtered = result;
      if (input?.situacao) {
        filtered = filtered.filter(p => p.situacao === input.situacao);
      }
      if (input?.modalidade) {
        filtered = filtered.filter(p => p.modalidade === input.modalidade);
      }
      if (input?.tipoContratacao) {
        filtered = filtered.filter(p => p.tipoContratacao === input.tipoContratacao);
      }
      if (input?.busca) {
        const busca = input.busca.toLowerCase();
        filtered = filtered.filter(
          p =>
            p.numeroProcesso.toLowerCase().includes(busca) ||
            p.objeto.toLowerCase().includes(busca)
        );
      }
      if (input?.tempoAberto) {
        if (input.tempoAberto === "ate5") {
          filtered = filtered.filter(p => p.tempoEmAberto <= 5);
        } else if (input.tempoAberto === "6a10") {
          filtered = filtered.filter(p => p.tempoEmAberto >= 6 && p.tempoEmAberto <= 10);
        } else if (input.tempoAberto === "acima10") {
          filtered = filtered.filter(p => p.tempoEmAberto > 10);
        }
      }

      // Ordenar por maior tempo em aberto primeiro
      filtered.sort((a, b) => b.tempoEmAberto - a.tempoEmAberto);

      return filtered;
    }),

  // Buscar processo por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [processo] = await db
        .select()
        .from(processos)
        .where(eq(processos.id, input.id));

      if (!processo) throw new Error("Processo não encontrado");

      const fases = await db
        .select()
        .from(fasesProcesso)
        .where(eq(fasesProcesso.processoId, input.id))
        .orderBy(fasesProcesso.ordem);

      // Campo legado: mantemos na resposta sem depender da coluna no MySQL.
      const divulgado = "Não";
      const fasesComTempo = enriquecerFases(fases);

      const tempoTotal = fasesComTempo.reduce((acc, f) => acc + f.tempoDias, 0);
      const { etapaAtual, tempoEmAberto } = calcularEtapaAtual(fasesComTempo);

      const faseMaisDemorada = fasesComTempo.reduce(
        (max, f) => (f.tempoDias > (max?.tempoDias ?? 0) ? f : max),
        fasesComTempo[0] ?? null
      );

      return {
        ...processo,
        divulgado,
        valorEstimado: processo.valorEstimado ? String(processo.valorEstimado) : "0.00",
        fases: fasesComTempo,
        etapaAtual,
        tempoEmAberto,
        tempoTotal,
        faseMaisDemorada: faseMaisDemorada?.nome ?? "—",
      };
    }),

  // Criar processo
  create: protectedProcedure
    .input(
      z.object({
        numeroProcesso: z.string().min(1),
        objeto: z.string().min(1),
        modalidade: z.string().default("IRP"),
        tipoContratacao: z.string().default("Material"),
        parecerReferencial: z.string().default("Não"),
        quantidadeItens: z.number().default(0),
        numeroIrp: z.string().default(""),
        numeroPregao: z.string().default(""),
        valorEstimado: z.string().default("0"),
        situacao: z.string().default("Em andamento"),
        observacoes: z.string().default(""),
        divulgado: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [result] = await db.insert(processos).values({
        numeroProcesso: input.numeroProcesso,
        objeto: input.objeto,
        modalidade: input.modalidade,
        tipoContratacao: input.tipoContratacao,
        parecerReferencial: input.parecerReferencial,
        quantidadeItens: input.quantidadeItens,
        numeroIrp: input.numeroIrp,
        numeroPregao: input.numeroPregao,
        valorEstimado: input.valorEstimado,
        situacao: input.situacao,
        observacoes: input.observacoes,
      });

      const processoId = (result as any).insertId as number;

      // Criar fases padrão automaticamente
      for (const fase of FASES_PADRAO) {
        await db.insert(fasesProcesso).values({
          processoId,
          ordem: fase.ordem,
          nome: fase.nome,
          observacao: fase.observacao,
          status: "Pendente",
        });
      }

      return { id: processoId, success: true };
    }),

  // Editar processo
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        numeroProcesso: z.string().min(1),
        objeto: z.string().min(1),
        modalidade: z.string(),
        tipoContratacao: z.string(),
        parecerReferencial: z.string(),
        quantidadeItens: z.number().default(0),
        numeroIrp: z.string().default(""),
        numeroPregao: z.string().default(""),
        valorEstimado: z.string().default("0"),
        situacao: z.string(),
        observacoes: z.string().default(""),
        divulgado: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, divulgado: _divulgado, ...data } = input;
      await db.update(processos).set(data).where(eq(processos.id, id));
      return { success: true };
    }),

  // Excluir processo
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(fasesProcesso).where(eq(fasesProcesso.processoId, input.id));
      await db.delete(processos).where(eq(processos.id, input.id));
      return { success: true };
    }),

  // Atualizar fase
  updateFase: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        dataInicio: z.string().nullable().optional(),
        dataFim: z.string().nullable().optional(),
        observacao: z.string().optional(),
        status: z.string().optional(),
        naoSeAplica: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const updateData: Record<string, unknown> = {};
      if (data.observacao !== undefined) updateData.observacao = data.observacao;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.dataInicio !== undefined) updateData.dataInicio = normalizarData(data.dataInicio);
      if (data.dataFim !== undefined) updateData.dataFim = normalizarData(data.dataFim);
      if (data.naoSeAplica !== undefined) {
        updateData.naoSeAplica = data.naoSeAplica ? 1 : 0;
        if (data.naoSeAplica) updateData.status = "Não se aplica";
        else if (data.status === undefined) updateData.status = "Pendente";
      }

      // Calcular tempoDias
      const [fase] = await db.select().from(fasesProcesso).where(eq(fasesProcesso.id, id));
      if (!fase) throw new Error("Fase não encontrada");
      const [processoDaFase] = await db.select().from(processos).where(eq(processos.id, fase.processoId));
      if (!processoDaFase) throw new Error("Processo não encontrado");
            const di = data.dataInicio !== undefined
        ? normalizarData(data.dataInicio)
        : (fase?.dataInicio ? String(fase.dataInicio) : null);
      const df = data.dataFim !== undefined
        ? normalizarData(data.dataFim)
        : (fase?.dataFim ? String(fase.dataFim) : null);
      const faseNaoSeAplica = data.naoSeAplica !== undefined ? data.naoSeAplica : !!fase.naoSeAplica;
      updateData.tempoDias = faseNaoSeAplica ? 0 : calcularTempoDias(di, df);

      await db.update(fasesProcesso).set(updateData).where(eq(fasesProcesso.id, id));
      return { success: true };
    }),

  // Dashboard stats
  dashboard: protectedProcedure.query(async () => {
    const rows = await db.select().from(processos);

    const total = rows.length;
    const emAndamento = rows.filter(p => p.situacao === "Em andamento").length;
    const finalizados = rows.filter(p => p.situacao === "Finalizado").length;

    const allFases = await db.select().from(fasesProcesso);

    // Tempo total por processo
    const temposPorProcesso: Record<number, number> = {};
    for (const fase of allFases) {
      if (!!fase.naoSeAplica) continue;
      const di = fase.dataInicio ? String(fase.dataInicio) : null;
      const df = fase.dataFim ? String(fase.dataFim) : null;
      const dias = calcularTempoDias(di, df);
      temposPorProcesso[fase.processoId] = (temposPorProcesso[fase.processoId] ?? 0) + dias;
    }

    const tempos = Object.values(temposPorProcesso);
    const tempoMedioTotal = tempos.length > 0
      ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
      : 0;

    // Tempo médio por fase (nome)
    const tempoPorFaseNome: Record<string, number[]> = {};
    for (const fase of allFases) {
      if (!!fase.naoSeAplica) continue;
      const di = fase.dataInicio ? String(fase.dataInicio) : null;
      const df = fase.dataFim ? String(fase.dataFim) : null;
      const dias = calcularTempoDias(di, df);
      if (!tempoPorFaseNome[fase.nome]) tempoPorFaseNome[fase.nome] = [];
      tempoPorFaseNome[fase.nome].push(dias);
    }

    const mediaPorFase = Object.entries(tempoPorFaseNome).map(([nome, dias]) => ({
      nome,
      media: Math.round(dias.reduce((a, b) => a + b, 0) / dias.length),
    }));

    const faseMaisLenta = mediaPorFase.reduce(
      (max, f) => (f.media > (max?.media ?? 0) ? f : max),
      mediaPorFase[0] ?? null
    );

    // Processos com tempo elevado (>10 dias em aberto)
    const processosComTempoElevado = await Promise.all(
      rows.map(async (p) => {
        const fases = await db
          .select()
          .from(fasesProcesso)
          .where(eq(fasesProcesso.processoId, p.id))
          .orderBy(fasesProcesso.ordem);

        const fasesComTempo = enriquecerFases(fases);

        const { etapaAtual, tempoEmAberto } = calcularEtapaAtual(fasesComTempo);
        const tempoTotal = fasesComTempo.reduce(
          (acc, f) => acc + calcularTempoDias(f.dataInicio, f.dataFim),
          0
        );

        return {
          id: p.id,
          numeroProcesso: p.numeroProcesso,
          objeto: p.objeto,
          situacao: p.situacao,
          etapaAtual,
          tempoEmAberto,
          tempoTotal,
        };
      })
    );

    const comTempoElevado = processosComTempoElevado.filter(p => p.tempoEmAberto > 10);
    const maioresTempos = [...processosComTempoElevado]
      .sort((a, b) => b.tempoEmAberto - a.tempoEmAberto)
      .slice(0, 5);

    return {
      total,
      emAndamento,
      finalizados,
      tempoMedioTotal,
      faseMaisLenta: faseMaisLenta?.nome ?? "—",
      faseMaisLentaMedia: faseMaisLenta?.media ?? 0,
      comTempoElevado: comTempoElevado.length,
      mediaPorFase,
      maioresTempos,
    };
  }),
});
