import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiFolder,
  FiBriefcase,
  FiUsers,
  FiBox,
  FiFileText,
  FiShoppingCart,
  FiChevronDown,
  FiChevronUp,
  FiArchive,
  FiActivity,
  FiLayers,
  FiGrid,
  FiClipboard,
  FiCreditCard,
  FiBarChart2,
  FiTrendingUp,
  FiShoppingBag,
  FiShield,
  FiUserCheck,
  FiKey,
} from "react-icons/fi";

import { useAuth } from "../contexts/AuthContext";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  const [openCadastro, setOpenCadastro] = useState(true);
  const [openEstoque, setOpenEstoque] = useState(true);
  const [openMovimentacao, setOpenMovimentacao] = useState(true);
  const [openFinanceiro, setOpenFinanceiro] = useState(true);
  const [openControleAcesso, setOpenControleAcesso] = useState(true);

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  }

  const dashboardVisible = hasPermission("DASHBOARD_VISUALIZAR");

  const cadastroItems = [
    { path: "/empresas", label: "Empresas", icon: <FiBriefcase size={16} />, permission: "EMPRESA_LISTAR" },
    { path: "/orgaos", label: "Órgãos", icon: <FiUsers size={16} />, permission: "ORGAO_LISTAR" },
    { path: "/fornecedores", label: "Fornecedores", icon: <FiUsers size={16} />, permission: "FORNECEDOR_LISTAR" },
    { path: "/produtos", label: "Produtos", icon: <FiBox size={16} />, permission: "PRODUTO_LISTAR" },
    { path: "/grupos", label: "Grupo de produtos", icon: <FiLayers size={16} />, permission: "GRUPO_PRODUTO_LISTAR" },
    { path: "/subgrupos", label: "Subgrupo de produtos", icon: <FiGrid size={16} />, permission: "SUBGRUPO_PRODUTO_LISTAR" },
    { path: "/formas-pagamento", label: "Formas de pagamento", icon: <FiCreditCard size={16} />, permission: "FORMA_PAGAMENTO_LISTAR" },
  ].filter((item) => hasPermission(item.permission));

  const movimentacaoItems = [
    { path: "/contratos", label: "Contratos", icon: <FiFileText size={16} />, permission: "CONTRATO_LISTAR" },
    { path: "/pedidosvenda", label: "Vendas de Contrato", icon: <FiTrendingUp size={16} />, permission: "PEDIDO_VENDA_LISTAR" },
    { path: "/compras", label: "Compras", icon: <FiShoppingBag size={16} />, permission: "COMPRA_LISTAR" },
  ].filter((item) => hasPermission(item.permission));

  const financeiroItems = [
    { path: "/contas-pagar", label: "Contas a Pagar", icon: <FiCreditCard size={16} />, permission: "CONTA_PAGAR_LISTAR" },
    { path: "/dashboard-financeiro", label: "Dashboard Financeiro", icon: <FiBarChart2 size={16} />, permission: "DASHBOARD_FINANCEIRO_VISUALIZAR" },
  ].filter((item) => hasPermission(item.permission));

  const estoqueItems = [
    { path: "/estoque", label: "Posição de estoque", icon: <FiArchive size={16} />, permission: "ESTOQUE_LISTAR" },
    { path: "/estoque/movimentacoes", label: "Movimentações", icon: <FiActivity size={16} />, permission: "ESTOQUE_MOVIMENTACAO_LISTAR" },
    { path: "/estoque/lotes", label: "Estoque por lote", icon: <FiBox size={16} />, permission: "ESTOQUE_LOTE_LISTAR" },
    { path: "/estoque/inventario", label: "Inventário", icon: <FiClipboard size={16} />, permission: "INVENTARIO_LISTAR" },
  ].filter((item) => hasPermission(item.permission));

  const controleAcessoItems = [
    { path: "/controle-acesso/acoes-sistema", label: "Ações do sistema", icon: <FiKey size={16} />, permission: "ACAO_SISTEMA_LISTAR" },
    { path: "/controle-acesso/grupos-usuarios", label: "Grupos de usuários", icon: <FiShield size={16} />, permission: "GRUPO_USUARIO_LISTAR" },
    { path: "/controle-acesso/usuarios", label: "Usuários", icon: <FiUserCheck size={16} />, permission: "USUARIO_LISTAR" },
  ].filter((item) => hasPermission(item.permission));

  const cadastrosActive = useMemo(
    () => cadastroItems.some((item) => isActive(item.path)),
    [location.pathname, cadastroItems]
  );

  const movimentacaoActive = useMemo(
    () => movimentacaoItems.some((item) => isActive(item.path)),
    [location.pathname, movimentacaoItems]
  );

  const financeiroActive = useMemo(
    () => financeiroItems.some((item) => isActive(item.path)),
    [location.pathname, financeiroItems]
  );

  const estoqueActive = useMemo(
    () => estoqueItems.some((item) => isActive(item.path)),
    [location.pathname, estoqueItems]
  );

  const controleAcessoActive = useMemo(
    () => controleAcessoItems.some((item) => isActive(item.path)),
    [location.pathname, controleAcessoItems]
  );

  useEffect(() => {
    if (cadastrosActive) setOpenCadastro(true);
  }, [cadastrosActive]);

  useEffect(() => {
    if (movimentacaoActive) setOpenMovimentacao(true);
  }, [movimentacaoActive]);

  useEffect(() => {
    if (financeiroActive) setOpenFinanceiro(true);
  }, [financeiroActive]);

  useEffect(() => {
    if (estoqueActive) setOpenEstoque(true);
  }, [estoqueActive]);

  useEffect(() => {
    if (controleAcessoActive) setOpenControleAcesso(true);
  }, [controleAcessoActive]);

  const styles = {
    aside: {
      width: 280,
      minWidth: 280,
      height: "100vh",
      background: "linear-gradient(180deg, #0f172a 0%, #111827 45%, #0b1220 100%)",
      color: "#e5e7eb",
      display: "flex",
      flexDirection: "column" as const,
      borderRight: "1px solid rgba(255,255,255,0.06)",
      padding: "18px 14px",
      boxSizing: "border-box" as const,
      position: "sticky" as const,
      top: 0,
      overflowY: "auto" as const,
    },
    brandWrap: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "8px 10px 18px 10px",
      marginBottom: 8,
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    brandIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 45%, #1d4ed8 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontWeight: 800,
      fontSize: 16,
      boxShadow: "0 10px 24px rgba(37, 99, 235, 0.28)",
      flexShrink: 0,
    },
    brandTextWrap: {
      display: "flex",
      flexDirection: "column" as const,
      minWidth: 0,
    },
    brandTitle: {
      fontSize: 17,
      fontWeight: 700,
      color: "#f8fafc",
      lineHeight: 1.1,
      letterSpacing: 0.2,
    },
    brandSubtitle: {
      fontSize: 12,
      color: "rgba(226,232,240,0.68)",
      marginTop: 4,
      lineHeight: 1.2,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase" as const,
      color: "rgba(148,163,184,0.8)",
      padding: "16px 10px 8px",
    },
    menuItem: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderRadius: 14,
      cursor: "pointer",
      userSelect: "none" as const,
      color: "#dbe4ee",
      fontSize: 14,
      fontWeight: 500,
      transition: "all 0.22s ease",
      marginBottom: 6,
      border: "1px solid transparent",
    },
    activeItem: {
      background: "linear-gradient(90deg, rgba(59,130,246,0.18), rgba(37,99,235,0.08))",
      border: "1px solid rgba(59,130,246,0.28)",
      color: "#ffffff",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
    },
    iconWrap: {
      width: 18,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    submenu: {
      position: "relative" as const,
      margin: "4px 0 10px 0",
      paddingLeft: 16,
      marginLeft: 12,
      borderLeft: "1px solid rgba(148,163,184,0.18)",
    },
    submenuItem: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 12px",
      borderRadius: 12,
      cursor: "pointer",
      userSelect: "none" as const,
      fontSize: 13.5,
      fontWeight: 500,
      color: "rgba(226,232,240,0.82)",
      transition: "all 0.22s ease",
      marginBottom: 4,
      border: "1px solid transparent",
    },
    activeSubItem: {
      background: "rgba(59,130,246,0.12)",
      border: "1px solid rgba(59,130,246,0.22)",
      color: "#ffffff",
    },
    footer: {
      marginTop: "auto",
      padding: "14px 10px 4px",
      color: "rgba(148,163,184,0.72)",
      fontSize: 12,
      borderTop: "1px solid rgba(255,255,255,0.06)",
    },
  };

  const handleMouseEnter =
    (active: boolean) => (e: React.MouseEvent<HTMLDivElement>) => {
      if (active) return;
      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
      e.currentTarget.style.transform = "translateX(3px)";
    };

  const handleMouseLeave =
    (active: boolean) => (e: React.MouseEvent<HTMLDivElement>) => {
      if (active) return;
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.borderColor = "transparent";
      e.currentTarget.style.transform = "translateX(0)";
    };

  const renderSubItem = (item: {
    path: string;
    label: string;
    icon: React.ReactNode;
    permission: string;
  }) => {
    const active = isActive(item.path);

    return (
      <div
        key={item.path}
        style={{
          ...styles.submenuItem,
          ...(active ? styles.activeSubItem : {}),
        }}
        onMouseEnter={handleMouseEnter(active)}
        onMouseLeave={handleMouseLeave(active)}
        onClick={() => navigate(item.path)}
      >
        <span style={styles.iconWrap}>{item.icon}</span>
        <span style={{ flex: 1 }}>{item.label}</span>
      </div>
    );
  };

  const renderGroup = ({
    visible,
    active,
    open,
    setOpen,
    icon,
    label,
    items,
  }: {
    visible: boolean;
    active: boolean;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    icon: React.ReactNode;
    label: string;
    items: Array<{
      path: string;
      label: string;
      icon: React.ReactNode;
      permission: string;
    }>;
  }) => {
    if (!visible) return null;

    return (
      <>
        <div
          style={{
            ...styles.menuItem,
            ...(active ? styles.activeItem : {}),
          }}
          onMouseEnter={handleMouseEnter(active)}
          onMouseLeave={handleMouseLeave(active)}
          onClick={() => setOpen((v) => !v)}
        >
          <span style={styles.iconWrap}>{icon}</span>
          <span style={{ flex: 1 }}>{label}</span>
          {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </div>

        {open && <div style={styles.submenu}>{items.map(renderSubItem)}</div>}
      </>
    );
  };

  return (
    <aside style={styles.aside}>
      <div style={styles.brandWrap}>
        <div style={styles.brandIcon}>SC</div>

        <div style={styles.brandTextWrap}>
          <div style={styles.brandTitle}>SisContratos</div>
          <div style={styles.brandSubtitle}>Gestão comercial e contratual</div>
        </div>
      </div>

      {dashboardVisible && (
        <>
          <div style={styles.sectionLabel}>Visão geral</div>

          <div
            style={{
              ...styles.menuItem,
              ...(isActive("/") ? styles.activeItem : {}),
            }}
            onMouseEnter={handleMouseEnter(isActive("/"))}
            onMouseLeave={handleMouseLeave(isActive("/"))}
            onClick={() => navigate("/")}
          >
            <span style={styles.iconWrap}>
              <FiHome size={18} />
            </span>
            <span style={{ flex: 1 }}>Dashboard</span>
          </div>
        </>
      )}

      {(cadastroItems.length > 0 ||
        movimentacaoItems.length > 0 ||
        financeiroItems.length > 0 ||
        estoqueItems.length > 0 ||
        controleAcessoItems.length > 0) && (
          <div style={styles.sectionLabel}>Gestão</div>
        )}

      {renderGroup({
        visible: cadastroItems.length > 0,
        active: cadastrosActive,
        open: openCadastro,
        setOpen: setOpenCadastro,
        icon: <FiFolder size={18} />,
        label: "Cadastros",
        items: cadastroItems,
      })}

      {renderGroup({
        visible: movimentacaoItems.length > 0,
        active: movimentacaoActive,
        open: openMovimentacao,
        setOpen: setOpenMovimentacao,
        icon: <FiShoppingCart size={18} />,
        label: "Movimentação",
        items: movimentacaoItems,
      })}

      {renderGroup({
        visible: financeiroItems.length > 0,
        active: financeiroActive,
        open: openFinanceiro,
        setOpen: setOpenFinanceiro,
        icon: <FiCreditCard size={18} />,
        label: "Financeiro",
        items: financeiroItems,
      })}

      {renderGroup({
        visible: estoqueItems.length > 0,
        active: estoqueActive,
        open: openEstoque,
        setOpen: setOpenEstoque,
        icon: <FiArchive size={18} />,
        label: "Estoque",
        items: estoqueItems,
      })}
      <div style={styles.footer}>Ambiente administrativo</div>
      {renderGroup({
        visible: controleAcessoItems.length > 0,
        active: controleAcessoActive,
        open: openControleAcesso,
        setOpen: setOpenControleAcesso,
        icon: <FiShield size={18} />,
        label: "Controle de Acesso",
        items: controleAcessoItems,
      })}
    </aside>
  );
}