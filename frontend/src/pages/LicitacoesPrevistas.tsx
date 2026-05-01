import { CSSProperties, useMemo, useState } from "react";
import { base, colors, font } from "../lib/design";
import { trpc } from "../lib/trpc";

type StatusLicitacao = "Prevista" | "Em andamento" | "Finalizada";
type TipoLicitacao = "Material" | "Serviço";

export default function LicitacoesPrevistas() {
  const utils = trpc.useUtils();
  const { data: licitacoes = [] } = trpc.licitacoes.list.useQuery();
  const [novaLicitacao, setNovaLicitacao] = useState({
    objeto: "",
    tipo: "Material" as TipoLicitacao,
    solicitante: "",
    status: "Prevista" as StatusLicitacao,
  });

  const createLicitacao = trpc.licitacoes.create.useMutation({
    onSuccess: () => {
      setNovaLicitacao({ objeto: "", tipo: "Material", solicitante: "", status: "Prevista" });
      utils.licitacoes.list.invalidate();
    },
  });

  const updateLicitacao = trpc.licitacoes.update.useMutation({
    onSuccess: () => utils.licitacoes.list.invalidate(),
  });

  const deleteLicitacao = trpc.licitacoes.delete.useMutation({
    onSuccess: () => utils.licitacoes.list.invalidate(),
  });

  const possuiLinhaVazia = useMemo(
    () => !novaLicitacao.objeto.trim() || !novaLicitacao.solicitante.trim(),
    [novaLicitacao],
  );

  function adicionarLicitacao() {
    if (possuiLinhaVazia) return;
    createLicitacao.mutate(novaLicitacao);
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

      <div style={{ ...base.card, padding: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Objeto da Licitação</th>
              <th style={thStyle}>Tipo (Material ou Serviço)</th>
              <th style={thStyle}>Solicitante</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {licitacoes.map((linha) => (
              <tr key={linha.id}>
                <td style={tdStyle}>{linha.objeto}</td>
                <td style={tdStyle}>{linha.tipo}</td>
                <td style={tdStyle}>{linha.solicitante}</td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select
                      style={{ ...base.input, cursor: "pointer", minWidth: 140 }}
                      value={linha.status}
                      onChange={(e) =>
                        updateLicitacao.mutate({ id: linha.id, status: e.target.value as StatusLicitacao })
                      }
                    >
                      <option value="Prevista">Prevista</option>
                      <option value="Em andamento">Em andamento</option>
                      <option value="Finalizada">Finalizada</option>
                    </select>
                    <span style={{ ...base.badge, ...statusStyle(linha.status as StatusLicitacao), whiteSpace: "nowrap" }}>
                      {linha.status}
                    </span>
                  </div>
                </td>
                <td style={{ ...tdStyle, width: 130 }}>
                  <button style={base.btnDanger} onClick={() => deleteLicitacao.mutate({ id: linha.id })}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}

            <tr>
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

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "10px 8px",
  fontSize: font.size.xs,
  color: colors.gray[600],
  borderBottom: `1px solid ${colors.gray[200]}`,
};

const tdStyle: CSSProperties = {
  padding: "10px 8px",
  verticalAlign: "top",
  borderBottom: `1px solid ${colors.gray[100]}`,
};

function statusStyle(status: StatusLicitacao): CSSProperties {
  if (status === "Em andamento") return { background: colors.info.light, color: colors.info.dark };
  if (status === "Finalizada") return { background: colors.success.light, color: colors.success.dark };
  return { background: colors.gray[100], color: colors.gray[700] };
}
