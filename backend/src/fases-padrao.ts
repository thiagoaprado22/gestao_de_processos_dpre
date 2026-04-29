/**
 * FASES PADRÃO DO PROCESSO DE PRÉ-COMPRAS
 *
 * Para alterar fases padrão, edite apenas este arquivo.
 * Cada novo processo criado receberá automaticamente estas fases.
 * Alterações aqui NÃO afetam processos já existentes no banco.
 */
export const FASES_PADRAO = [
  {
    ordem: 1,
    nome: "Recebido → Lançamento no SIASG",
    observacao: "Recebimento via despacho SEI",
  },
  {
    ordem: 2,
    nome: "Lançamento no SIASG → Divulgação da IRP",
    observacao: "Elaboração de ofício, prazos legais, análise da IRP",
  },
  {
    ordem: 3,
    nome: "Divulgação da IRP → Compilados da Documentação",
    observacao: "Envio da documentação pertinente pelo participante via SEI",
  },
  {
    ordem: 4,
    nome: "Compilados da Documentação → Envio ao Div. de Planejamento",
    observacao: "Envio dos Formulários de Participação e Valor total estimado da Licitação",
  },
  {
    ordem: 5,
    nome: "Div. Planejamento → Elaboração do TR, ETP, MP",
    observacao: "",
  },
  {
    ordem: 6,
    nome: "TR, ETP, MP pelo DPL → Elaboração dos Autos do Processo",
    observacao: "Elaboração de formulários, justificativas, adição de portarias, minuta do edital",
  },
  {
    ordem: 7,
    nome: "Autos do Processo → Solicitação de Nota Técnica",
    observacao: "Coleta de assinaturas",
  },
  {
    ordem: 8,
    nome: "Recebimento de Nota Técnica → Atendimento Solicitante",
    observacao: "",
  },
  {
    ordem: 9,
    nome: "Recebimento de Nota Técnica → Atendimento DPRE",
    observacao: "",
  },
  {
    ordem: 10,
    nome: "Ajuste nos Autos do Processo → Envio para Procuradoria Jurídica",
    observacao: "",
  },
  {
    ordem: 11,
    nome: "Recebimento do Parecer da PJ → Atendimento Solicitante",
    observacao: "",
  },
  {
    ordem: 12,
    nome: "Recebimento do Parecer da PJ → Atendimento DPRE",
    observacao: "",
  },
  {
    ordem: 13,
    nome: "Ajuste nos Autos do Processo → Publicação dos Autos",
    observacao: "",
  },
  {
    ordem: 14,
    nome: "Publicação → Despacho para o Setor de Pregão",
    observacao: "",
  },
];
