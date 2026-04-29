// ============================================================
// UFMG Pré-Compras — Motor de Análise de Desempenho
// Todas as métricas calculadas no frontend a partir dos dados
// retornados pelos endpoints existentes (sem alterar backend).
// ============================================================

export interface ProcessoFlat {
  id: number;
  numeroProcesso: string;
  objeto: string;
  situacao: string;
  modalidade: string;
  tipoContratacao: string;
  etapaAtual: string;
  tempoEmAberto: number;
  tempoTotal: number;
  createdAt?: string | null;
  fases?: FaseFlat[];
}

export interface FaseFlat {
  id: number;
  processoId: number;
  ordem: number;
  nome: string;
  dataInicio: string | null;
  dataFim: string | null;
  tempoDias: number;
  observacao?: string | null;
}

// ─── 1. Tempo médio geral ─────────────────────────────────────

export function calcularTempoMedioGeral(processos: ProcessoFlat[]): number {
  if (processos.length === 0) return 0;
  const soma = processos.reduce((acc, p) => acc + p.tempoTotal, 0);
  return Math.round(soma / processos.length);
}

// ─── 2. Marcar processos acima da média ──────────────────────

export function marcarAcimaDaMedia(
  processos: ProcessoFlat[],
  media: number
): (ProcessoFlat & { acimaDaMedia: boolean })[] {
  return processos.map(p => ({
    ...p,
    acimaDaMedia: p.tempoTotal > media,
  }));
}

// ─── 3. Ranking de prioridade (Top N críticos) ────────────────

export function rankingPrioridade(processos: ProcessoFlat[], top = 10): ProcessoFlat[] {
  return [...processos]
    .filter(p => p.situacao !== "Cancelado")
    .sort((a, b) => {
      // 1º critério: tempo em aberto (desc)
      if (b.tempoEmAberto !== a.tempoEmAberto) return b.tempoEmAberto - a.tempoEmAberto;
      // 2º critério: tempo total (desc)
      return b.tempoTotal - a.tempoTotal;
    })
    .slice(0, top);
}

// ─── 4. Análise por etapa ─────────────────────────────────────

export interface EtapaStats {
  nome: string;
  quantidade: number;
  tempoMedio: number;
}

export function analisePorEtapa(processos: ProcessoFlat[]): EtapaStats[] {
  const mapa: Record<string, { count: number; tempos: number[] }> = {};

  for (const p of processos) {
    if (!p.etapaAtual || p.etapaAtual === "Processo finalizado") continue;
    if (!mapa[p.etapaAtual]) mapa[p.etapaAtual] = { count: 0, tempos: [] };
    mapa[p.etapaAtual].count++;
    mapa[p.etapaAtual].tempos.push(p.tempoEmAberto);
  }

  return Object.entries(mapa)
    .map(([nome, { count, tempos }]) => ({
      nome,
      quantidade: count,
      tempoMedio: tempos.length > 0 ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : 0,
    }))
    .sort((a, b) => b.quantidade - a.quantidade);
}

// ─── 5. Fase com maior acúmulo de processos ──────────────────

export function faseMaiorAcumulo(etapas: EtapaStats[]): EtapaStats | null {
  if (etapas.length === 0) return null;
  return etapas.reduce((max, e) => (e.quantidade > max.quantidade ? e : max), etapas[0]);
}

// ─── 6. Ranking das fases mais lentas (Top 5) ────────────────

export interface FaseRanking {
  nome: string;
  media: number;
  totalOcorrencias: number;
}

export function rankingFasesMaisLentas(
  mediaPorFase: { nome: string; media: number }[],
  top = 5
): FaseRanking[] {
  return [...mediaPorFase]
    .filter(f => f.media > 0)
    .sort((a, b) => b.media - a.media)
    .slice(0, top)
    .map(f => ({ ...f, totalOcorrencias: 0 }));
}

// ─── 7. Evolução temporal (processos por mês) ─────────────────

export interface MesEvolucao {
  mes: string;        // "Jan/24"
  mesKey: string;     // "2024-01"
  iniciados: number;
  finalizados: number;
  tempoMedio: number;
}

export function evolucaoTemporal(processos: ProcessoFlat[]): MesEvolucao[] {
  const mapa: Record<string, { iniciados: number; finalizados: number; tempos: number[] }> = {};

  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  for (const p of processos) {
    // Usa createdAt como data de início
    const rawDate = p.createdAt;
    if (!rawDate) continue;

    const d = new Date(rawDate);
    if (isNaN(d.getTime())) continue;

    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;

    if (!mapa[key]) mapa[key] = { iniciados: 0, finalizados: 0, tempos: [] };
    mapa[key].iniciados++;
    mapa[key].tempos.push(p.tempoTotal);

    if (p.situacao === "Finalizado") {
      mapa[key].finalizados++;
    }
  }

  // Ordenar por data e retornar últimos 12 meses com dados
  return Object.entries(mapa)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, v]) => {
      const [year, month] = key.split("-");
      const label = `${MESES[parseInt(month) - 1]}/${year.slice(2)}`;
      return {
        mes: label,
        mesKey: key,
        iniciados: v.iniciados,
        finalizados: v.finalizados,
        tempoMedio: v.tempos.length > 0
          ? Math.round(v.tempos.reduce((a, b) => a + b, 0) / v.tempos.length)
          : 0,
      };
    });
}

// ─── 8. Indicadores de fluxo ─────────────────────────────────

export interface FluxoIndicadores {
  pctFinalizados: number;
  pctEmAndamento: number;
  pctCancelados: number;
  totalAtivos: number;
}

export function indicadoresFluxo(processos: ProcessoFlat[]): FluxoIndicadores {
  const total = processos.length;
  if (total === 0) return { pctFinalizados: 0, pctEmAndamento: 0, pctCancelados: 0, totalAtivos: 0 };

  const finalizados = processos.filter(p => p.situacao === "Finalizado").length;
  const emAndamento = processos.filter(p => p.situacao === "Em andamento").length;
  const cancelados  = processos.filter(p => p.situacao === "Cancelado").length;

  return {
    pctFinalizados:  Math.round((finalizados / total) * 100),
    pctEmAndamento:  Math.round((emAndamento / total) * 100),
    pctCancelados:   Math.round((cancelados / total) * 100),
    totalAtivos:     emAndamento,
  };
}

// ─── 9. Alertas inteligentes ─────────────────────────────────

export interface Alerta {
  tipo: "warning" | "danger" | "info";
  mensagem: string;
  detalhe?: string;
}

export function gerarAlertas(
  processos: ProcessoFlat[],
  etapas: EtapaStats[],
  mediaPorFase: { nome: string; media: number }[],
  tempoMedioGeral: number
): Alerta[] {
  const alertas: Alerta[] = [];

  // Alto volume em uma fase
  const faseMaior = faseMaiorAcumulo(etapas);
  if (faseMaior && faseMaior.quantidade >= 3) {
    alertas.push({
      tipo: "warning",
      mensagem: `Alto volume na fase: ${faseMaior.nome}`,
      detalhe: `${faseMaior.quantidade} processo${faseMaior.quantidade > 1 ? "s" : ""} aguardando nesta etapa`,
    });
  }

  // Fase com tempo médio muito acima da média geral
  const fasesCriticas = mediaPorFase.filter(f => f.media > tempoMedioGeral * 1.5 && f.media > 5);
  if (fasesCriticas.length > 0) {
    const pior = fasesCriticas.sort((a, b) => b.media - a.media)[0];
    alertas.push({
      tipo: "danger",
      mensagem: `Tempo médio elevado na fase: ${pior.nome}`,
      detalhe: `Média de ${pior.media} dias — ${Math.round((pior.media / Math.max(tempoMedioGeral, 1)) * 100 - 100)}% acima da média geral`,
    });
  }

  // Muitos processos acima da média
  const acimaDaMedia = processos.filter(p => p.tempoTotal > tempoMedioGeral).length;
  const pctAcima = processos.length > 0 ? Math.round((acimaDaMedia / processos.length) * 100) : 0;
  if (pctAcima > 50 && processos.length >= 3) {
    alertas.push({
      tipo: "warning",
      mensagem: `${pctAcima}% dos processos estão acima do tempo médio`,
      detalhe: `${acimaDaMedia} de ${processos.length} processos ultrapassam ${tempoMedioGeral} dias`,
    });
  }

  // Processos com tempo elevado (>10 dias em aberto)
  const tempoElevado = processos.filter(p => p.tempoEmAberto > 10 && p.situacao === "Em andamento");
  if (tempoElevado.length > 0) {
    alertas.push({
      tipo: "danger",
      mensagem: `${tempoElevado.length} processo${tempoElevado.length > 1 ? "s" : ""} com tempo elevado em aberto`,
      detalhe: `Mais de 10 dias na etapa atual sem movimentação`,
    });
  }

  // Nenhum processo finalizado nos últimos dados
  const finalizados = processos.filter(p => p.situacao === "Finalizado").length;
  if (processos.length >= 5 && finalizados === 0) {
    alertas.push({
      tipo: "info",
      mensagem: "Nenhum processo finalizado até o momento",
      detalhe: "Considere revisar o andamento dos processos em aberto",
    });
  }

  return alertas.slice(0, 4); // máximo 4 alertas
}

// ─── 10. Resumo Executivo ─────────────────────────────────────

export interface ResumoExecutivo {
  total: number;
  tempoMedioGeral: number;
  faseCritica: string;
  pctAcimaDaMedia: number;
  tempoMedioFaseAtual: number;
  faseMaisLenta: string;
  faseMaisLentaMedia: number;
  taxaFinalizacao: number;
}

export function calcularResumoExecutivo(
  processos: ProcessoFlat[],
  mediaPorFase: { nome: string; media: number }[],
  etapas: EtapaStats[]
): ResumoExecutivo {
  const total = processos.length;
  const tempoMedioGeral = calcularTempoMedioGeral(processos);

  const acimaDaMedia = processos.filter(p => p.tempoTotal > tempoMedioGeral).length;
  const pctAcimaDaMedia = total > 0 ? Math.round((acimaDaMedia / total) * 100) : 0;

  const faseMaisLenta = mediaPorFase.length > 0
    ? mediaPorFase.reduce((max, f) => (f.media > max.media ? f : max), mediaPorFase[0])
    : null;

  const faseMaiorAcumuloItem = faseMaiorAcumulo(etapas);

  // Tempo médio na fase atual (etapa com mais processos)
  const tempoMedioFaseAtual = faseMaiorAcumuloItem?.tempoMedio ?? 0;

  const finalizados = processos.filter(p => p.situacao === "Finalizado").length;
  const taxaFinalizacao = total > 0 ? Math.round((finalizados / total) * 100) : 0;

  return {
    total,
    tempoMedioGeral,
    faseCritica: faseMaisLenta?.nome ?? "—",
    pctAcimaDaMedia,
    tempoMedioFaseAtual,
    faseMaisLenta: faseMaisLenta?.nome ?? "—",
    faseMaisLentaMedia: faseMaisLenta?.media ?? 0,
    taxaFinalizacao,
  };
}

// ─── 11. Fase crítica por processo ───────────────────────────

export function faseCriticaDoProcesso(fases: FaseFlat[]): string {
  if (!fases || fases.length === 0) return "—";
  const comTempo = fases.filter(f => f.tempoDias > 0);
  if (comTempo.length === 0) return "—";
  return comTempo.reduce((max, f) => (f.tempoDias > max.tempoDias ? f : max), comTempo[0]).nome;
}
