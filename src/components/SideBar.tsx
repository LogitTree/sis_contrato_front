import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
} from 'react-icons/fi';

import { sidebarStyles } from '../styles/sidebar';

/* =========================
   Hover reutilizável
========================= */
const hoverEffect = {
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.background = '#1f2937';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.background = 'transparent';
  },
};

/* =========================
   Component
========================= */
export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openCadastro, setOpenCadastro] = useState(true);

  function isActive(path: string) {
    return location.pathname.startsWith(path);
  }

  return (
    <aside style={sidebarStyles.container}>
      {/* Logo */}
      <div style={sidebarStyles.logo}>SisContratos</div>

      {/* Dashboard */}
      <div
        style={{
          ...sidebarStyles.menuItem,
          ...(isActive('/') ? sidebarStyles.activeItem : {}),
        }}
        {...hoverEffect}
        onClick={() => navigate('/')}
      >
        <FiHome size={18} />
        Dashboard
      </div>

      {/* Cadastros */}
      <div
        style={{
          ...sidebarStyles.menuItem,
          ...(isActive('/empresas') ||
            isActive('/orgaos') ||
            isActive('/produtos')
            ? sidebarStyles.activeItem
            : {}),
        }}
        {...hoverEffect}
        onClick={() => setOpenCadastro(!openCadastro)}
      >
        <FiFolder size={18} />
        Cadastros
        {openCadastro ? <FiChevronUp /> : <FiChevronDown />}
      </div>

      {openCadastro && (
        <div style={sidebarStyles.submenu}>
          <div
            style={{
              ...sidebarStyles.submenuItem,
              ...(isActive('/empresas')
                ? sidebarStyles.activeSubItem
                : {}),
            }}
            {...hoverEffect}
            onClick={() => navigate('/empresas')}
          >
            <FiBriefcase size={16} />
            Empresas
          </div>

          <div
            style={{
              ...sidebarStyles.submenuItem,
              ...(isActive('/orgaos')
                ? sidebarStyles.activeSubItem
                : {}),
            }}
            {...hoverEffect}
            onClick={() => navigate('/orgaos')}
          >
            <FiUsers size={16} />
            Órgãos
          </div>

          <div
            style={{
              ...sidebarStyles.submenuItem,
              ...(isActive('/produtos')
                ? sidebarStyles.activeSubItem
                : {}),
            }}
            {...hoverEffect}
            onClick={() => navigate('/produtos')}
          >
            <FiBox size={16} />
            Produtos
          </div>

          <div
            style={{
              ...sidebarStyles.submenuItem,
              ...(isActive('/grupos')
                ? sidebarStyles.activeSubItem
                : {}),
            }}
            {...hoverEffect}
            onClick={() => navigate('/grupos')}
          >
            <FiBox size={16} />
            Grupo de produtos
          </div>

          <div
            style={{
              ...sidebarStyles.submenuItem,
              ...(isActive('/subgrupos')
                ? sidebarStyles.activeSubItem
                : {}),
            }}
            {...hoverEffect}
            onClick={() => navigate('/subgrupos')}
          >
            <FiBox size={16} />
            Subgrupo de produtos
          </div>
        </div>
      )}

      {/* Contratos */}
      <div
        style={{
          ...sidebarStyles.menuItem,
          ...(isActive('/contratos') ? sidebarStyles.activeItem : {}),
        }}
        {...hoverEffect}
        onClick={() => navigate('/contratos')}
      >
        <FiFileText size={18} />
        Contratos
      </div>

      {/* Vendas */}
      <div
        style={{
          ...sidebarStyles.menuItem,
          ...(isActive('/pedidosvenda') ? sidebarStyles.activeItem : {}),
        }}
        {...hoverEffect}
        onClick={() => navigate('/pedidosvenda')}
      >
        <FiShoppingCart size={18} />
        Vendas
      </div>
    </aside>
  );
}
