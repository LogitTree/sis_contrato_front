import { useEffect, useState } from "react";
import api from "../../api/api";
import { buttonStyles } from "../../styles/buttons";
import { tableStyles } from "../../styles/table";
import { toast } from "react-toastify";
import { formatarDataBR } from "../../utils/masks";
import { FiX } from "react-icons/fi";

type Props = {
  orgaoId: number;
  onClose: () => void;
};

type ContratoResumo = {
  id: number;
  numero: string;
  data_inicio: string | null;
  data_fim: string | null;
};

export default function ModalContratosOrgao({ orgaoId, onClose }: Props) {
  const [contratos, setContratos] = useState<ContratoResumo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/orgaocontratante/${orgaoId}/contratos`);
        setContratos(Array.isArray(res.data) ? res.data : []);
      } catch {
        toast.error("Erro ao carregar contratos");
        onClose();
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orgaoId, onClose]);

  // 🔒 fecha no ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div style={overlay} onMouseDown={onClose}>
      <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
        {/* ===== HEADER ===== */}
        <div style={header}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h2 style={title}>Contratos do Órgão</h2>
              <p style={subtitle}>Lista de contratos vinculados a este órgão.</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Fechar"
              style={{
                ...buttonStyles.icon,
                width: 36,
                height: 36,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#0f172a",
              }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* ===== CONTENT ===== */}
        <div style={content}>
          {loading ? (
            <div style={emptyState}>
              <div style={emptyTitle}>Carregando...</div>
              <div style={emptySub}>Buscando contratos vinculados.</div>
            </div>
          ) : contratos.length === 0 ? (
            <div style={emptyState}>
              <div style={emptyTitle}>Nenhum contrato encontrado</div>
              <div style={emptySub}>
                Este órgão ainda não possui contratos vinculados.
              </div>
            </div>
          ) : (
            <div style={tableWrap}>
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={{ ...tableStyles.th, width: "40%" }}>
                      Nº do Contrato
                    </th>
                    <th style={{ ...tableStyles.th, width: "30%" }}>
                      Início da Vigência
                    </th>
                    <th style={{ ...tableStyles.th, width: "30%" }}>
                      Fim da Vigência
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {contratos.map((c) => (
                    <tr
                      key={c.id}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td style={tableStyles.td}>{c.numero}</td>

                      <td style={{ ...tableStyles.td, textAlign: "center" }}>
                        {formatarDataBR(c.data_inicio)}
                      </td>

                      <td style={{ ...tableStyles.td, textAlign: "center" }}>
                        {formatarDataBR(c.data_fim)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ===== FOOTER ===== */}
        <div style={footer}>
          <button style={buttonStyles.link} onClick={onClose}>
            Cancelar
          </button>

          <button style={buttonStyles.primary} onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Styles (padrão do sistema)
========================= */

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.55)", // slate-900
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 1000,
};

const modal: React.CSSProperties = {
  width: "min(760px, 100%)",
  maxHeight: "80vh",
  background: "#ffffff",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const header: React.CSSProperties = {
  padding: "16px 18px",
  borderBottom: "1px solid #e5e7eb",
  background: "#ffffff",
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: "#0f172a",
};

const subtitle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: 13,
  color: "#64748b",
};

const content: React.CSSProperties = {
  padding: 18,
  overflowY: "auto",
  flex: 1,
};

const tableWrap: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  overflow: "hidden",
  background: "#ffffff",
};

const footer: React.CSSProperties = {
  padding: 16,
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  background: "#ffffff",
};

const emptyState: React.CSSProperties = {
  border: "1px dashed #e5e7eb",
  borderRadius: 10,
  padding: 18,
  background: "#fafafa",
};

const emptyTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a",
};

const emptySub: React.CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  color: "#64748b",
};