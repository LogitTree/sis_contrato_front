import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FiX } from "react-icons/fi";

import api from "../../api/api";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";
import type { Produto } from "../../types/Produto";

import {
    atualizarProdutoEmpresa,
    listarEmpresasProduto,
    removerProdutoEmpresaPorProdutoEmpresa,
    vincularProdutoEmpresa,
    type ProdutoEmpresaVinculo,
} from "../../services/produto/produtoEmpresaService";

type Props = {
    isOpen: boolean;
    produto: Produto | null;
    onClose: () => void;
};

export default function ProdutoEmpresasModal({
    isOpen,
    produto,
    onClose,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [empresas, setEmpresas] = useState<any[]>([]);
    const [vinculos, setVinculos] = useState<ProdutoEmpresaVinculo[]>([]);
    const [precos, setPrecos] = useState<Record<number, string>>({});
    const [updatingEmpresaId, setUpdatingEmpresaId] = useState<number | null>(null);

    const vinculosMap = useMemo(() => {
        const map = new Map<number, ProdutoEmpresaVinculo>();

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
        if (!produto?.id) return;

        setLoading(true);

        try {
            const [empresasResponse, vinculosResult] = await Promise.all([
                api.get("/empresas", { params: { limit: 1000 } }),
                listarEmpresasProduto(Number(produto.id)),
            ]);

            const empresasRows = Array.isArray(empresasResponse.data)
                ? empresasResponse.data
                : empresasResponse.data?.data || empresasResponse.data?.rows || [];

            setEmpresas(empresasRows);
            setVinculos(Array.isArray(vinculosResult) ? vinculosResult : []);

            const nextPrecos: Record<number, string> = {};

            vinculosResult.forEach((vinculo: any) => {
                const empresaId =
                    vinculo.empresa_contratada_id ||
                    vinculo.empresaContratadaId ||
                    vinculo.empresa?.id;

                if (empresaId) {
                    nextPrecos[Number(empresaId)] =
                        vinculo.preco_venda !== null && vinculo.preco_venda !== undefined
                            ? String(vinculo.preco_venda)
                            : "";
                }
            });

            setPrecos(nextPrecos);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.error || "Erro ao carregar vínculos.");
        } finally {
            setLoading(false);
        }
    }

    async function toggleEmpresa(empresaId: number) {
        if (!produto?.id) return;

        const vinculo = vinculosMap.get(Number(empresaId));

        setUpdatingEmpresaId(empresaId);

        try {
            if (vinculo) {
                await removerProdutoEmpresaPorProdutoEmpresa(Number(produto.id), empresaId);
                toast.success("Empresa removida do produto.");
            } else {
                await vincularProdutoEmpresa({
                    produto_id: Number(produto.id),
                    empresa_contratada_id: empresaId,
                    preco_venda: precos[empresaId] || null,
                    ativo: true,
                });

                toast.success("Empresa vinculada ao produto.");
            }

            await carregar();
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.error || "Erro ao atualizar vínculo.");
        } finally {
            setUpdatingEmpresaId(null);
        }
    }

    async function salvarPreco(empresaId: number) {
        const vinculo = vinculosMap.get(Number(empresaId));

        if (!vinculo?.id) {
            toast.warning("Vincule a empresa antes de salvar o preço.");
            return;
        }

        setUpdatingEmpresaId(empresaId);

        try {
            await atualizarProdutoEmpresa(vinculo.id, {
                preco_venda: precos[empresaId] || null,
            });

            toast.success("Preço atualizado.");
            await carregar();
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.error || "Erro ao salvar preço.");
        } finally {
            setUpdatingEmpresaId(null);
        }
    }

    useEffect(() => {
        if (isOpen && produto?.id) {
            carregar();
        }
    }, [isOpen, produto?.id]);

    if (!isOpen || !produto) return null;

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={modalHeaderStyle}>
                    <div>
                        <div style={modalTitleStyle}>Empresas do produto</div>
                        <div style={modalSubtitleStyle}>{produto.nome}</div>
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
                                const empresaId = Number(empresa.id);
                                const vinculo = vinculosMap.get(empresaId);
                                const checked = !!vinculo;
                                const updating = updatingEmpresaId === empresaId;

                                return (
                                    <div
                                        key={empresa.id}
                                        style={{
                                            ...empresaRowStyle,
                                            opacity: updating ? 0.65 : 1,
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 900, color: "#0f172a" }}>
                                                {empresa.nome_fantasia || empresa.razao_social}
                                            </div>

                                            <div style={{ marginTop: 3, fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                                                CNPJ: {empresa.cnpj || "-"} • Status: {empresa.status || "-"}
                                            </div>
                                        </div>

                                        <input
                                            placeholder="Preço venda"
                                            value={precos[empresaId] || ""}
                                            disabled={!checked || updating}
                                            onChange={(e) =>
                                                setPrecos((prev) => ({
                                                    ...prev,
                                                    [empresaId]: e.target.value,
                                                }))
                                            }
                                            style={{
                                                ...filterStyles.input,
                                                width: 120,
                                                height: 36,
                                                textAlign: "right",
                                            }}
                                        />

                                        <button
                                            type="button"
                                            style={buttonStyles.secondary}
                                            disabled={!checked || updating}
                                            onClick={() => salvarPreco(empresaId)}
                                        >
                                            Salvar
                                        </button>

                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={updating}
                                            onChange={() => toggleEmpresa(empresaId)}
                                            style={{ width: 18, height: 18 }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
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
    width: 760,
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
    background: "#ffffff",
};

const emptyStyle: React.CSSProperties = {
    padding: 32,
    textAlign: "center",
    fontSize: 13,
    color: "#64748b",
};