import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FiX } from "react-icons/fi";

import { buttonStyles } from "../../../styles/buttons";

import type { UsuarioSistema } from "../../../services/controleacesso/usuarioService";

import {
  listarEmpresas,
  listarVinculosUsuarioEmpresa,
  removerVinculoUsuarioEmpresaPorUsuarioEmpresa,
  vincularUsuarioEmpresa,
  type UsuarioEmpresaVinculo,
} from "../../../services/controleacesso/usuarioEmpresaService";

type Props = {
  isOpen: boolean;
  usuario: UsuarioSistema | null;
  onClose: () => void;
};

export default function UsuarioEmpresasModal({
  isOpen,
  usuario,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [vinculos, setVinculos] = useState<UsuarioEmpresaVinculo[]>([]);
  const [updatingEmpresaId, setUpdatingEmpresaId] = useState<number | null>(
    null
  );

  const vinculosMap = useMemo(() => {
    const map = new Map<number, UsuarioEmpresaVinculo>();

    vinculos.forEach((vinculo: any) => {
      const empresaId =
        vinculo.empresa_contratada_id ||
        vinculo.empresaContratadaId ||
        vinculo.empresa?.id;

      if (empresaId) {
        map.set(Number(empresaId), vinculo);
      }
    });

    return map;
  }, [vinculos]);

  async function carregar() {
    if (!usuario?.id) return;

    setLoading(true);

    try {
      const [empresasResult, vinculosResult] = await Promise.all([
        listarEmpresas(),
        listarVinculosUsuarioEmpresa(usuario.id),
      ]);

      setEmpresas(Array.isArray(empresasResult) ? empresasResult : []);
      setVinculos(Array.isArray(vinculosResult) ? vinculosResult : []);
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.error || "Erro ao carregar vínculos."
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleEmpresa(empresaId: number) {
    if (!usuario?.id) return;

    const vinculo = vinculosMap.get(Number(empresaId));

    setUpdatingEmpresaId(empresaId);

    try {
      if (vinculo) {
        await removerVinculoUsuarioEmpresaPorUsuarioEmpresa(usuario.id, empresaId);
        toast.success("Empresa removida do usuário.");
      } else {
        await vincularUsuarioEmpresa({
          usuario_id: usuario.id,
          empresa_contratada_id: empresaId,
        });

        toast.success("Empresa vinculada ao usuário.");
      }

      await carregar();
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.error || "Erro ao atualizar vínculo."
      );
    } finally {
      setUpdatingEmpresaId(null);
    }
  }

  useEffect(() => {
    if (isOpen && usuario?.id) {
      carregar();
    }
  }, [isOpen, usuario?.id]);

  if (!isOpen || !usuario) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <div>
            <div style={modalTitleStyle}>Empresas do usuário</div>

            <div style={modalSubtitleStyle}>
              {usuario.nome} • {usuario.email}
            </div>
          </div>

          <button type="button" onClick={onClose} style={closeButtonStyle}>
            <FiX size={16} />
          </button>
        </div>

        <div style={{ padding: 18 }}>
          {loading ? (
            <div style={emptyStyle}>Carregando empresas...</div>
          ) : empresas.length === 0 ? (
            <div style={emptyStyle}>Nenhuma empresa cadastrada.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {empresas.map((empresa) => {
                const checked = vinculosMap.has(Number(empresa.id));
                const updating = updatingEmpresaId === Number(empresa.id);

                return (
                  <div
                    key={empresa.id}
                    style={{
                      ...empresaRowStyle,
                      opacity: updating ? 0.65 : 1,
                    }}
                    onClick={() => {
                      if (!updating) toggleEmpresa(Number(empresa.id));
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 900, color: "#0f172a" }}>
                        {empresa.nome_fantasia || empresa.razao_social}
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 12,
                          color: "#64748b",
                          fontWeight: 700,
                        }}
                      >
                        CNPJ: {empresa.cnpj || "-"} • Status:{" "}
                        {empresa.status || "-"}
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={updating}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleEmpresa(Number(empresa.id))}
                      style={{
                        width: 18,
                        height: 18,
                        cursor: updating ? "not-allowed" : "pointer",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div
            style={{
              marginTop: 18,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button type="button" style={buttonStyles.secondary} onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  width: 620,
  maxWidth: "95vw",
  maxHeight: "90vh",
  background: "#fff",
  borderRadius: 24,
  overflow: "hidden",
  boxShadow: "0 28px 80px rgba(15,23,42,0.35)",
};

const modalHeaderStyle: React.CSSProperties = {
  padding: "20px 22px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "#0f172a",
};

const modalSubtitleStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 13,
  color: "#64748b",
};

const closeButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#475569",
};

const empresaRowStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: "13px 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  cursor: "pointer",
  background: "#ffffff",
};

const emptyStyle: React.CSSProperties = {
  padding: 32,
  textAlign: "center",
  fontSize: 13,
  color: "#64748b",
};