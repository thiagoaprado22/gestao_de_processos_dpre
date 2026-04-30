import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { colors, font, base, shadows } from "../lib/design";

// ─── Ícones ──────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconSave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconAlertCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ─── Componentes de campo ─────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, required, error, hint, children }: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{
        fontSize: font.size.sm,
        fontWeight: font.weight.semibold,
        color: error ? colors.danger.dark : colors.gray[700],
      }}>
        {label}
        {required && <span style={{ color: colors.danger.mid, marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && !error && (
        <span style={{ fontSize: 11, color: colors.gray[400] }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontSize: 11, color: colors.danger.dark, display: "flex", alignItems: "center", gap: 4 }}>
          <IconAlertCircle /> {error}
        </span>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
}

function Section({ title, subtitle, icon, children }: SectionProps) {
  return (
    <div style={{ ...base.card, padding: 0, overflow: "hidden", marginBottom: 20 }}>
      <div style={{
        padding: "16px 24px",
        background: colors.gray[50],
        borderBottom: `1px solid ${colors.gray[200]}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <div>
          <div style={{ fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.gray[800] }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: font.size.xs, color: colors.gray[500], marginTop: 1 }}>{subtitle}</div>
          )}
        </div>
      </div>
      <div style={{ padding: 24 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Tipos ────────────────────────────────────────────────────

interface FormData {
  numeroProcesso: string;
  objeto: string;
  modalidade: string;
  tipoContratacao: string;
  parecerReferencial: string;
  divulgado: string;
  quantidadeItens: string;
  numeroIrp: string;
  numeroPregao: string;
  valorEstimado: string;
  situacao: string;
  observacoes: string;
}

const initialForm: FormData = {
  numeroProcesso: "",
  objeto: "",
  modalidade: "IRP",
  tipoContratacao: "Material",
  parecerReferencial: "Não",
  divulgado: "Não",
  quantidadeItens: "0",
  numeroIrp: "",
  numeroPregao: "",
  valorEstimado: "0",
  situacao: "Em andamento",
  observacoes: "",
};

// ─── Página principal ─────────────────────────────────────────

export default function ProcessoForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: processo, isLoading } = trpc.processos.getById.useQuery(
    { id: Number(id) },
    { enabled: isEdit }
  );

  useEffect(() => {
    if (processo && isEdit) {
      setForm({
        numeroProcesso: processo.numeroProcesso,
        objeto: processo.objeto,
        modalidade: processo.modalidade,
        tipoContratacao: processo.tipoContratacao,
        parecerReferencial: processo.parecerReferencial,
        divulgado: processo.divulgado ?? "Não",
        quantidadeItens: String(processo.quantidadeItens ?? 0),
        numeroIrp: processo.numeroIrp ?? "",
        numeroPregao: processo.numeroPregao ?? "",
        valorEstimado: processo.valorEstimado ?? "0",
        situacao: processo.situacao,
        observacoes: processo.observacoes ?? "",
      });
    }
  }, [processo, isEdit]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const createMutation = trpc.processos.create.useMutation({
    onSuccess: (data: any) => {
      showToast("success", "Processo cadastrado com sucesso!");
      setTimeout(() => navigate(`/processos/${data.id}`), 1400);
    },
    onError: (_err: any) => showToast("error", "Não foi possível salvar o processo. Tente novamente."),
  });

  const updateMutation = trpc.processos.update.useMutation({
    onSuccess: () => {
      showToast("success", "Processo atualizado com sucesso!");
      setTimeout(() => navigate(`/processos/${id}`), 1400);
    },
    onError: (_err: any) => showToast("error", "Não foi possível salvar o processo. Tente novamente."),
  });

  function validate(): boolean {
    const errs: Partial<FormData> = {};
    if (!form.numeroProcesso.trim()) errs.numeroProcesso = "Campo obrigatório";
    if (!form.objeto.trim()) errs.objeto = "Campo obrigatório";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const payload = { ...form, quantidadeItens: parseInt(form.quantidadeItens) || 0 };
    if (isEdit) updateMutation.mutate({ id: Number(id), ...payload });
    else createMutation.mutate(payload);
  }

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  if (isEdit && isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: colors.gray[400] }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
        Carregando processo...
      </div>
    </div>
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    ...base.input,
    borderColor: hasError ? colors.danger.mid : colors.gray[300],
    boxShadow: hasError ? `0 0 0 3px ${colors.danger.light}` : "none",
  });

  const selectStyle: React.CSSProperties = {
    ...base.input,
    cursor: "pointer",
    appearance: "auto",
  };

  return (
    <div style={{ maxWidth: 860, position: "relative" }}>
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 1000,
          background: toast.type === "success" ? colors.success.light : colors.danger.light,
          color: toast.type === "success" ? colors.success.dark : colors.danger.dark,
          border: `1px solid ${toast.type === "success" ? colors.success.mid : colors.danger.mid}`,
          borderRadius: 10, padding: "14px 20px",
          boxShadow: shadows.lg,
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 14, fontWeight: font.weight.medium,
          animation: "slideIn 0.2s ease",
          maxWidth: 360,
        }}>
          {toast.type === "success" ? <IconCheck /> : <IconAlertCircle />}
          {toast.msg}
        </div>
      )}

      {/* ── Cabeçalho ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <button
          style={{ ...base.btnGhost, display: "flex", alignItems: "center", gap: 6, padding: "8px 12px" }}
          onClick={() => navigate(-1)}
        >
          <IconArrowLeft />
        </button>
        <div>
          <h1 style={{ fontSize: font.size["2xl"], fontWeight: font.weight.bold, color: colors.gray[900], margin: 0 }}>
            {isEdit ? "Editar Processo" : "Novo Processo"}
          </h1>
          <p style={{ fontSize: font.size.sm, color: colors.gray[500], marginTop: 3 }}>
            {isEdit
              ? "Atualize os dados do processo abaixo"
              : "Preencha os dados para cadastrar um novo processo. As 14 fases serão criadas automaticamente."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Seção 1: Identificação ── */}
        <Section title="Identificação do Processo" subtitle="Dados principais de identificação" icon="📄">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Número do Processo SEI" required error={errors.numeroProcesso} hint="Formato: 23072.012345/2024-01">
                <input
                  style={inputStyle(!!errors.numeroProcesso)}
                  value={form.numeroProcesso}
                  onChange={e => set("numeroProcesso", e.target.value)}
                  placeholder="Ex: 23072.012345/2024-01"
                />
              </Field>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Objeto" required error={errors.objeto} hint="Descreva o objeto da licitação com clareza">
                <textarea
                  style={{
                    ...inputStyle(!!errors.objeto),
                    resize: "vertical",
                    minHeight: 90,
                    fontFamily: font.family,
                  }}
                  value={form.objeto}
                  onChange={e => set("objeto", e.target.value)}
                  placeholder="Descreva o objeto da licitação..."
                />
              </Field>
            </div>

            <Field label="Situação">
              <select style={selectStyle} value={form.situacao} onChange={e => set("situacao", e.target.value)}>
                <option>Em andamento</option>
                <option>Finalizado</option>
                <option>Cancelado</option>
              </select>
            </Field>

            <Field label="Parecer Referencial">
              <select style={selectStyle} value={form.parecerReferencial} onChange={e => set("parecerReferencial", e.target.value)}>
                <option>Não</option>
                <option>Sim</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* ── Seção 2: Classificação ── */}
        <Section title="Classificação" subtitle="Modalidade, tipo e quantidades" icon="🏷️">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <Field label="Modalidade">
              <select style={selectStyle} value={form.modalidade} onChange={e => set("modalidade", e.target.value)}>
                <option>IRP</option>
                <option>Pregão Tradicional</option>
              </select>
            </Field>

            <Field label="Divulgado">
              <select style={selectStyle} value={form.divulgado} onChange={e => set("divulgado", e.target.value)}>
                <option>Não</option>
                <option>Sim</option>
              </select>
            </Field>

            <Field label="Tipo de Contratação">
              <select style={selectStyle} value={form.tipoContratacao} onChange={e => set("tipoContratacao", e.target.value)}>
                <option>Material</option>
                <option>Serviço</option>
                <option>Material e Serviço</option>
              </select>
            </Field>

            <Field label="Quantidade de Itens">
              <input
                style={inputStyle()}
                type="number"
                min="0"
                value={form.quantidadeItens}
                onChange={e => set("quantidadeItens", e.target.value)}
              />
            </Field>

            <Field label="Valor Estimado (R$)">
              <input
                style={inputStyle()}
                type="number"
                min="0"
                step="0.01"
                value={form.valorEstimado}
                onChange={e => set("valorEstimado", e.target.value)}
                placeholder="0,00"
              />
            </Field>
          </div>
        </Section>

        {/* ── Seção 3: Referências ── */}
        <Section title="Referências" subtitle="Números de IRP e Pregão" icon="🔗">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <Field label="Número da IRP" hint="Deixe em branco se não aplicável">
              <input
                style={inputStyle()}
                value={form.numeroIrp}
                onChange={e => set("numeroIrp", e.target.value)}
                placeholder="Ex: IRP 001/2024"
              />
            </Field>

            <Field label="Número do Pregão" hint="Deixe em branco se não aplicável">
              <input
                style={inputStyle()}
                value={form.numeroPregao}
                onChange={e => set("numeroPregao", e.target.value)}
                placeholder="Ex: PE 001/2024"
              />
            </Field>
          </div>
        </Section>

        {/* ── Seção 4: Observações ── */}
        <Section title="Observações" subtitle="Informações adicionais sobre o processo" icon="📝">
          <Field label="Observações gerais">
            <textarea
              style={{
                ...inputStyle(),
                resize: "vertical",
                minHeight: 80,
                fontFamily: font.family,
              }}
              value={form.observacoes}
              onChange={e => set("observacoes", e.target.value)}
              placeholder="Informações adicionais, pendências, observações relevantes..."
            />
          </Field>
        </Section>

        {/* ── Rodapé ── */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 12,
          paddingTop: 8,
        }}>
          <button
            type="button"
            style={{ ...base.btnGhost, padding: "10px 20px" }}
            onClick={() => navigate(-1)}
          >
            Cancelar
          </button>
          <button
            type="submit"
            style={{
              ...base.btnPrimary,
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 24px",
              opacity: isPending ? 0.7 : 1,
            }}
            disabled={isPending}
          >
            {isPending ? (
              <>⏳ Salvando...</>
            ) : (
              <><IconSave /> {isEdit ? "Atualizar Processo" : "Cadastrar Processo"}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
