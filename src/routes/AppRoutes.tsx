import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import PrivateRoute from "./PrivateRoute";

import MainLayout from "../layouts/MainLayout";

import Dashboard from "../pages/Dashboard";
import EmpresasList from "../pages/Empresas/List";
import EmpresaCreate from "../pages/Empresas/Create";
import EmpresaEdit from "../pages/Empresas/Edit";
import OrgaosList from "../pages/Orgaos/List";
import OrgaoCreate from "../pages/Orgaos/Create";
import OrgaoEdit from "../pages/Orgaos/Edit";
import GruposList from "../pages/Produtos/GrupoList";
import GrupoCreate from "../pages/Produtos/GrupoCreate";
import GrupoEdit from "../pages/Produtos/GrupoEdit";
import SubgruposList from "../pages/Produtos/SubgrupoList";
import SubgrupoCreate from "../pages/Produtos/SubgrupoCreate";
import SubgrupoEdit from "../pages/Produtos/SubgrupoEdit";
import ProdutosList from "../pages/Produtos/List";
import ProdutoCreate from "../pages/Produtos/Create";
import ProdutoEdit from "../pages/Produtos/Edit";
import ContratosList from "../pages/Contratos/List";
import ContratoCreate from "../pages/Contratos/Create";
import ContratoEdit from "../pages/Contratos/Edit";
import ContratoItens from "../pages/Contratos/ContratoItens";
import Login from "../pages/Login";
import PedidoVenda from "../pages/PedidoVenda/List";
import PedidoVendaCreate from "../pages/PedidoVenda/Create";
import PedidoVendaEdit from "../pages/PedidoVenda/Edit";
import Compra from "../pages/Compras/List";
import CompraCreate from "../pages/Compras/Create";
import CompraEdit from "../pages/Compras/Edit";
import ComprasReceber from "../pages/Compras/Receber";
import ComprasShow from "../pages/Compras/Show";
import EstoqueList from "../pages/Estoque/List";
import EstoqueMovimentacoes from "../pages/Estoque/Movimentacoes";
import Fornecedor from "../pages/Fornecedores/List";
import FornecedorCreate from "../pages/Fornecedores/Create";
import FornecedorEdit from "../pages/Fornecedores/Edit";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />

          {/* Protegidas */}
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />

              <Route path="/empresas" element={<EmpresasList />} />
              <Route path="/empresas/nova" element={<EmpresaCreate />} />
              <Route path="/empresas/:id/editar" element={<EmpresaEdit />} />

              <Route path="/orgaos" element={<OrgaosList />} />
              <Route path="/orgaos/novo" element={<OrgaoCreate />} />
              <Route path="/orgaos/:id/editar" element={<OrgaoEdit />} />

              <Route path="/grupos" element={<GruposList />} />
              <Route path="/grupos/novo" element={<GrupoCreate />} />
              <Route path="/grupos/:id/editar" element={<GrupoEdit />} />

              <Route path="/subgrupos" element={<SubgruposList />} />
              <Route path="/subgrupos/novo" element={<SubgrupoCreate />} />
              <Route path="/subgrupos/:id/editar" element={<SubgrupoEdit />} />

              <Route path="/produtos" element={<ProdutosList />} />
              <Route path="/produtos/novo" element={<ProdutoCreate />} />
              <Route path="/produtos/:id/editar" element={<ProdutoEdit />} />

              <Route path="/contratos" element={<ContratosList />} />
              <Route path="/contratos/novo" element={<ContratoCreate />} />
              <Route path="/contratos/:id/editar" element={<ContratoEdit />} />
              <Route path="/contratos/:id/itens" element={<ContratoItens />} />

              <Route path="/pedidosvenda" element={<PedidoVenda />} />
              <Route path="/pedidosvenda/novo" element={<PedidoVendaCreate />} />
              <Route path="/pedidosvenda/:id/editar" element={<PedidoVendaEdit />} />

              <Route path="/compras" element={<Compra />} />
              <Route path="/compras/novo" element={<CompraCreate />} />
              <Route path="/compras/:id/editar" element={<CompraEdit />} />
              <Route path="/compras/:id/receber" element={<ComprasReceber />} />
              <Route path="/compras/:id" element={<ComprasShow />} />

              <Route path="/estoque" element={<EstoqueList />} />
              <Route path="/estoque/movimentacoes" element={<EstoqueMovimentacoes />} />

              <Route path="/fornecedores" element={<Fornecedor />} />
              <Route path="/fornecedores/novo" element={<FornecedorCreate />} />
              <Route path="/fornecedores/:id/editar" element={<FornecedorEdit />} />
            </Route>
          </Route>

          {/* Catch-all: se não achar rota, manda pro / */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}