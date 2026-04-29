// ============================================================
// UFMG Pré-Compras — Sistema de Design Institucional
// Tokens de cores, espaçamento, tipografia e utilitários
// ============================================================

export const colors = {
  // Paleta institucional UFMG (azul profundo)
  primary: {
    50:  "#e8f0fb",
    100: "#c5d6f5",
    200: "#9dbcef",
    300: "#74a1e8",
    400: "#558be3",
    500: "#3675de",
    600: "#1e5bb8",   // azul principal
    700: "#174899",
    800: "#0f3478",
    900: "#07205a",
  },
  // Neutros
  gray: {
    50:  "#f8f9fc",
    100: "#f0f2f7",
    200: "#e4e7ef",
    300: "#d1d5e0",
    400: "#9ba3b8",
    500: "#6b7490",
    600: "#4a5168",
    700: "#363c52",
    800: "#232839",
    900: "#141720",
  },
  // Semânticas
  success: { light: "#e6f7ee", mid: "#52c47a", dark: "#1a7a40" },
  warning: { light: "#fff8e1", mid: "#f5a623", dark: "#8a5c00" },
  danger:  { light: "#fdecea", mid: "#e05252", dark: "#9b1c1c" },
  info:    { light: "#e8f4fd", mid: "#3b9ede", dark: "#1a5f8a" },
};

export const shadows = {
  xs:  "0 1px 2px rgba(0,0,0,0.05)",
  sm:  "0 1px 4px rgba(0,0,0,0.08)",
  md:  "0 2px 8px rgba(0,0,0,0.10)",
  lg:  "0 4px 16px rgba(0,0,0,0.12)",
  xl:  "0 8px 32px rgba(0,0,0,0.14)",
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48,
};

export const font = {
  size: {
    xs: 11, sm: 12, base: 14, md: 15, lg: 16, xl: 18, "2xl": 22, "3xl": 28,
  },
  weight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
};

// ─── Funções utilitárias de estilo ───────────────────────────

/** Retorna estilo de badge de prioridade por dias em aberto */
export function priorityStyle(days: number): React.CSSProperties {
  if (days <= 5)  return { background: colors.success.light, color: colors.success.dark };
  if (days <= 10) return { background: colors.warning.light, color: colors.warning.dark };
  return { background: colors.danger.light, color: colors.danger.dark };
}

/** Retorna cor da borda lateral do card de processo */
export function priorityBorderColor(days: number): string {
  if (days <= 5)  return colors.success.mid;
  if (days <= 10) return colors.warning.mid;
  return colors.danger.mid;
}

/** Badge de situação */
export function situacaoStyle(sit: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    "Em andamento": { background: colors.info.light,    color: colors.info.dark },
    "Finalizado":   { background: colors.success.light, color: colors.success.dark },
    "Cancelado":    { background: colors.gray[100],     color: colors.gray[600] },
  };
  return map[sit] ?? { background: colors.gray[100], color: colors.gray[600] };
}

// ─── Estilos base reutilizáveis ──────────────────────────────

export const base: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    borderRadius: radius.md,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.gray[200]}`,
  },
  input: {
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: radius.sm,
    padding: "8px 12px",
    fontSize: font.size.base,
    fontFamily: font.family,
    outline: "none",
    width: "100%",
    color: colors.gray[800],
    background: "#fff",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  label: {
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    color: colors.gray[500],
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
    marginBottom: 4,
    display: "block",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: radius.full,
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    lineHeight: 1.6,
  },
  btnPrimary: {
    background: colors.primary[600],
    color: "#fff",
    border: "none",
    borderRadius: radius.sm,
    padding: "9px 20px",
    fontSize: font.size.base,
    fontWeight: font.weight.semibold,
    cursor: "pointer",
    fontFamily: font.family,
    transition: "background 0.15s",
  },
  btnSecondary: {
    background: "#fff",
    color: colors.primary[600],
    border: `1.5px solid ${colors.primary[600]}`,
    borderRadius: radius.sm,
    padding: "8px 16px",
    fontSize: font.size.base,
    fontWeight: font.weight.medium,
    cursor: "pointer",
    fontFamily: font.family,
  },
  btnDanger: {
    background: "#fff",
    color: colors.danger.dark,
    border: `1.5px solid ${colors.danger.mid}`,
    borderRadius: radius.sm,
    padding: "7px 14px",
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    cursor: "pointer",
    fontFamily: font.family,
  },
  btnGhost: {
    background: "transparent",
    color: colors.gray[600],
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: radius.sm,
    padding: "8px 16px",
    fontSize: font.size.base,
    cursor: "pointer",
    fontFamily: font.family,
  },
  sectionTitle: {
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    color: colors.gray[800],
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottom: `2px solid ${colors.gray[100]}`,
  },
  pageTitle: {
    fontSize: font.size["2xl"],
    fontWeight: font.weight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xl,
  },
};
