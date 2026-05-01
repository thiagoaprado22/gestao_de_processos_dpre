import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { colors, font, base, priorityStyle, situacaoStyle } from "../lib/design";
import { calcularTempoMedioGeral, faseCriticaDoProcesso } from "../lib/analytics";

// ─── Ícones ──────────────────────────────────────────────────
const IconSearch   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconFilter   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const IconDownload = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IconPlus     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconX        = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconTrend    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;

// ─── Componentes auxiliares ───────────────────────────────────

function PriorityBadge({ days }: { days: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ ...base.badge, ...priorityStyle(days), fontSize: 11, padding: "3px 8px", whiteSpace: "nowrap" }}>
        {days} dias em aberto
      </span>
    </div>
  );
}

function SituacaoBadge({ sit }: { sit: string }) {
  return <span style={{ ...base.badge, ...situacaoStyle(sit), fontSize: 11, padding: "3px 8px", whiteSpace: "nowrap" }}>{sit}</span>;
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 150 }}>
      <label style={base.label}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...base.input, padding: "7px 10px", cursor: "pointer", appearance: "auto", fontSize: 13 }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function ProcessosList() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [tipoContratacao, setTipoContratacao] = useState("");
  const [tempoAberto, setTempoAberto] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);

  const { data, isLoading, error, refetch } = trpc.processos.list.useQuery({
    busca: busca || undefined,
    situacao: situacao || undefined,
    modalidade: modalidade || undefined,
    tipoContratacao: tipoContratacao || undefined,
    tempoAberto: tempoAberto || undefined,
  });

  // Busca todos os processos (sem filtro) para calcular a média geral
  const { data: allData } = trpc.processos.list.useQuery({});

  const deleteMutation = trpc.processos.delete.useMutation({
    onSuccess: () => refetch(),
  });

  // Calcular tempo médio geral de TODOS os processos
  const tempoMedioGeral = useMemo(
    () => calcularTempoMedioGeral((allData ?? []) as any[]),
    [allData]
  );

  const hasFilters = !!(busca || situacao || modalidade || tipoContratacao || tempoAberto);

  function clearFilters() {
    setBusca(""); setSituacao(""); setModalidade("");
    setTipoContratacao(""); setTempoAberto("");
  }

  function handleDelete(id: number, numero: string) {
    if (confirm(`Excluir o processo "${numero}"?\n\nEsta ação não pode ser desfeita.`)) {
      deleteMutation.mutate({ id });
    }
  }

  function exportCSV() {
    if (!data || data.length === 0) return;
    const headers = ["Número", "Objeto", "Modalidade", "Tipo", "Situação", "Etapa Atual", "Fase Crítica", "Tempo em Aberto (dias)", "Tempo Total (dias)", "Acima da Média"];
    const rows = (data as any[]).map((p: any) => {
      const faseCritica = faseCriticaDoProcesso(p.fases ?? []);
      const acima = p.tempoTotal > tempoMedioGeral ? "Sim" : "Não";
      return [
        p.numeroProcesso,
        `"${p.objeto.replace(/"/g, '""')}"`,
        p.modalidade,
        p.tipoContratacao,
        p.situacao,
        `"${p.etapaAtual.replace(/"/g, '""')}"`,
        `"${faseCritica.replace(/"/g, '""')}"`,
        p.tempoEmAberto,
        p.tempoTotal,
        acima,
      ];
    });
    const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "processos-precompras.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: 1400 }}>
      {/* ── Cabeçalho ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: font.size["2xl"], fontWeight: font.weight.bold, color: colors.gray[900], margin: 0 }}>
            Processos
          </h1>
          <p style={{ fontSize: font.size.sm, color: colors.gray[500], marginTop: 4 }}>
            {data
              ? `${data.length} processo${data.length !== 1 ? "s" : ""} encontrado${data.length !== 1 ? "s" : ""} · Tempo médio geral: ${tempoMedioGeral} dias`
              : "Carregando..."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            style={{ ...base.btnGhost, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
            onClick={exportCSV}
          >
            <IconDownload /> Exportar CSV
          </button>
          <button
            style={{ ...base.btnPrimary, display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => navigate("/processos/novo")}
          >
            <IconPlus /> Novo Processo
          </button>
        </div>
      </div>

      {/* ── Mini painel analítico ── */}
      {!isLoading && data && data.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button
            style={{
              ...base.btnGhost, fontSize: 12, padding: "5px 12px",
              display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
              background: showAnalytics ? colors.primary[50] : "#fff",
              color: showAnalytics ? colors.primary[700] : colors.gray[500],
            }}
            onClick={() => setShowAnalytics(v => !v)}
          >
            <IconTrend /> {showAnalytics ? "Ocultar análise rápida" : "Mostrar análise rápida"}
          </button>
          {showAnalytics && (() => {
            const todos = (data as any[]);
            const acimaDaMedia = todos.filter((p: any) => p.tempoTotal > tempoMedioGeral);
            const tempoElevado = todos.filter((p: any) => p.tempoEmAberto > 10);
            const pctAcima = todos.length > 0 ? Math.round((acimaDaMedia.length / todos.length) * 100) : 0;
            return (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                {[
                  { label: "Tempo médio geral", value: `${tempoMedioGeral} dias`, color: colors.warning.dark, bg: colors.warning.light },
                  { label: "Acima da média", value: `${acimaDaMedia.length} (${pctAcima}%)`, color: colors.danger.dark, bg: colors.danger.light },
                  { label: "Tempo elevado (>10d)", value: `${tempoElevado.length}`, color: colors.danger.dark, bg: colors.danger.light },
                  { label: "Finalizados", value: `${todos.filter((p: any) => p.situacao === "Finalizado").length}`, color: colors.success.dark, bg: colors.success.light },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{
                    background: bg, borderRadius: 8, padding: "8px 14px",
                    display: "flex", flexDirection: "column", gap: 2,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Barra de busca + filtros ── */}
      <div style={{ ...base.card, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: showFilters ? 16 : 0 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: colors.gray[400], pointerEvents: "none" }}>
              <IconSearch />
            </div>
            <input
              style={{ ...base.input, paddingLeft: 34, fontSize: 14 }}
              placeholder="Buscar por número do processo ou objeto..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <button
            style={{
              ...base.btnGhost, display: "flex", alignItems: "center", gap: 6, fontSize: 13,
              background: showFilters ? colors.primary[50] : "#fff",
              color: showFilters ? colors.primary[700] : colors.gray[600],
              borderColor: showFilters ? colors.primary[300] : colors.gray[300],
            }}
            onClick={() => setShowFilters(v => !v)}
          >
            <IconFilter /> Filtros
            {hasFilters && (
              <span style={{ background: colors.primary[600], color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 6px", fontWeight: 700 }}>
                {[situacao, modalidade, tipoContratacao, tempoAberto].filter(Boolean).length}
              </span>
            )}
          </button>
          {hasFilters && (
            <button
              style={{ ...base.btnGhost, display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: colors.danger.dark, borderColor: colors.danger.mid }}
              onClick={clearFilters}
            >
              <IconX /> Limpar
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", paddingTop: 16, borderTop: `1px solid ${colors.gray[100]}` }}>
            <FilterSelect label="Situação" value={situacao} onChange={setSituacao}
              options={[
                { value: "", label: "Todas as situações" },
                { value: "Em andamento", label: "Em andamento" },
                { value: "Finalizado", label: "Finalizado" },
                { value: "Cancelado", label: "Cancelado" },
              ]}
            />
            <FilterSelect label="Modalidade" value={modalidade} onChange={setModalidade}
              options={[
                { value: "", label: "Todas as modalidades" },
                { value: "IRP", label: "IRP" },
                { value: "Pregão Tradicional", label: "Pregão Tradicional" },
              ]}
            />
            <FilterSelect label="Tipo de Contratação" value={tipoContratacao} onChange={setTipoContratacao}
              options={[
                { value: "", label: "Todos os tipos" },
                { value: "Material", label: "Material" },
                { value: "Serviço", label: "Serviço" },
                { value: "Material e Serviço", label: "Material e Serviço" },
              ]}
            />
            <FilterSelect label="Tempo em Aberto" value={tempoAberto} onChange={setTempoAberto}
              options={[
                { value: "", label: "Qualquer tempo" },
                { value: "ate5", label: "Até 5 dias (verde)" },
                { value: "6a10", label: "6 a 10 dias (amarelo)" },
                { value: "acima10", label: "Acima de 10 dias (vermelho)" },
              ]}
            />
          </div>
        )}
      </div>

      {/* ── Tabela ── */}
      <div style={{ ...base.card, padding: 0, overflow: "hidden", borderRadius: 14, border: `1px solid ${colors.gray[200]}` }}>
        {isLoading && (
          <div style={{ padding: "60px 24px", textAlign: "center", color: colors.gray[400] }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
            <div style={{ fontSize: 14 }}>Carregando processos...</div>
          </div>
        )}

        {error && (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: colors.danger.dark, fontWeight: 600 }}>Erro ao carregar processos</div>
            <div style={{ fontSize: 12, color: colors.gray[500], marginTop: 4 }}>{(error as any).message}</div>
          </div>
        )}

        {!isLoading && !error && data?.length === 0 && (
          <div style={{ padding: "60px 24px", textAlign: "center", color: colors.gray[400] }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.gray[600], marginBottom: 6 }}>
              {hasFilters ? "Nenhum processo encontrado com esses filtros" : "Nenhum processo cadastrado"}
            </div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>
              {hasFilters ? "Tente ajustar os filtros de busca." : "Comece cadastrando o primeiro processo."}
            </div>
            {!hasFilters && (
              <button style={base.btnPrimary} onClick={() => navigate("/processos/novo")}>
                + Cadastrar Processo
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && data && data.length > 0 && (
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 1300, borderCollapse: "separate", borderSpacing: 0, fontFamily: "Inter, system-ui, sans-serif", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", textRendering: "optimizeLegibility" }}>
            <thead>
              <tr style={{ background: "#eef3f9" }}>
                {[
                  { label: "Processo",    w: "210px" },
                  { label: "Objeto",      w: "280px" },
                  { label: "Situação",    w: "120px" },
                  { label: "Etapa Atual", w: "220px" },
                  { label: "Em Aberto",   w: "140px" },
                  { label: "Total",       w: "100px" },
                  { label: "Análise",     w: "180px" },
                  { label: "Ações",       w: "130px" },
                ].map(h => (
                  <th key={h.label} style={{
                    textAlign: "left", padding: "11px 16px",
                    fontSize: font.size.xs, fontWeight: 600,
                    color: colors.primary[800], textTransform: "uppercase", letterSpacing: 0.4,
                    borderBottom: `1px solid ${colors.gray[200]}`, width: h.w, whiteSpace: "nowrap",
                  }}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data as any[]).map((p: any, i: number) => {
                const rowBg = i % 2 === 0 ? "#fff" : "#f9fbfd";
                const isAcimaDaMedia = p.tempoTotal > tempoMedioGeral;
                const faseCritica = faseCriticaDoProcesso(p.fases ?? []);
                const etapaTextoBruto = String(p.etapaAtual ?? "").trim();
                const etapaNomeLimpo = etapaTextoBruto
                  .replace(/^f\s*\??\s*[A-Za-z0-9_-]*\s*(?:[-:–—]\s*)?/i, "")
                  .trim();
                const etapaNome = etapaNomeLimpo && etapaNomeLimpo !== "—"
                  ? etapaNomeLimpo
                  : "Etapa não definida";

                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/processos/${p.id}`)}
                    style={{ cursor: "pointer", background: rowBg, transition: "background 0.12s ease", borderBottom: `1px solid ${colors.gray[100]}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f2f7ff")}
                    onMouseLeave={e => (e.currentTarget.style.background = rowBg)}
                  >
                    {/* Número */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: colors.primary[700], whiteSpace: "nowrap" }}>
                        {p.numeroProcesso}
                      </div>
                    </td>

                    {/* Objeto */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 400, color: colors.gray[700], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 270 }}>
                        {p.objeto}
                      </div>
                    </td>

                    {/* Situação */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <SituacaoBadge sit={p.situacao} />
                    </td>

                    {/* Etapa atual */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 220 }}>
                        <span title={etapaNome} style={{ fontSize: 12, fontWeight: 600, color: colors.primary[700], lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {etapaNome}
                        </span>
                      </div>
                    </td>

                    {/* Tempo em aberto */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <PriorityBadge days={p.tempoEmAberto} />
                    </td>

                    {/* Tempo total */}
                    <td style={{ padding: "12px 16px", fontSize: 13, color: colors.gray[600], whiteSpace: "nowrap", verticalAlign: "middle" }}>
                      {p.tempoTotal} dias
                    </td>

                    {/* Coluna de análise — NOVA */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {/* Badge: Acima da média */}
                        {isAcimaDaMedia && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 9.5, fontWeight: 700,
                            background: colors.warning.light, color: colors.warning.dark,
                            borderRadius: 6, padding: "2px 7px",
                            textTransform: "uppercase", letterSpacing: 0.4,
                          }}>
                            <IconTrend /> Acima da média
                          </span>
                        )}
                        {/* Fase crítica */}
                        {faseCritica !== "—" && (
                          <div style={{ fontSize: 10.5, color: colors.gray[500], lineHeight: 1.3, maxWidth: 160 }}>
                            <span style={{ fontWeight: 700, color: colors.danger.dark }}>Fase crítica: </span>
                            <span title={faseCritica} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block", maxWidth: 120, verticalAlign: "bottom" }}>
                              {faseCritica}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Ações */}
                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                          title="Editar"
                          style={{ ...base.btnSecondary, padding: "5px 9px", display: "flex", alignItems: "center", gap: 4, fontSize: 11.5 }}
                          onClick={() => navigate(`/processos/${p.id}/editar`)}
                        >
                          <IconEdit /> Editar
                        </button>
                        <button
                          title="Excluir"
                          style={{ ...base.btnDanger, padding: "5px 7px", display: "flex", alignItems: "center" }}
                          onClick={() => handleDelete(p.id, p.numeroProcesso)}
                          disabled={deleteMutation.isPending}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
