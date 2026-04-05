import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/auth";
import { ThemeProvider } from "@/shared/lib/theme";
import { ToastProvider } from "@/shared/components/ui/Toast";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { ProtectedRoute } from "@/shared/components/layout/ProtectedRoute";
import LoginPage from "@/features/auth/pages/login";
import CadastroPage from "@/features/auth/pages/cadastro";
import PainelPage from "@/features/dashboard/pages/painel";
import EscalasPage from "@/features/escalas/pages/escalas";
import EscalaNovaPage from "@/features/escalas/pages/escala-nova";
import EscalaDetalhePage from "@/features/escalas/pages/escala-detalhe";
import CelebracoesPage from "@/features/celebracoes/pages/celebracoes";
import AcolitosPage from "@/features/acolitos/pages/acolitos";
import AcolitoDetalhePage from "@/features/acolitos/pages/acolito-detalhe";
import DisponibilidadePage from "@/features/disponibilidade/pages/disponibilidade";
import MeuHistoricoPage from "@/features/acolitos/pages/meu-historico";
import ResponsaveisPage from "@/features/admin/pages/responsaveis";
import CoordenacaoPage from "@/features/admin/pages/coordenacao";
import AdminPage from "@/features/admin/pages/admin";
import AdminFuncoesPage from "@/features/admin/pages/admin-funcoes";
import AdminUsuariosPage from "@/features/admin/pages/admin-usuarios";
import AdminAuditoriaPage from "@/features/admin/pages/admin-auditoria";
import EscalaPublicaPage from "@/features/escalas/pages/escala-publica";

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cadastro" element={<CadastroPage />} />
              <Route path="/p/:token" element={<EscalaPublicaPage />} />

              <Route element={<AppLayout />}>
                <Route path="/painel" element={<PainelPage />} />
                <Route path="/escalas" element={<EscalasPage />} />
                <Route path="/escala/nova" element={<ProtectedRoute minRole="COORDINATOR"><EscalaNovaPage /></ProtectedRoute>} />
                <Route path="/escala/:id" element={<EscalaDetalhePage />} />
                <Route path="/disponibilidade" element={<DisponibilidadePage />} />
                <Route path="/meu-historico" element={<MeuHistoricoPage />} />

                <Route path="/acolitos" element={<ProtectedRoute minRole="COORDINATOR"><AcolitosPage /></ProtectedRoute>} />
                <Route path="/acolito/:id" element={<ProtectedRoute minRole="COORDINATOR"><AcolitoDetalhePage /></ProtectedRoute>} />
                <Route path="/celebracoes" element={<ProtectedRoute minRole="COORDINATOR"><CelebracoesPage /></ProtectedRoute>} />
                <Route path="/responsaveis" element={<ProtectedRoute minRole="COORDINATOR"><ResponsaveisPage /></ProtectedRoute>} />
                <Route path="/coordenacao" element={<ProtectedRoute minRole="COORDINATOR"><CoordenacaoPage /></ProtectedRoute>} />

                <Route path="/admin" element={<ProtectedRoute minRole="ADMIN"><AdminPage /></ProtectedRoute>} />
                <Route path="/admin/funcoes" element={<ProtectedRoute minRole="ADMIN"><AdminFuncoesPage /></ProtectedRoute>} />
                <Route path="/admin/usuarios" element={<ProtectedRoute minRole="ADMIN"><AdminUsuariosPage /></ProtectedRoute>} />
                <Route path="/admin/auditoria" element={<ProtectedRoute minRole="ADMIN"><AdminAuditoriaPage /></ProtectedRoute>} />
              </Route>

              <Route path="/" element={<Navigate to="/painel" replace />} />
              <Route path="*" element={<Navigate to="/painel" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
