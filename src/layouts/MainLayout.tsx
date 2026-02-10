import { Outlet } from 'react-router-dom';
import Sidebar from '../components/SideBar';

export default function MainLayout() {
  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',   // 🔥 ocupa toda a largura da tela
        height: '100vh',  // 🔥 ocupa toda a altura da tela
        overflow: 'hidden',
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,            // 🔥 ocupa todo o espaço restante
          width: '100%',
          height: '100%',
          padding: '20px',
          overflow: 'hidden', // 🔥 evita scroll duplo
          boxSizing: 'border-box',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
