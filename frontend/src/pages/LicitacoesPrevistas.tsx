import { CSSProperties, useState } from "react";
import { base, colors, font } from "../lib/design";

type Licitacao = {
  objeto: string;
  tipo: "Material" | "Serviço";
  solicitante: string;
};

export default function LicitacoesPrevistas() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([
    { objeto: "", tipo: "Material", solicitante: "" },
  ]);

  function adicionarLinha() {
    setLicitacoes((prev) => [...prev, { objeto: "", tipo: "Material", solicitante: "" }]);
  }

  function removerLinha(index: number) {
    setLicitacoes((prev) => prev.filter((_, i) => i !== index));
  }

  function atualizarLinha(index: number, campo: keyof Licitacao, valor: string) {
    setLicitacoes((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [campo]: valor } : item,
      ),
    );
  }

  const possuiLinhaVazia = licitacoes.some(
    (linha) => !linha.objeto.trim() || !linha.solicitante.trim(),
  );

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: font.size["2xl"], fontWeight: font.weight.bold, color: colors.gray[900], margin: 0 }}>
            Licitações Previstas 2026
          </h1>
          <p style={{ fontSize: font.size.sm, color: colors.gray[500], marginTop: 4 }}>
            Planejamento anual de contratações
          </p>
        </div>
        <button style={base.btnPrimary} onClick={adicionarLinha}>
          Nova Licitação
        </button>
      </div>

      <div style={{ ...base.card, padding: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Objeto da Licitação</th>
              <th style={thStyle}>Tipo (Material ou Serviço)</th>
              <th style={thStyle}>Solicitante</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {licitacoes.map((linha, index) => (
              <tr key={index}>
                <td style={tdStyle}>
                  <input
                    style={base.input}
                    value={linha.objeto}
                    onChange={(e) => atualizarLinha(index, "objeto", e.target.value)}
                    placeholder="Ex.: Aquisição de equipamentos"
                  />
                </td>
                <td style={tdStyle}>
                  <select
                    style={{ ...base.input, cursor: "pointer" }}
                    value={linha.tipo}
                    onChange={(e) => atualizarLinha(index, "tipo", e.target.value)}
                  >
                    <option value="Material">Material</option>
                    <option value="Serviço">Serviço</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <input
                    style={base.input}
                    value={linha.solicitante}
                    onChange={(e) => atualizarLinha(index, "solicitante", e.target.value)}
                    placeholder="Ex.: Departamento solicitante"
                  />
                </td>
                <td style={{ ...tdStyle, width: 130 }}>
                  <button
                    style={base.btnDanger}
                    onClick={() => removerLinha(index)}
                    disabled={licitacoes.length === 1}
                    title={licitacoes.length === 1 ? "Mantenha ao menos uma linha" : "Remover linha"}
                  >
                    Remover linha
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {possuiLinhaVazia && (
          <p style={{ color: colors.warning.dark, fontSize: font.size.xs, margin: "10px 0 0" }}>
            Preencha objeto e solicitante para evitar linhas vazias.
          </p>
        )}
      </div>

      <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
        <button style={{ ...base.btnGhost, cursor: possuiLinhaVazia ? "not-allowed" : "pointer", opacity: possuiLinhaVazia ? 0.6 : 1 }} disabled={possuiLinhaVazia}>
          Adicionar
        </button>
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
