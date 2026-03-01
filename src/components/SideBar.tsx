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
} from "react-icons/fi";

import { sidebarStyles } from "../styles/sidebar";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openCadastro, setOpenCadastro] = useState(true);

  function isActive(path: string) {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  }

  const cadastrosActive = useMemo(
    () =>
      isActive("/empresas") ||
      isActive("/orgaos") ||
      isActive("/produtos") ||
      isActive("/grupos") ||
      isActive("/subgrupos"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.pathname]
  );

  useEffect(() => {
    if (cadastrosActive) setOpenCadastro(true);
  }, [cadastrosActive]);

  const onHover =
    (active: boolean) => (e: React.MouseEvent<HTMLDivElement>) => {
      if (active) return;
      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
      e.currentTarget.style.transform = "translateX(2px)";
    };

  const onLeave =
    (active: boolean) => (e: React.MouseEvent<HTMLDivElement>) => {
      if (active) return;
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.transform = "translateX(0)";
    };

  return (
    <aside style={sidebarStyles.container}>
      <div style={sidebarStyles.logo}>SisContratos</div>

      <div style={sidebarStyles.sectionLabel}>Visão geral</div>
      {/* Dashboard */}
      {(() => {
        const active = isActive("/");
        return (
          <div
            style={{
              ...sidebarStyles.menuItem,
              ...(active ? sidebarStyles.activeItem : {}),
            }}
            onMouseEnter={onHover(active)}
            onMouseLeave={onLeave(active)}
            onClick={() => navigate("/")}
          >
            <FiHome size={18} />
            Dashboard
          </div>
        );
      })()}

      <div style={sidebarStyles.sectionLabel}>Gestão</div>

      {/* Cadastros */}
      {(() => {
        const active = cadastrosActive;
        return (
          <>
            <div
              style={{
                ...sidebarStyles.menuItem,
                ...(active ? sidebarStyles.activeItem : {}),
              }}
              onMouseEnter={onHover(active)}
              onMouseLeave={onLeave(active)}
              onClick={() => setOpenCadastro((v) => !v)}
            >
              <FiFolder size={18} />
              <span style={{ flex: 1 }}>Cadastros</span>
              {openCadastro ? <FiChevronUp /> : <FiChevronDown />}
            </div>

            {openCadastro && (
              <div style={sidebarStyles.submenu}>
                {[
                  { path: "/empresas", label: "Empresas", icon: <FiBriefcase size={16} /> },
                  { path: "/orgaos", label: "Órgãos", icon: <FiUsers size={16} /> },
                  { path: "/produtos", label: "Produtos", icon: <FiBox size={16} /> },
                  { path: "/grupos", label: "Grupo de produtos", icon: <FiBox size={16} /> },
                  { path: "/subgrupos", label: "Subgrupo de produtos", icon: <FiBox size={16} /> },
                ].map((it) => {
                  const subActive = isActive(it.path);
                  return (
                    <div
                      key={it.path}
                      style={{
                        ...sidebarStyles.submenuItem,
                        ...(subActive ? sidebarStyles.activeSubItem : {}),
                      }}
                      onMouseEnter={onHover(subActive)}
                      onMouseLeave={onLeave(subActive)}
                      onClick={() => navigate(it.path)}
                      title={it.label}
                    >
                      {it.icon}
                      {it.label}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );
      })()}

      {/* Contratos */}
      {(() => {
        const active = isActive("/contratos");
        return (
          <div
            style={{
              ...sidebarStyles.menuItem,
              ...(active ? sidebarStyles.activeItem : {}),
            }}
            onMouseEnter={onHover(active)}
            onMouseLeave={onLeave(active)}
            onClick={() => navigate("/contratos")}
          >
            <FiFileText size={18} />
            Contratos
          </div>
        );
      })()}

      {/* Vendas */}
      {(() => {
        const active = isActive("/pedidosvenda");
        return (
          <div
            style={{
              ...sidebarStyles.menuItem,
              ...(active ? sidebarStyles.activeItem : {}),
            }}
            onMouseEnter={onHover(active)}
            onMouseLeave={onLeave(active)}
            onClick={() => navigate("/pedidosvenda")}
          >
            <FiShoppingCart size={18} />
            Vendas
          </div>
        );
      })()}
    </aside>
  );
}