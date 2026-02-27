import { Outlet } from 'react-router-dom';
import Sidebar from '../components/SideBar';

export default function MainLayout() {
  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',   // ✅ AGORA TEM SCROLL
          boxSizing: 'border-box',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
