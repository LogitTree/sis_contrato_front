import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/SideBar";
import { logout } from "../utils/auth";

export default function MainLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        background: "#f8fafc",
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            height: 64,
            minHeight: 64,
            background: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Painel Administrativo
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                marginTop: 2,
              }}
            >
              SisContratos
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              height: 38,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              color: "#334155",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </header>

        <section
          style={{
            flex: 1,
            padding: 20,
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        >
          <Outlet />
        </section>
      </main>
    </div>
  );
}