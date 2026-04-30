import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
  PieChart, Pie, Sector,
} from "recharts";
import { trpc } from "../lib/trpc";
import { colors, font, base, shadows, priorityStyle } from "../lib/design";
import {
  calcularTempoMedioGeral,
  rankingPrioridade,
  analisePorEtapa,
  rankingFasesMaisLentas,
  evolucaoTemporal,
  indicadoresFluxo,
  gerarAlertas,
  calcularResumoExecutivo,
  faseMaiorAcumulo,
} from "../lib/analytics";

// ─── Ícones ──────────────────────────────────────────────────
const IconTrend    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IconAlert    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconInfo     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconFolder   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconActivity = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconCheck    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconClock    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconAlertBig = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconStar     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

// ─── Componentes base ─────────────────────────────────────────

function MetricCard({ label, value, sub, icon, accent, iconBg }: any) {
  return (
    <div style={{ ...base.card, padding: "18px 20px", borderTop: `2px solid ${accent}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: colors.gray[500], textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: colors.primary[800], lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: colors.gray[500], marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: accent, flexShrink: 0, opacity: 0.9 }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding: "14px 20px", background: colors.gray[50], borderBottom: `1px solid ${colors.gray[200]}` }}>
      <div style={{ fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.gray[800] }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: colors.gray[400], marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SituacaoBadge({ sit }: { sit: string }) {
  const map: Record<string, any> = {
    "Em andamento": { bg: colors.info.light, color: colors.info.dark },
    "Finalizado":   { bg: colors.success.light, color: colors.success.dark },
    "Cancelado":    { bg: colors.gray[100], color: colors.gray[600] },
  };
  const st = map[sit] ?? { bg: colors.gray[100], color: colors.gray[600] };
  return <span style={{ ...base.badge, ...st }}>{sit}</span>;
}

function BarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: `1px solid ${colors.gray[200]}`, borderRadius: 8, padding: "10px 14px", boxShadow: shadows.md, fontSize: 12 }}>
      <div style={{ color: colors.gray[500], marginBottom: 4, fontSize: 11 }}>{payload[0]?.payload?.fullName ?? payload[0]?.payload?.nome}</div>
      <div style={{ fontWeight: 700, color: colors.primary[700] }}>{payload[0]?.value} dias</div>
    </div>
  );
}

// ─── Gauge de progresso circular ─────────────────────────────
function GaugePie({ pct, color, label }: { pct: number; color: string; label: string }) {
  const data = [{ value: pct }, { value: 100 - pct }];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ position: "relative", width: 80, height: 80 }}>
        <PieChart width={80} height={80}>
          <Pie data={data} cx={35} cy={35} innerRadius={26} outerRadius={36} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
            <Cell fill={color} />
            <Cell fill={colors.gray[100]} />
          </Pie>
        </PieChart>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color }}>
          {pct}%
        </div>
      </div>
      <div style={{ fontSize: 11, color: colors.gray[500], textAlign: "center", maxWidth: 80 }}>{label}</div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();

  // Busca os dois endpoints existentes
  const dashQuery  = trpc.processos.dashboard.useQuery();
  const listQuery  = trpc.processos.list.useQuery({});

  const isLoading = dashQuery.isLoading || listQuery.isLoading;
  const hasError  = dashQuery.error || listQuery.error;

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: colors.gray[400] }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        Carregando análise de desempenho...
      </div>
    </div>
  );

  if (hasError) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ ...base.card, padding: "24px 32px", textAlign: "center", borderTop: `3px solid ${colors.danger.mid}` }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
        <div style={{ color: colors.danger.dark, fontWeight: 600 }}>Erro ao carregar dados</div>
      </div>
    </div>
  );

  const dash = dashQuery.data!;
  const processos = (listQuery.data ?? []) as any[];

  // ── Cálculos analíticos ──────────────────────────────────────
  const tempoMedioGeral   = calcularTempoMedioGeral(processos);
  const ranking           = rankingPrioridade(processos, 10);
  const etapas            = analisePorEtapa(processos);
  const fasesMaisLentas   = rankingFasesMaisLentas(dash.mediaPorFase as any[], 5);
  const evolucao          = evolucaoTemporal(processos);
  const fluxo             = indicadoresFluxo(processos);
  const alertas           = gerarAlertas(processos, etapas, dash.mediaPorFase as any[], tempoMedioGeral);
  const resumo            = calcularResumoExecutivo(processos, dash.mediaPorFase as any[], etapas);
  const faseMaiorAcum     = faseMaiorAcumulo(etapas);

  const acimaDaMedia = processos.filter((p: any) => p.tempoTotal > tempoMedioGeral).length;

  // Dados para gráfico de fases mais lentas
  const chartFases = fasesMaisLentas.map((f, i) => ({
    name: `F${i + 1}`,
    media: f.media,
    fullName: f.nome,
  }));

  // Dados para gráfico de etapas (distribuição)
  const chartEtapas = etapas.slice(0, 8).map(e => ({
    nome: e.nome.length > 22 ? e.nome.slice(0, 22) + "…" : e.nome,
    fullName: e.nome,
    quantidade: e.quantidade,
    tempoMedio: e.tempoMedio,
  }));

  const getBarColor = (v: number) =>
    v <= 5 ? colors.success.mid : v <= 10 ? colors.warning.mid : colors.danger.mid;

  return (
    <div style={{ maxWidth: 1360 }}>
      {/* ── Cabeçalho ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: font.size["2xl"], fontWeight: font.weight.bold, color: colors.gray[900], margin: 0 }}>
          Painel de Análise de Desempenho
        </h1>
        <p style={{ fontSize: 13, color: colors.gray[500], marginTop: 4 }}>
          Identificação de gargalos, priorização e apoio à decisão — dados calculados em tempo real
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          SEÇÃO 1 — RESUMO EXECUTIVO
      ══════════════════════════════════════════════════════ */}
      <div style={{ ...base.card, padding: 0, overflow: "hidden", marginBottom: 20, borderTop: `3px solid ${colors.primary[600]}` }}>
        <SectionHeader title="📊 Resumo Executivo" sub="Visão consolidada dos indicadores principais" />
        <div style={{ padding: "20px 20px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px 24px" }}>
          {[
            { label: "Total de Processos",    value: resumo.total,                    color: colors.primary[700] },
            { label: "Tempo Médio Geral",      value: `${resumo.tempoMedioGeral} dias`, color: colors.warning.dark },
            { label: "Taxa de Finalização",    value: `${resumo.taxaFinalizacao}%`,     color: colors.success.dark },
            { label: "Acima da Média",         value: `${resumo.pctAcimaDaMedia}%`,     color: resumo.pctAcimaDaMedia > 50 ? colors.danger.dark : colors.warning.dark },
            { label: "Fase Crítica (Gargalo)", value: resumo.faseCritica,              color: colors.danger.dark, small: true },
            { label: "Média na Fase Crítica",  value: `${resumo.faseMaisLentaMedia} dias`, color: colors.danger.dark },
          ].map(({ label, value, color, small }) => (
            <div key={label} style={{ borderLeft: `3px solid ${color}20`, paddingLeft: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: colors.gray[400], textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 }}>
                {label}
              </div>
              <div style={{
                fontSize: small ? 12 : 22, fontWeight: 800, color,
                lineHeight: 1.2, wordBreak: "break-word",
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SEÇÃO 2 — ALERTAS INTELIGENTES
      ══════════════════════════════════════════════════════ */}
      {alertas.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.gray[600], marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
            🔔 Alertas Inteligentes
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
            {alertas.map((a, i) => {
              const bg    = a.tipo === "danger" ? colors.danger.light  : a.tipo === "warning" ? colors.warning.light : colors.info.light;
              const color = a.tipo === "danger" ? colors.danger.dark   : a.tipo === "warning" ? colors.warning.dark  : colors.info.dark;
              const border= a.tipo === "danger" ? colors.danger.mid    : a.tipo === "warning" ? colors.warning.mid   : colors.info.mid;
              return (
                <div key={i} style={{
                  background: bg, border: `1px solid ${border}40`,
                  borderLeft: `4px solid ${border}`,
                  borderRadius: 8, padding: "12px 14px",
                  display: "flex", gap: 10, alignItems: "flex-start",
                }}>
                  <div style={{ color, marginTop: 1, flexShrink: 0 }}>
                    {a.tipo === "info" ? <IconInfo /> : <IconAlert />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color }}>{a.mensagem}</div>
                    {a.detalhe && <div style={{ fontSize: 11, color, opacity: 0.8, marginTop: 3 }}>{a.detalhe}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SEÇÃO 3 — CARDS DE MÉTRICAS
      ══════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: 14, marginBottom: 20 }}>
        <MetricCard label="Total de Processos"   value={dash.total}            icon={<IconFolder />}   accent={colors.primary[600]} iconBg={colors.primary[50]} />
        <MetricCard label="Em Andamento"          value={dash.emAndamento}      sub="processos ativos"  icon={<IconActivity />}  accent={colors.info.mid}    iconBg={colors.info.light} />
        <MetricCard label="Finalizados"           value={dash.finalizados}      sub="concluídos"        icon={<IconCheck />}     accent={colors.success.mid} iconBg={colors.success.light} />
        <MetricCard label="Tempo Médio Geral"     value={`${tempoMedioGeral}d`} sub="por processo"      icon={<IconClock />}     accent={colors.warning.mid} iconBg={colors.warning.light} />
        <MetricCard label="Acima da Média"        value={acimaDaMedia}          sub={`de ${dash.total} processos`} icon={<IconTrend />} accent={colors.danger.mid} iconBg={colors.danger.light} />
        <MetricCard label="Tempo Elevado (>10d)"  value={dash.comTempoElevado}  sub="em aberto"         icon={<IconAlertBig />}  accent={colors.danger.dark} iconBg={colors.danger.light} />
      </div>

      {/* ══════════════════════════════════════════════════════
          SEÇÃO 4 — INDICADORES DE FLUXO + GARGALOS
      ══════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, marginBottom: 20 }}>
        {/* Indicadores de fluxo */}
        <div style={{ ...base.card, padding: 0, overflow: "hidden" }}>
          <SectionHeader title="Indicadores de Fluxo" sub="Distribuição por situação" />
          <div style={{ padding: "24px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 24 }}>
              <GaugePie pct={fluxo.pctFinalizados}  color={colors.success.mid} label="Finalizados" />
              <GaugePie pct={fluxo.pctEmAndamento}  color={colors.info.mid}    label="Em Andamento" />
              <GaugePie pct={fluxo.pctCancelados}   color={colors.gray[400]}   label="Cancelados" />
            </div>
            {/* Barra de progresso geral */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: colors.gray[500], marginBottom: 4 }}>
                <span>Taxa de finalização</span>
                <span style={{ fontWeight: 700, color: colors.success.dark }}>{fluxo.pctFinalizados}%</span>
              </div>
              <div style={{ background: colors.gray[200], borderRadius: 6, height: 8, overflow: "hidden" }}>
                <div style={{ width: `${fluxo.pctFinalizados}%`, height: "100%", background: `linear-gradient(90deg, ${colors.success.mid}, ${colors.primary[500]})`, borderRadius: 6, transition: "width 0.5s" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 fases mais lentas */}
        <div style={{ ...base.card, padding: 0, overflow: "hidden" }}>
          <SectionHeader title="Top 5 Fases com Maior Tempo Médio (Gargalos)" sub="Fases que mais impactam o tempo total dos processos" />
          <div style={{ padding: "16px 20px" }}>
            {chartFases.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: colors.gray[400] }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
                Nenhum dado disponível ainda
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartFases} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[100]} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: colors.gray[400] }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: colors.gray[400] }} axisLine={false} tickLine={false} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="media" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {chartFases.map((e: any, i: number) => <Cell key={i} fill={getBarColor(e.media)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8 }}>
                  {fasesMaisLentas.map((f, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "6px 0", borderBottom: i < fasesMaisLentas.length - 1 ? `1px solid ${colors.gray[100]}` : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: i === 0 ? colors.danger.light : i === 1 ? colors.warning.light : colors.gray[100],
                          color: i === 0 ? colors.danger.dark : i === 1 ? colors.warning.dark : colors.gray[500],
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 800,
                        }}>
                          {i + 1}
                        </div>
                        <span style={{ fontSize: 12, color: colors.gray[700], maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {f.nome}
                        </span>
                      </div>
                      <span style={{ ...base.badge, ...priorityStyle(f.media), fontSize: 11, flexShrink: 0 }}>
                        {f.media} dias
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SEÇÃO 5 — ANÁLISE POR ETAPA
      ══════════════════════════════════════════════════════ */}
      <div style={{ ...base.card, padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <SectionHeader
          title="Análise por Etapa Atual"
          sub={faseMaiorAcum ? `Maior acúmulo: "${faseMaiorAcum.nome}" (${faseMaiorAcum.quantidade} processo${faseMaiorAcum.quantidade > 1 ? "s" : ""})` : "Distribuição de processos por fase atual"}
        />
        <div style={{ padding: "16px 20px" }}>
          {etapas.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: colors.gray[400] }}>
              Nenhum processo em andamento
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              {/* Gráfico de barras horizontal */}
              <div>
                <ResponsiveContainer width="100%" height={Math.max(160, chartEtapas.length * 36)}>
                  <BarChart data={chartEtapas} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[100]} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: colors.gray[400] }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 10, fill: colors.gray[600] }} width={160} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: any, name: string) => [v, name === "quantidade" ? "Processos" : "Tempo médio (dias)"]}
                      labelFormatter={(_: any, payload: any[]) => payload?.[0]?.payload?.fullName ?? ""}
                    />
                    <Bar dataKey="quantidade" fill={colors.primary[400]} radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabela de etapas */}
              <div style={{ overflowY: "auto", maxHeight: 300 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: colors.gray[50] }}>
                      {["Etapa", "Processos", "Tempo Médio"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "7px 10px", fontSize: 10, fontWeight: 700, color: colors.gray[500], textTransform: "uppercase", borderBottom: `2px solid ${colors.gray[200]}` }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {etapas.map((e, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : colors.gray[50] }}>
                        <td style={{ padding: "8px 10px", fontSize: 12, color: colors.gray[700], maxWidth: 200 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                            {e.nome}
                          </div>
                          {faseMaiorAcum?.nome === e.nome && (
                            <span style={{ fontSize: 9, background: colors.warning.light, color: colors.warning.dark, borderRadius: 4, padding: "1px 5px", fontWeight: 700, marginTop: 2, display: "inline-block" }}>
                              MAIOR ACÚMULO
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 700, color: colors.primary[700] }}>
                          {e.quantidade}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ ...base.badge, ...priorityStyle(e.tempoMedio), fontSize: 11 }}>
                            {e.tempoMedio} dias
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SEÇÃO 6 — EVOLUÇÃO TEMPORAL
      ══════════════════════════════════════════════════════ */}
      <div style={{ ...base.card, padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <SectionHeader title="Evolução Temporal" sub="Processos iniciados e finalizados por mês (últimos 12 meses)" />
        <div style={{ padding: "16px 20px" }}>
          {evolucao.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: colors.gray[400] }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📈</div>
              <div style={{ fontSize: 13 }}>Dados insuficientes para gerar o gráfico temporal.</div>
              <div style={{ fontSize: 11, marginTop: 4, color: colors.gray[300] }}>Cadastre processos para visualizar a evolução.</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={evolucao} margin={{ top: 4, right: 16, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[100]} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: colors.gray[400] }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: colors.gray[400] }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: `1px solid ${colors.gray[200]}`, fontSize: 12 }}
                  formatter={(v: any, name: string) => [v, name === "iniciados" ? "Iniciados" : name === "finalizados" ? "Finalizados" : "Tempo Médio (dias)"]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="iniciados"   stroke={colors.primary[500]} strokeWidth={2} dot={{ r: 4 }} name="iniciados" />
                <Line type="monotone" dataKey="finalizados" stroke={colors.success.mid}  strokeWidth={2} dot={{ r: 4 }} name="finalizados" />
                <Line type="monotone" dataKey="tempoMedio"  stroke={colors.warning.mid}  strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" name="tempoMedio" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SEÇÃO 7 — TOP 10 PROCESSOS CRÍTICOS
      ══════════════════════════════════════════════════════ */}
      <div style={{ ...base.card, padding: 0, overflow: "hidden" }}>
        <SectionHeader
          title="🏆 Top 10 Processos Críticos"
          sub="Ordenados por maior tempo em aberto, depois por maior tempo total"
        />
        {ranking.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: colors.gray[400] }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>Nenhum processo cadastrado ainda.</div>
            <button style={{ ...base.btnPrimary, fontSize: 13 }} onClick={() => navigate("/processos/novo")}>
              + Cadastrar primeiro processo
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: colors.gray[50] }}>
                {["#", "Processo", "Objeto", "Situação", "Etapa Atual", "Em Aberto", "Total", "Prioridade"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, fontWeight: 700, color: colors.gray[500], textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `2px solid ${colors.gray[200]}`, whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranking.map((p: any, i: number) => {
                const isAcima = p.tempoTotal > tempoMedioGeral;
                const rowBg = i % 2 === 0 ? "#fff" : colors.gray[50];
                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/processos/${p.id}`)}
                    style={{ cursor: "pointer", background: rowBg, transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = colors.primary[50])}
                    onMouseLeave={e => (e.currentTarget.style.background = rowBg)}
                  >
                    {/* Posição */}
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: i === 0 ? colors.danger.light : i === 1 ? colors.warning.light : i === 2 ? colors.primary[50] : colors.gray[100],
                        color: i === 0 ? colors.danger.dark : i === 1 ? colors.warning.dark : i === 2 ? colors.primary[700] : colors.gray[500],
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800,
                      }}>
                        {i < 3 ? <IconStar /> : i + 1}
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: colors.primary[700] }}>
                      {p.numeroProcesso}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: colors.gray[600], maxWidth: 220 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                        {p.objeto}
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <SituacaoBadge sit={p.situacao} />
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: colors.gray[600], maxWidth: 180 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                        {p.etapaAtual}
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ ...base.badge, ...priorityStyle(p.tempoEmAberto), fontSize: 11 }}>
                          {p.tempoEmAberto} dias
                        </span>
                        {p.tempoEmAberto > 10 && (
                          <span style={{ fontSize: 9, color: colors.danger.dark, fontWeight: 700, textTransform: "uppercase" }}>
                            ⚠ Tempo elevado
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 13, color: colors.gray[600] }}>
                      {p.tempoTotal} dias
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      {isAcima ? (
                        <span style={{ ...base.badge, background: colors.warning.light, color: colors.warning.dark, fontSize: 10 }}>
                          Acima da média
                        </span>
                      ) : (
                        <span style={{ ...base.badge, background: colors.success.light, color: colors.success.dark, fontSize: 10 }}>
                          Na média
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
