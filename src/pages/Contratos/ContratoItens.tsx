import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { badgeStyles } from "../../styles/badges";

import { toast } from "react-toastify";
import { FiTrash2 } from "react-icons/fi";
import { numeroBR } from "../../utils/format";

import ModalAdicionarItem from "./ModalAdicionarItem";

/* =========================
   TIPOS
========================= */
type Produto = {
  id: number;
  nome: string;
};

type ContratoItem = {
  id: number;
  unidade_contratada: string;
  fator_multiplicacao: number;
  preco_unitario_contratado: number;
  qtd_maxima_contratada: number;
  valor_maximo_contratado: number;
  produto?: Produto;
};

type Contrato = {
  id: number;
  numero: string;
  status: string;
  orgao?: { nome: string };
  empresa?: { nome_fantasia?: string; razao_social?: string };
  itens: ContratoItem[];
};

/* =========================
   UTIL
========================= */
function moedaBR(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* =========================
   Component
========================= */
export default function ContratoItens() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function carregarItens() {
    try {
      const res = await api.get(`/contratos/${id}`);
      setContrato(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar itens do contrato");
    }
  }

  async function removerItem(itemId: number) {
    const confirmar = window.confirm(
      "Tem certeza que deseja remover este item do contrato?"
    );
    if (!confirmar) return;

    try {
      await api.delete(`/contratos/${id}/itens/${itemId}`);
      toast.success("Item removido com sucesso");
      carregarItens();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover item do contrato");
    }
  }

  useEffect(() => {
    async function load() {
      try {
        await carregarItens();
      } catch {
        navigate("/contratos");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, navigate]);

  const totalContrato = useMemo(() => {
    if (!contrato) return 0;
    return contrato.itens.reduce((acc, item) => {
      return (
        acc +
        Number(item.preco_unitario_contratado) * Number(item.qtd_maxima_contratada)
      );
    }, 0);
  }, [contrato]);

  if (loading) {
    return (
      <div style={layoutStyles.page}>
        <div style={layoutStyles.header}>
          <h1 style={layoutStyles.title}>Itens do Contrato</h1>
        </div>

        <div style={layoutStyles.card}>
          <p style={{ color: "#0f172a" }}>Carregando itens do contrato...</p>
        </div>
      </div>
    );
  }

  if (!contrato) return null;

  const empresaLabel =
    contrato.empresa?.nome_fantasia || contrato.empresa?.razao_social || "—";

  return (
    <div style={layoutStyles.page}>
      {/* ===== HEADER PADRÃO ===== */}
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Itens do Contrato</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>
            Contrato Nº <strong style={{ color: "#0f172a" }}>{contrato.numero}</strong>{" "}
            • Órgão: <strong style={{ color: "#0f172a" }}>{contrato.orgao?.nome ?? "—"}</strong>{" "}
            • Empresa: <strong style={{ color: "#0f172a" }}>{empresaLabel}</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span
            style={{
              ...badgeStyles.base,
              ...(contrato.status === "ATIVO"
                ? badgeStyles.success
                : badgeStyles.warning),
            }}
          >
            {contrato.status}
          </span>

          <button style={buttonStyles.primary} onClick={() => setModalOpen(true)}>
            + Adicionar Item
          </button>

          <button style={buttonStyles.link} onClick={() => navigate("/contratos")}>
            Voltar
          </button>
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {modalOpen && (
        <ModalAdicionarItem
          contratoId={Number(id)}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            carregarItens();
          }}
        />
      )}

      {/* ===== TABELA ===== */}
      <div style={layoutStyles.card}>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={{ ...tableStyles.th, width: "34%" }}>Produto</th>
              <th style={{ ...tableStyles.th, width: "10%" }}>Unidade</th>
              <th style={{ ...tableStyles.th, width: "12%" }}>Fator</th>
              <th style={{ ...tableStyles.th, width: "14%" }}>Preço (Contrato)</th>
              <th style={{ ...tableStyles.th, width: "18%" }}>Qtd Contratada</th>
              <th style={{ ...tableStyles.th, width: "12%" }}>Total</th>
              <th style={{ ...tableStyles.th, width: "6%" }}></th>
            </tr>
          </thead>

          <tbody>
            {contrato.itens.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    ...tableStyles.td,
                    textAlign: "center",
                    padding: 20,
                    color: "#0f172a",
                  }}
                >
                  Nenhum item cadastrado para este contrato.
                </td>
              </tr>
            )}

            {contrato.itens.map((item) => {
              const totalItem =
                Number(item.preco_unitario_contratado) *
                Number(item.qtd_maxima_contratada);

              const totalEstoque =
                Number(item.qtd_maxima_contratada) *
                Number(item.fator_multiplicacao);

              return (
                <tr key={item.id}>
                  <td style={tableStyles.td}>{item.produto?.nome ?? "—"}</td>

                  <td style={tableStyles.td}>{item.unidade_contratada}</td>

                  <td style={tableStyles.td}>
                    <strong>{numeroBR(item.fator_multiplicacao, 0)}</strong>
                    <span style={{ opacity: 0.6 }}> × estoque</span>
                  </td>

                  <td style={tableStyles.td}>
                    {moedaBR(Number(item.preco_unitario_contratado))}
                  </td>

                  <td style={tableStyles.td}>
                    <div>
                      {numeroBR(item.qtd_maxima_contratada, 3)}{" "}
                      {item.unidade_contratada}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                      = {numeroBR(totalEstoque, 0)} UN estoque
                    </div>
                  </td>

                  <td style={tableStyles.td}>{moedaBR(totalItem)}</td>

                  <td style={tableStyles.td}>
                    <button
                      style={{ ...buttonStyles.icon, color: "#dc2626" }}
                      title="Remover item do contrato"
                      onClick={() => removerItem(item.id)}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ===== TOTAL ===== */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid #e5e7eb",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 14, color: "#64748b", fontWeight: 700 }}>
            Total do Contrato
          </span>

          <span style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>
            {moedaBR(totalContrato)}
          </span>
        </div>
      </div>
    </div>
  );
}