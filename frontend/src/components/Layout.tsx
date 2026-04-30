import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { colors, shadows, font } from "../lib/design";

// ─── Ícones SVG inline ────────────────────────────────────────
const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const IconList = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

const navItems = [
  { to: "/dashboard",      label: "Dashboard",       Icon: IconDashboard },
  { to: "/processos",      label: "Processos",       Icon: IconList },
  { to: "/processos/novo", label: "Novo Processo",   Icon: IconPlus },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fa", fontFamily: font.family }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 248,
        background: `linear-gradient(180deg, #0f2d5e 0%, #1a4a8a 100%)`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        boxShadow: "2px 0 12px rgba(0,0,0,0.15)",
        position: "sticky",
        top: 0,
        height: "100vh",
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: "rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, color: "#fff",
            }}>U</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>UFMG</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.2 }}>Pré-Compras</div>
            </div>
          </div>
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase", letterSpacing: 1,
          }}>
            Sistema de Licitações
          </div>
        </div>

        {/* Navegação */}
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, padding: "0 12px", marginBottom: 8 }}>
            Menu
          </div>
          {navItems.map(({ to, label, Icon }) => {
            const isActive = to === "/processos"
              ? location.pathname === "/processos"
              : location.pathname.startsWith(to);

            return (
              <NavLink
                key={to}
                to={to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                  marginBottom: 2,
                  transition: "all 0.15s",
                  borderLeft: isActive ? "3px solid #7eb8f7" : "3px solid transparent",
                }}
              >
                <Icon />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* Rodapé da sidebar */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.07)",
            borderRadius: 6, padding: "5px 10px",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#52c47a" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Sem autenticação</span>
          </div>
        </div>
      </aside>

      {/* ── Conteúdo principal ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          background: "#fff",
          borderBottom: `1px solid ${colors.gray[200]}`,
          padding: "0 32px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: shadows.xs,
          position: "sticky",
          top: 0,
          zIndex: 9,
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: colors.primary[800], lineHeight: 1.2 }}>
              Painel Institucional de Processos
            </span>
            <span style={{ fontSize: 12, color: colors.gray[500] }}>
              Controle de Processos de Pré-Compras e Licitações
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              fontSize: 12, color: colors.primary[700],
              background: colors.primary[50],
              border: `1px solid ${colors.primary[100]}`,
              padding: "5px 12px", borderRadius: 20,
            }}>
              UFMG - DPRE
            </div>
          </div>
        </header>

        {/* Página */}
        <div style={{ padding: "28px 32px", flex: 1 }}>
          {children}
        </div>

        {/* Disclaimer institucional */}
        <footer
          style={{
            borderTop: `1px solid ${colors.gray[200]}`,
            background: "#fff",
            padding: "14px 32px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.5,
              color: colors.gray[500],
              textAlign: "center",
            }}
          >
            Os dados apresentados neste sistema são de natureza informativa, baseados em
            informações públicas e não possuem caráter oficial. Não substituem registros
            formais ou sistemas institucionais da UFMG, sendo utilizados exclusivamente para
            fins de apoio à análise e gestão de processos.
          </p>
        </footer>
      </main>
    </div>
  );
}
