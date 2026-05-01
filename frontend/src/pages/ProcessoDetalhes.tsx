import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { colors, font, base, shadows, priorityStyle, situacaoStyle } from "../lib/design";

function toIsoDate(value: string | null | undefined): string | null {
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

function formatDateBrSafe(value: string | null | undefined): string {
  const iso = toIsoDate(value);
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

// ─── Ícones ──────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconCheckCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconSave = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IconAlertCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ─── Componente de fase na linha do tempo ─────────────────────

interface FaseItemProps {
  fase: any;
  index: number;
  total: number;
  onSave: (faseId: number, dataInicio: string | null, dataFim: string | null, naoSeAplica?: boolean) => void;
  isSaving: boolean;
  savedId: number | null;
}

function FaseItem({ fase, index, total, onSave, isSaving, savedId }: FaseItemProps) {
  const [editing, setEditing] = useState(false);
  const [dataInicio, setDataInicio] = useState(toIsoDate(fase.dataInicio) ?? "");
  const [dataFim, setDataFim] = useState(toIsoDate(fase.dataFim) ?? "");

  const isNa = fase.ignorada || fase.status === "Não se aplica";
  const isCompleted = !!fase.dataFim && !isNa;
  const isActive = !!fase.dataInicio && !fase.dataFim && !isNa;
  const justSaved = savedId === fase.id;

  // Cores do nó
  let dotBg = colors.gray[200];
  let dotBorder = colors.gray[300];
  let cardBorder = colors.gray[200];
  let cardBg = "#fff";
  let statusLabel = "Pendente";
  let statusColor = colors.gray[400];

  if (isNa) {
    dotBg = colors.gray[100];
    dotBorder = colors.gray[300];
    cardBorder = colors.gray[200];
    cardBg = colors.gray[50];
    statusLabel = "Não se aplica";
    statusColor = colors.gray[500];
  } else if (isCompleted) {
    dotBg = colors.success.mid;
    dotBorder = colors.success.mid;
    cardBorder = `${colors.success.mid}60`;
    statusLabel = "Concluída";
    statusColor = colors.success.dark;
  } else if (isActive) {
    dotBg = colors.primary[600];
    dotBorder = colors.primary[600];
    cardBg = colors.primary[50];
    cardBorder = colors.primary[300];
    statusLabel = "Em andamento";
    statusColor = colors.primary[700];
  }

  function handleSave() {
    onSave(fase.id, toIsoDate(dataInicio), toIsoDate(dataFim));
    setEditing(false);
  }

  function handleToggleNaoSeAplica(checked: boolean) {
    onSave(fase.id, toIsoDate(fase.dataInicio), toIsoDate(fase.dataFim), checked);
    setEditing(false);
  }

  function handleCancel() {
    setDataInicio(toIsoDate(fase.dataInicio) ?? "");
    setDataFim(toIsoDate(fase.dataFim) ?? "");
    setEditing(false);
  }

  return (
    <div style={{ display: "flex", gap: 0 }}>
      {/* Linha do tempo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 36, flexShrink: 0 }}>
        <div style={{
          width: 2, height: 16,
          background: index === 0 ? "transparent" : (isCompleted ? colors.success.mid : colors.gray[200]),
        }} />
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: dotBg, border: `2px solid ${dotBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0, zIndex: 1,
          boxShadow: isActive ? `0 0 0 4px ${colors.primary[100]}` : "none",
          transition: "all 0.2s",
        }}>
          {isCompleted
            ? <IconCheckCircle />
            : <span style={{ color: isActive ? "#fff" : colors.gray[500] }}>{index + 1}</span>
          }
        </div>
        <div style={{
          width: 2, flex: 1, minHeight: 16,
          background: index === total - 1 ? "transparent" : (isCompleted ? colors.success.mid : colors.gray[200]),
        }} />
      </div>

      {/* Card */}
      <div style={{
        flex: 1, marginLeft: 10, marginBottom: 6, marginTop: 6,
        border: `1px solid ${cardBorder}`,
        borderRadius: 10, background: cardBg,
        overflow: "hidden", transition: "all 0.15s",
      }}>
        {/* Cabeçalho */}
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
                color: statusColor,
              }}>
                {statusLabel}
              </span>
              {isActive && (
                <span style={{
                  fontSize: 10, background: colors.primary[600], color: "#fff",
                  borderRadius: 10, padding: "1px 7px", fontWeight: 700,
                }}>ATUAL</span>
              )}
              {justSaved && (
                <span style={{
                  fontSize: 10, background: colors.success.light, color: colors.success.dark,
                  borderRadius: 10, padding: "1px 7px", fontWeight: 700,
                }}>✓ Salvo</span>
              )}
            </div>

            <div style={{
              fontSize: 13, fontWeight: font.weight.semibold,
              color: isNa ? colors.gray[500] : (isCompleted || isActive ? colors.gray[800] : colors.gray[500]),
              lineHeight: 1.4,
            }}>
              {fase.nome}
            </div>

            {/* Datas e duração */}
            {(fase.dataInicio || fase.dataFim) && (
              <div style={{ display: "flex", gap: 14, marginTop: 7, flexWrap: "wrap" }}>
                {fase.dataInicio && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: colors.gray[500] }}>
                    <IconCalendar />
                    Início: <strong style={{ color: colors.gray[700] }}>
                      {formatDateBrSafe(fase.dataInicio)}
                    </strong>
                  </div>
                )}
                {fase.dataFim && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: colors.gray[500] }}>
                    <IconCalendar />
                    Fim: <strong style={{ color: colors.gray[700] }}>
                      {formatDateBrSafe(fase.dataFim)}
                    </strong>
                  </div>
                )}
                {fase.tempoDias != null && fase.tempoDias > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: colors.gray[500] }}>
                    <IconClock />
                    Duração: <strong style={{ color: colors.gray[700] }}>{fase.tempoDias} dias</strong>
                  </div>
                )}
              </div>
            )}

            {/* Observação */}
            {fase.observacao && !editing && (
              <div style={{
                marginTop: 8, fontSize: 12, color: colors.gray[500],
                fontStyle: "italic", lineHeight: 1.5,
                padding: "6px 10px",
                background: isActive ? "rgba(255,255,255,0.6)" : colors.gray[50],
                borderRadius: 6,
                borderLeft: `3px solid ${colors.gray[200]}`,
              }}>
                {fase.observacao}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: colors.gray[500], cursor: "pointer" }}>
              <input type="checkbox" checked={isNa} onChange={e => handleToggleNaoSeAplica(e.target.checked)} />
              Não se aplica
            </label>
          {!isNa && (<button
            style={{
              ...base.btnGhost,
              padding: "5px 10px", fontSize: 12,
              display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
            }}
            onClick={() => setEditing(v => !v)}
          >
            <IconEdit /> {editing ? "Fechar" : "Editar"}
          </button>)}
          </div>
        </div>

        {/* Formulário inline */}
        {editing && !isNa && (
          <div style={{
            padding: 16, borderTop: `1px solid ${colors.gray[100]}`,
            background: colors.gray[50],
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", marginBottom: 12 }}>
              <div>
                <label style={{ ...base.label, marginBottom: 4 }}>Data de Início</label>
                <input
                  type="date"
                  style={{ ...base.input, fontSize: 13 }}
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <label style={{ ...base.label, marginBottom: 4 }}>Data de Conclusão</label>
                <input
                  type="date"
                  style={{ ...base.input, fontSize: 13 }}
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                style={{ ...base.btnGhost, fontSize: 12, padding: "6px 14px" }}
                onClick={handleCancel}
              >
                Cancelar
              </button>
              <button
                style={{
                  ...base.btnPrimary, fontSize: 12, padding: "6px 14px",
                  display: "flex", alignItems: "center", gap: 6,
                  opacity: isSaving ? 0.7 : 1,
                }}
                onClick={handleSave}
                disabled={isSaving}
              >
                <IconSave /> Salvar Fase
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────

export default function ProcessoDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [savingFase, setSavingFase] = useState<number | null>(null);
  const [savedFase, setSavedFase] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data, isLoading, error, refetch } = trpc.processos.getById.useQuery({ id: Number(id) });

  const updateFaseMutation = trpc.processos.updateFase.useMutation({
    onSuccess: (_: any, vars: any) => {
      setSavingFase(null);
      setSavedFase(vars.id ?? vars.faseId);
      setTimeout(() => setSavedFase(null), 2500);
      refetch();
      showToast("success", "Fase atualizada com sucesso!");
    },
    onError: (_err: any) => {
      setSavingFase(null);
      showToast("error", "Não foi possível atualizar a fase. Tente novamente.");
    },
  });

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  function handleSaveFase(faseId: number, dataInicio: string | null, dataFim: string | null, naoSeAplica?: boolean) {
    setSavingFase(faseId);
    updateFaseMutation.mutate({ id: faseId, dataInicio, dataFim, naoSeAplica });
  }

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: colors.gray[400] }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
        Carregando processo...
      </div>
    </div>
  );

  if (error || !data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ ...base.card, padding: "24px 32px", textAlign: "center", borderTop: `3px solid ${colors.danger.mid}` }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
        <div style={{ color: colors.danger.dark, fontWeight: 600 }}>Processo não encontrado</div>
        <button style={{ ...base.btnPrimary, marginTop: 16 }} onClick={() => navigate("/processos")}>
          Voltar para a lista
        </button>
      </div>
    </div>
  );

  const fases = (data.fases ?? []) as any[];
  const fasesAplicaveis = fases.filter((f: any) => !(f.ignorada || f.status === "Não se aplica"));
  const fasesCompletas = fasesAplicaveis.filter((f: any) => !!f.dataFim).length;
  const progresso = fasesAplicaveis.length > 0 ? Math.round((fasesCompletas / fasesAplicaveis.length) * 100) : 0;

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 1000,
          background: toast.type === "success" ? colors.success.light : colors.danger.light,
          color: toast.type === "success" ? colors.success.dark : colors.danger.dark,
          border: `1px solid ${toast.type === "success" ? colors.success.mid : colors.danger.mid}`,
          borderRadius: 10, padding: "12px 18px",
          boxShadow: shadows.lg,
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 13, fontWeight: font.weight.medium,
        }}>
          {toast.type === "success" ? <IconCheckCircle /> : <IconAlertCircle />}
          {toast.msg}
        </div>
      )}

      {/* ── Cabeçalho ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button
          style={{ ...base.btnGhost, display: "flex", alignItems: "center", gap: 6, padding: "8px 12px" }}
          onClick={() => navigate("/processos")}
        >
          <IconArrowLeft />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: font.size["2xl"], fontWeight: font.weight.bold, color: colors.gray[900], margin: 0 }}>
              {data.numeroProcesso}
            </h1>
            <span style={{ ...base.badge, ...situacaoStyle(data.situacao) }}>{data.situacao}</span>
          </div>
          <p style={{ fontSize: 13, color: colors.gray[500], marginTop: 3, lineHeight: 1.4 }}>
            {data.objeto}
          </p>
        </div>
        <button
          style={{ ...base.btnSecondary, display: "flex", alignItems: "center", gap: 6 }}
          onClick={() => navigate(`/processos/${id}/editar`)}
        >
          <IconEdit /> Editar
        </button>
      </div>

      <p style={{ fontSize: 13, color: colors.gray[500], marginTop: -8, marginBottom: 16, lineHeight: 1.4 }}>
        Os indicadores apresentados referem-se exclusivamente às etapas do processo sob responsabilidade do DPRE, não abrangendo o fluxo completo da contratação.
      </p>

      {/* ── Cards de resumo ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
        {/* Etapa atual */}
        <div style={{ ...base.card, padding: "16px 20px", borderTop: `3px solid ${colors.primary[600]}`, gridColumn: "span 2" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: colors.gray[400], textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
            Etapa Atual
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.gray[800], lineHeight: 1.4 }}>
            {data.etapaAtual}
          </div>
        </div>

        {/* Tempo em aberto */}
        <div style={{
          ...base.card, padding: "16px 20px",
          borderTop: `3px solid ${data.tempoEmAberto <= 5 ? colors.success.mid : data.tempoEmAberto <= 10 ? colors.warning.mid : colors.danger.mid}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: colors.gray[400], textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
            Tempo em Aberto (DPRE)
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{
              fontSize: 30, fontWeight: 700,
              color: data.tempoEmAberto <= 5 ? colors.success.dark : data.tempoEmAberto <= 10 ? colors.warning.dark : colors.danger.dark,
            }}>
              {data.tempoEmAberto}
            </span>
            <span style={{ fontSize: 12, color: colors.gray[400] }}>dias</span>
          </div>
          {data.tempoEmAberto > 10 && (
            <div style={{ fontSize: 10, fontWeight: 700, color: colors.danger.dark, marginTop: 4, textTransform: "uppercase" }}>
              ⚠ Tempo elevado
            </div>
          )}
        </div>

        {/* Tempo total */}
        <div style={{ ...base.card, padding: "16px 20px", borderTop: `3px solid ${colors.info.mid}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: colors.gray[400], textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
            Tempo Total (DPRE)
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: colors.info.dark }}>{data.tempoTotal}</span>
            <span style={{ fontSize: 12, color: colors.gray[400] }}>dias</span>
          </div>
        </div>

        {/* Progresso */}
        <div style={{ ...base.card, padding: "16px 20px", borderTop: `3px solid ${colors.success.mid}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: colors.gray[400], textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
            Progresso (DPRE)
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: colors.success.dark }}>{progresso}%</span>
          </div>
          <div style={{ background: colors.gray[200], borderRadius: 4, height: 5, overflow: "hidden" }}>
            <div style={{
              width: `${progresso}%`, height: "100%",
              background: `linear-gradient(90deg, ${colors.success.mid}, ${colors.primary[600]})`,
              borderRadius: 4, transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ fontSize: 11, color: colors.gray[400], marginTop: 4 }}>
            {fasesCompletas}/{fasesAplicaveis.length} fases
          </div>
        </div>
      </div>

      {/* ── Dados do processo ── */}
      <div style={{ ...base.card, padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", background: colors.gray[50], borderBottom: `1px solid ${colors.gray[200]}` }}>
          <div style={{ fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.gray[800] }}>
            Dados do Processo
          </div>
        </div>
        <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px 24px" }}>
          {[
            { label: "Modalidade", value: data.modalidade },
            { label: "Tipo de Contratação", value: data.tipoContratacao },
            { label: "Parecer Referencial", value: data.parecerReferencial },
            { label: "Quantidade de Itens", value: String(data.quantidadeItens ?? "—") },
            { label: "Número da IRP", value: data.numeroIrp || "—" },
            { label: "Número do Pregão", value: data.numeroPregao || "—" },
            {
              label: "Valor Estimado",
              value: data.valorEstimado && parseFloat(data.valorEstimado) > 0
                ? `R$ ${parseFloat(data.valorEstimado).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                : "—"
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray[400], textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontSize: 14, color: colors.gray[700], fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
        {data.observacoes && (
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray[400], textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Observações
            </div>
            <div style={{
              fontSize: 13, color: colors.gray[600], lineHeight: 1.6,
              padding: "10px 14px", background: colors.gray[50],
              borderRadius: 6, borderLeft: `3px solid ${colors.gray[300]}`,
            }}>
              {data.observacoes}
            </div>
          </div>
        )}
      </div>

      {/* ── Linha do tempo de fases ── */}
      <div style={{ ...base.card, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", background: colors.gray[50], borderBottom: `1px solid ${colors.gray[200]}` }}>
          <div style={{ fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.gray[800] }}>
            Linha do Tempo — Fases do Processo
          </div>
          <div style={{ fontSize: 12, color: colors.gray[400], marginTop: 2 }}>
            {fases.length} fases · Clique em "Editar" para registrar datas de início e conclusão
          </div>
        </div>
        <div style={{ padding: "16px 20px 8px" }}>
          {fases.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: colors.gray[400] }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <div>Nenhuma fase encontrada para este processo.</div>
            </div>
          ) : (
            fases.map((fase: any, i: number) => (
              <FaseItem
                key={fase.id}
                fase={fase}
                index={i}
                total={fases.length}
                onSave={handleSaveFase}
                isSaving={savingFase === fase.id}
                savedId={savedFase}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
