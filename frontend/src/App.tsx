import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ProcessosList from "./pages/ProcessosList";
import ProcessoForm from "./pages/ProcessoForm";
import ProcessoDetalhes from "./pages/ProcessoDetalhes";
import LicitacoesPrevistas from "./pages/LicitacoesPrevistas";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/processos" element={<ProcessosList />} />
        <Route path="/processos/novo" element={<ProcessoForm />} />
        <Route path="/licitacoes-previstas" element={<LicitacoesPrevistas />} />
        <Route path="/processos/:id/editar" element={<ProcessoForm />} />
        <Route path="/processos/:id" element={<ProcessoDetalhes />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}
