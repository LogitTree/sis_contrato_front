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
} from "react-icons/fi";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [openCadastro, setOpenCadastro] = useState(true);
  const [openEstoque, setOpenEstoque] = useState(true);

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/";
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  }

  const cadastroItems = [
    {
      path: "/empresas",
      label: "Empresas",
      icon: <FiBriefcase size={16} />,
    },
    {
      path: "/orgaos",
      label: "Órgãos",
      icon: <FiUsers size={16} />,
    },
    {
      path: "/fornecedores",
      label: "Fornecedores",
      icon: <FiUsers size={16} />,
    },
    {
      path: "/produtos",
      label: "Produtos",
      icon: <FiBox size={16} />,
    },
    {
      path: "/grupos",
      label: "Grupo de produtos",
      icon: <FiLayers size={16} />,
    },
    {
      path: "/subgrupos",
      label: "Subgrupo de produtos",
      icon: <FiGrid size={16} />,
    },
  ];

  const estoqueItems = [
    {
      path: "/estoque",
      label: "Posição de estoque",
      icon: <FiArchive size={16} />,
    },
    {
      path: "/estoque/movimentacoes",
      label: "Movimentações",
      icon: <FiActivity size={16} />,
    },
    {
      path: "/estoque/lotes",
      label: "Estoque por lote",
      icon: <FiBox size={16} />,
    },
  ];

  const cadastrosActive = useMemo(
    () => cadastroItems.some((item) => isActive(item.path)),
    [location.pathname]
  );

  const estoqueActive = useMemo(
    () => estoqueItems.some((item) => isActive(item.path)),
    [location.pathname]
  );

  useEffect(() => {
    if (cadastrosActive) setOpenCadastro(true);
  }, [cadastrosActive]);

  useEffect(() => {
    if (estoqueActive) setOpenEstoque(true);
  }, [estoqueActive]);

  const styles = {
    aside: {
      width: 280,
      minWidth: 280,
      height: "100vh",
      background:
        "linear-gradient(180deg, #0f172a 0%, #111827 45%, #0b1220 100%)",
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
      background:
        "linear-gradient(135deg, #3b82f6 0%, #2563eb 45%, #1d4ed8 100%)",
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

  const renderItem = (
    path: string,
    label: string,
    icon: React.ReactNode,
    onClick?: () => void
  ) => {
    const active = isActive(path);

    return (
      <div
        style={{
          ...styles.menuItem,
          ...(active ? styles.activeItem : {}),
        }}
        onMouseEnter={handleMouseEnter(active)}
        onMouseLeave={handleMouseLeave(active)}
        onClick={onClick ?? (() => navigate(path))}
      >
        <span style={styles.iconWrap}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
      </div>
    );
  };

  const renderSubItem = (item: {
    path: string;
    label: string;
    icon: React.ReactNode;
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
        title={item.label}
      >
        <span style={styles.iconWrap}>{item.icon}</span>
        <span style={{ flex: 1 }}>{item.label}</span>
      </div>
    );
  };

  return (
    <aside style={styles.aside}>
      <div style={styles.brandWrap}>
        <div style={styles.brandIcon}>SC</div>

        <div style={styles.brandTextWrap}>
          <div style={styles.brandTitle}>SisContratos</div>
          <div style={styles.brandSubtitle}>
            Gestão comercial e contratual
          </div>
        </div>
      </div>

      <div style={styles.sectionLabel}>Visão geral</div>
      {renderItem("/", "Dashboard", <FiHome size={18} />)}

      <div style={styles.sectionLabel}>Gestão</div>

      <div
        style={{
          ...styles.menuItem,
          ...(cadastrosActive ? styles.activeItem : {}),
        }}
        onMouseEnter={handleMouseEnter(cadastrosActive)}
        onMouseLeave={handleMouseLeave(cadastrosActive)}
        onClick={() => setOpenCadastro((v) => !v)}
      >
        <span style={styles.iconWrap}>
          <FiFolder size={18} />
        </span>
        <span style={{ flex: 1 }}>Cadastros</span>
        {openCadastro ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </div>

      {openCadastro && <div style={styles.submenu}>{cadastroItems.map(renderSubItem)}</div>}

      {renderItem("/contratos", "Contratos", <FiFileText size={18} />)}
      {renderItem("/pedidosvenda", "Vendas", <FiShoppingCart size={18} />)}
      {renderItem("/compras", "Compras", <FiShoppingCart size={18} />)}

      <div
        style={{
          ...styles.menuItem,
          ...(estoqueActive ? styles.activeItem : {}),
        }}
        onMouseEnter={handleMouseEnter(estoqueActive)}
        onMouseLeave={handleMouseLeave(estoqueActive)}
        onClick={() => setOpenEstoque((v) => !v)}
      >
        <span style={styles.iconWrap}>
          <FiArchive size={18} />
        </span>
        <span style={{ flex: 1 }}>Estoque</span>
        {openEstoque ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </div>

      {openEstoque && <div style={styles.submenu}>{estoqueItems.map(renderSubItem)}</div>}

      <div style={styles.footer}>
        Ambiente administrativo
      </div>
    </aside>
  );
}