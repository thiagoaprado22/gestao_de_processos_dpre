import { CSSProperties, useMemo, useState } from "react";
import { base, colors, font } from "../lib/design";
import { trpc } from "../lib/trpc";

type StatusLicitacao = "Prevista" | "Em andamento" | "Finalizada";
type TipoLicitacao = "Material" | "Serviço";
type MesPrevisto =
  | "Janeiro"
  | "Fevereiro"
  | "Março"
  | "Abril"
  | "Maio"
  | "Junho"
  | "Julho"
  | "Agosto"
  | "Setembro"
  | "Outubro"
  | "Novembro"
  | "Dezembro";

const MESES: MesPrevisto[] = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function LicitacoesPrevistas() {
  const utils = trpc.useUtils();
  const { data: licitacoes = [] } = trpc.licitacoes.list.useQuery();
  const [novaLicitacao, setNovaLicitacao] = useState({
    mesPrevisto: "" as "" | MesPrevisto,
    objeto: "",
    tipo: "Material" as TipoLicitacao,
    solicitante: "",
    status: "Prevista" as StatusLicitacao,
  });
  const [edicaoId, setEdicaoId] = useState<number | null>(null);
  const [licitacaoEmEdicao, setLicitacaoEmEdicao] = useState({
    mesPrevisto: "" as "" | MesPrevisto,
    objeto: "",
    tipo: "Material" as TipoLicitacao,
    solicitante: "",
    status: "Prevista" as StatusLicitacao,
  });

  const createLicitacao = trpc.licitacoes.create.useMutation({
    onSuccess: () => {
      setNovaLicitacao({ mesPrevisto: "", objeto: "", tipo: "Material", solicitante: "", status: "Prevista" });
      utils.licitacoes.list.invalidate();
    },
  });

  const updateLicitacao = trpc.licitacoes.update.useMutation({
    onSuccess: () => utils.licitacoes.list.invalidate(),
  });

  const deleteLicitacao = trpc.licitacoes.delete.useMutation({
    onSuccess: () => utils.licitacoes.list.invalidate(),
  });

  const resumo = useMemo(() => {
    const previstas = licitacoes.filter((item) => item.status === "Prevista").length;
    const andamento = licitacoes.filter((item) => item.status === "Em andamento").length;
    const finalizadas = licitacoes.filter((item) => item.status === "Finalizada").length;
    return { total: licitacoes.length, previstas, andamento, finalizadas };
  }, [licitacoes]);

  const possuiLinhaVazia = useMemo(
    () => !novaLicitacao.objeto.trim() || !novaLicitacao.solicitante.trim(),
    [novaLicitacao],
  );

  function adicionarLicitacao() {
    if (possuiLinhaVazia) return;
    createLicitacao.mutate({ ...novaLicitacao, mesPrevisto: novaLicitacao.mesPrevisto || null });
  }

  const edicaoInvalida = !licitacaoEmEdicao.objeto.trim() || !licitacaoEmEdicao.solicitante.trim();

  function iniciarEdicao(linha: (typeof licitacoes)[number]) {
    setEdicaoId(linha.id);
    setLicitacaoEmEdicao({
      mesPrevisto: (linha.mesPrevisto as MesPrevisto | null) ?? "",
      objeto: linha.objeto,
      tipo: linha.tipo as TipoLicitacao,
      solicitante: linha.solicitante,
      status: linha.status as StatusLicitacao,
    });
  }

  function cancelarEdicao() {
    setEdicaoId(null);
    setLicitacaoEmEdicao({ mesPrevisto: "", objeto: "", tipo: "Material", solicitante: "", status: "Prevista" });
  }

  function salvarEdicao() {
    if (!edicaoId || edicaoInvalida) return;
    updateLicitacao.mutate(
      { id: edicaoId, ...licitacaoEmEdicao, mesPrevisto: licitacaoEmEdicao.mesPrevisto || null },
      { onSuccess: () => cancelarEdicao() },
    );
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: font.size["2xl"], fontWeight: font.weight.bold, color: colors.gray[900], margin: 0 }}>
            Licitações Previstas
          </h1>
          <p style={{ fontSize: font.size.sm, color: colors.gray[500], marginTop: 4 }}>
            Acompanhamento simplificado das licitações (planejamento e execução)
          </p>
        </div>
      </div>

      <div style={resumoGridStyle}>
        <ResumoCard titulo="Total de licitações" valor={resumo.total} />
        <ResumoCard titulo="Previstas" valor={resumo.previstas} />
        <ResumoCard titulo="Em andamento" valor={resumo.andamento} />
        <ResumoCard titulo="Finalizadas" valor={resumo.finalizadas} />
      </div>

      <div style={{ ...base.card, padding: 16 }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={thStyle}>Mês Previsto</th>
              <th style={thStyle}>Objeto da Licitação</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Solicitante</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {licitacoes.map((linha) => {
              const emEdicao = edicaoId === linha.id;
              return (
              <tr key={linha.id}>
                <td style={tdStyle}>
                  {emEdicao ? (
                    <select
                      style={{ ...base.input, cursor: "pointer" }}
                      value={licitacaoEmEdicao.mesPrevisto}
                      onChange={(e) => setLicitacaoEmEdicao((prev) => ({ ...prev, mesPrevisto: e.target.value as "" | MesPrevisto }))}
                    >
                      <option value="">Selecione</option>
                      {MESES.map((mes) => (
                        <option key={mes} value={mes}>
                          {mes}
                        </option>
                      ))}
                    </select>
                  ) : linha.mesPrevisto ? (
                    <span style={{ ...base.badge, background: colors.gray[100], color: colors.gray[700] }}>{linha.mesPrevisto}</span>
                  ) : (
                    <span style={{ color: colors.gray[400] }}>Não definido</span>
                  )}
                </td>
                <td style={tdStyle}>
                  {emEdicao ? (
                    <input
                      style={base.input}
                      value={licitacaoEmEdicao.objeto}
                      onChange={(e) => setLicitacaoEmEdicao((prev) => ({ ...prev, objeto: e.target.value }))}
                    />
                  ) : (
                    linha.objeto
                  )}
                </td>
                <td style={tdStyle}>
                  {emEdicao ? (
                    <select
                      style={{ ...base.input, cursor: "pointer" }}
                      value={licitacaoEmEdicao.tipo}
                      onChange={(e) => setLicitacaoEmEdicao((prev) => ({ ...prev, tipo: e.target.value as TipoLicitacao }))}
                    >
                      <option value="Material">Material</option>
                      <option value="Serviço">Serviço</option>
                    </select>
                  ) : (
                    linha.tipo
                  )}
                </td>
                <td style={tdStyle}>
                  {emEdicao ? (
                    <input
                      style={base.input}
                      value={licitacaoEmEdicao.solicitante}
                      onChange={(e) => setLicitacaoEmEdicao((prev) => ({ ...prev, solicitante: e.target.value }))}
                    />
                  ) : (
                    linha.solicitante
                  )}
                </td>
                <td style={tdStyle}>
                  {emEdicao ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <select
                        style={{ ...base.input, cursor: "pointer", minWidth: 140 }}
                        value={licitacaoEmEdicao.status}
                        onChange={(e) => setLicitacaoEmEdicao((prev) => ({ ...prev, status: e.target.value as StatusLicitacao }))}
                      >
                        <option value="Prevista">Prevista</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Finalizada">Finalizada</option>
                      </select>
                      <span style={{ ...base.badge, ...statusStyle(licitacaoEmEdicao.status), whiteSpace: "nowrap" }}>
                        {licitacaoEmEdicao.status}
                      </span>
                    </div>
                  ) : (
                    <span style={{ ...base.badge, ...statusStyle(linha.status as StatusLicitacao), whiteSpace: "nowrap" }}>
                      {linha.status}
                    </span>
                  )}
                </td>
                <td style={{ ...tdStyle, width: 220 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {emEdicao ? (
                      <>
                        <button
                          style={{ ...base.btnPrimary, cursor: edicaoInvalida ? "not-allowed" : "pointer", opacity: edicaoInvalida ? 0.6 : 1 }}
                          disabled={edicaoInvalida || updateLicitacao.isPending}
                          onClick={salvarEdicao}
                        >
                          Salvar
                        </button>
                        <button style={base.btnGhost} onClick={cancelarEdicao}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button style={base.btnGhost} onClick={() => iniciarEdicao(linha)}>
                        Editar
                      </button>
                    )}
                    <button style={base.btnDanger} onClick={() => deleteLicitacao.mutate({ id: linha.id })}>
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            )})}

            <tr>
              <td style={tdStyle}>
                <select
                  style={{ ...base.input, cursor: "pointer" }}
                  value={novaLicitacao.mesPrevisto}
                  onChange={(e) => setNovaLicitacao((prev) => ({ ...prev, mesPrevisto: e.target.value as "" | MesPrevisto }))}
                >
                  <option value="">Selecione</option>
                  {MESES.map((mes) => (
                    <option key={mes} value={mes}>
                      {mes}
                    </option>
                  ))}
                </select>
              </td>
              <td style={tdStyle}>
                <input
                  style={base.input}
                  value={novaLicitacao.objeto}
                  onChange={(e) => setNovaLicitacao((prev) => ({ ...prev, objeto: e.target.value }))}
                  placeholder="Ex.: Aquisição de equipamentos"
                />
              </td>
              <td style={tdStyle}>
                <select
                  style={{ ...base.input, cursor: "pointer" }}
                  value={novaLicitacao.tipo}
                  onChange={(e) => setNovaLicitacao((prev) => ({ ...prev, tipo: e.target.value as TipoLicitacao }))}
                >
                  <option value="Material">Material</option>
                  <option value="Serviço">Serviço</option>
                </select>
              </td>
              <td style={tdStyle}>
                <input
                  style={base.input}
                  value={novaLicitacao.solicitante}
                  onChange={(e) => setNovaLicitacao((prev) => ({ ...prev, solicitante: e.target.value }))}
                  placeholder="Ex.: Departamento solicitante"
                />
              </td>
              <td style={tdStyle}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    style={{ ...base.input, cursor: "pointer", minWidth: 140 }}
                    value={novaLicitacao.status}
                    onChange={(e) => setNovaLicitacao((prev) => ({ ...prev, status: e.target.value as StatusLicitacao }))}
                  >
                    <option value="Prevista">Prevista</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Finalizada">Finalizada</option>
                  </select>
                  <span style={{ ...base.badge, ...statusStyle(novaLicitacao.status), whiteSpace: "nowrap" }}>
                    {novaLicitacao.status}
                  </span>
                </div>
              </td>
              <td style={tdStyle}>
                <button
                  style={{ ...base.btnPrimary, cursor: possuiLinhaVazia ? "not-allowed" : "pointer", opacity: possuiLinhaVazia ? 0.6 : 1 }}
                  disabled={possuiLinhaVazia || createLicitacao.isPending}
                  onClick={adicionarLicitacao}
                >
                  Adicionar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResumoCard({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div style={{ ...base.card, padding: 14 }}>
      <div style={{ color: colors.gray[600], fontSize: font.size.xs, marginBottom: 4 }}>{titulo}</div>
      <div style={{ color: colors.gray[900], fontSize: font.size.xl, fontWeight: font.weight.bold }}>{valor}</div>
    </div>
  );
}

const resumoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 12,
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  fontSize: font.size.xs,
  color: colors.gray[700],
  background: colors.gray[50],
  borderBottom: `1px solid ${colors.gray[200]}`,
};

const tdStyle: CSSProperties = {
  padding: "12px 10px",
  verticalAlign: "top",
  borderBottom: `1px solid ${colors.gray[100]}`,
};

function statusStyle(status: StatusLicitacao): CSSProperties {
  if (status === "Em andamento") return { background: colors.info.light, color: colors.info.dark };
  if (status === "Finalizada") return { background: colors.success.light, color: colors.success.dark };
  return { background: colors.gray[200], color: colors.gray[700] };
}
