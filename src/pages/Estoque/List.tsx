import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import { FiChevronLeft, FiChevronRight, FiRefreshCw } from "react-icons/fi";

type EstoqueSituacao = "OK" | "BAIXO" | "SEM_ESTOQUE";

type ProdutoInfo = {
  id: number;
  nome?: string;
  descricao?: string;
  sku?: string;
  estoque_min?: string | number | null;
  grupo?: { id: number; nome?: string };
  subgrupo?: { id: number; nome?: string };
};

type EstoqueRow = {
  id: number;
  produto_id: number;
  qtd_disponivel?: string | number | null;
  qtd_reservada?: string | number | null;
  qtd_livre?: string | number | null;
  custo_medio?: string | number | null;
  ultimo_custo?: string | number | null;
  situacao_estoque?: EstoqueSituacao;
  produto?: ProdutoInfo;
};

function pickListResponse(resData: any) {
  if (Array.isArray(resData?.data)) {
    return {
      data: resData.data,
      total: Number(resData.total ?? resData.count ?? 0) || 0,
    };
  }

  if (Array.isArray(resData?.rows)) {
    return {
      data: resData.rows,
      total: Number(resData.count ?? 0) || 0,
    };
  }

  if (Array.isArray(resData)) {
    return {
      data: resData,
      total: resData.length,
    };
  }

  return { data: [], total: 0 };
}

function toNumberAny(v: any): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  let s = String(v).trim();
  if (!s) return 0;

  s = s.replace(/\s/g, "").replace("R$", "");

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot && s.lastIndexOf(",") > s.lastIndexOf(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma && !hasDot) {
    s = s.replace(",", ".");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function formatQtyBR(v: any): string {
  const n = toNumberAny(v);
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function formatMoneyBR(v: any): string {
  const n = toNumberAny(v);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getSituacaoStyle(situacao: any) {
  const s = String(situacao || "").toUpperCase();

  if (s === "SEM_ESTOQUE") {
    return { background: "#fee2e2", color: "#991b1b" };
  }

  if (s === "BAIXO") {
    return { background: "#fef3c7", color: "#92400e" };
  }

  return { background: "#dcfce7", color: "#166534" };
}

export default function EstoqueList() {
  const [rows, setRows] = useState<EstoqueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilters = !!busca || !!situacao;

  const tdCompact: React.CSSProperties = {
    ...tableStyles.td,
    paddingTop: 8,
    paddingBottom: 8,
    lineHeight: 1.15,
    verticalAlign: "middle",
  };

  const tdRight: React.CSSProperties = {
    ...tdCompact,
    textAlign: "right",
    paddingRight: 8,
  };

  const tdCenter: React.CSSProperties = {
    ...tdCompact,
    textAlign: "center",
  };

  async function carregarEstoque() {
    setLoading(true);

    try {
      const params: any = {
        page,
        limit,
      };

      if (busca) params.busca = busca;
      if (situacao) params.situacao = situacao;

      const res = await api.get("/estoque", { params });
      const { data, total } = pickListResponse(res.data);

      setRows(data);
      setTotal(total);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar posição de estoque");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarEstoque();
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      carregarEstoque();
    }, 400);

    return () => clearTimeout(t);
  }, [busca, situacao]);

  const resumo = useMemo(() => {
    const totalProdutos = rows.length;
    const semEstoque = rows.filter(
      (r) => String(r.situacao_estoque).toUpperCase() === "SEM_ESTOQUE"
    ).length;
    const baixo = rows.filter(
      (r) => String(r.situacao_estoque).toUpperCase() === "BAIXO"
    ).length;

    return { totalProdutos, semEstoque, baixo };
  }, [rows]);

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Posição de Estoque</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {total} registro(s) encontrado(s)
          </div>
        </div>
      </div>

      <div style={layoutStyles.cardCompact}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 1fr) 220px auto",
            gap: 16,
            alignItems: "end",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Buscar produto
            </label>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, descrição ou SKU"
              style={{ ...filterStyles.input, height: 36, padding: "0 12px" }}
              disabled={loading}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Situação
            </label>
            <select
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
              style={{ ...filterStyles.select, height: 36, padding: "0 12px" }}
              disabled={loading}
            >
              <option value="">Todas</option>
              <option value="OK">OK</option>
              <option value="BAIXO">Baixo</option>
              <option value="SEM_ESTOQUE">Sem estoque</option>
            </select>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              alignItems: "center",
              minHeight: 36,
            }}
          >
            {hasFilters && (
              <button
                style={buttonStyles.link}
                onClick={() => {
                  setBusca("");
                  setSituacao("");
                  setPage(1);
                }}
                disabled={loading}
              >
                Limpar
              </button>
            )}

            <button
              style={buttonStyles.secondary ?? buttonStyles.primary}
              onClick={carregarEstoque}
              disabled={loading}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <FiRefreshCw size={16} />
                Atualizar
              </span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={layoutStyles.cardCompact}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
            Produtos exibidos
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {resumo.totalProdutos}
          </div>
        </div>

        <div style={layoutStyles.cardCompact}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
            Estoque baixo
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#92400e", marginTop: 4 }}>
            {resumo.baixo}
          </div>
        </div>

        <div style={layoutStyles.cardCompact}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
            Sem estoque
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#991b1b", marginTop: 4 }}>
            {resumo.semEstoque}
          </div>
        </div>
      </div>

      <div style={layoutStyles.card}>
        <div style={{ paddingBottom: 12, fontSize: 13, color: "#64748b" }}>
          {loading
            ? "Atualizando posição de estoque..."
            : `Exibindo ${rows.length} de ${total} registro(s)`}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ ...tableStyles.table, tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ ...tableStyles.th, width: "40%" }}>Produto</th>
                <th style={{ ...tableStyles.th, width: 110, textAlign: "right" }}>
                  Disponível
                </th>
                <th style={{ ...tableStyles.th, width: 110, textAlign: "right" }}>
                  Reservado
                </th>
                <th style={{ ...tableStyles.th, width: 110, textAlign: "right" }}>
                  Livre
                </th>
                <th style={{ ...tableStyles.th, width: 120, textAlign: "right" }}>
                  Custo médio
                </th>
                <th style={{ ...tableStyles.th, width: 120, textAlign: "right" }}>
                  Último custo
                </th>
                <th style={{ ...tableStyles.th, width: 110, textAlign: "right" }}>
                  Est. mín.
                </th>
                <th style={{ ...tableStyles.th, width: 130, textAlign: "center" }}>
                  Situação
                </th>
              </tr>
            </thead>

            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 20 }}>
                    Nenhum registro de estoque encontrado.
                  </td>
                </tr>
              )}

              {rows.map((r, index) => {
                const produtoNome =
                  r.produto?.nome || r.produto?.descricao || `Produto #${r.produto_id}`;

                const grupoNome = r.produto?.grupo?.nome;
                const subgrupoNome = r.produto?.subgrupo?.nome;

                return (
                  <tr
                    key={r.id}
                    style={{ background: index % 2 === 0 ? "#fff" : "#f9fafb" }}
                  >
                    <td
                      style={{
                        ...tdCompact,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        lineHeight: 1.25,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>
                        {produtoNome}
                      </div>

                      {(grupoNome || subgrupoNome) && (
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 12,
                            color: "#64748b",
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          {grupoNome && <span>Grupo: {grupoNome}</span>}
                          {subgrupoNome && <span>Subgrupo: {subgrupoNome}</span>}
                        </div>
                      )}

                      {r.produto?.sku && (
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
                          SKU: {r.produto.sku}
                        </div>
                      )}
                    </td>

                    <td style={tdRight}>{formatQtyBR(r.qtd_disponivel)}</td>
                    <td style={tdRight}>{formatQtyBR(r.qtd_reservada)}</td>
                    <td style={{ ...tdRight, fontWeight: 800 }}>
                      {formatQtyBR(r.qtd_livre)}
                    </td>
                    <td style={tdRight}>{formatMoneyBR(r.custo_medio)}</td>
                    <td style={tdRight}>{formatMoneyBR(r.ultimo_custo)}</td>
                    <td style={tdRight}>{formatQtyBR(r.produto?.estoque_min)}</td>

                    <td style={tdCenter}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          display: "inline-block",
                          ...getSituacaoStyle(r.situacao_estoque),
                        }}
                      >
                        {String(r.situacao_estoque || "OK").replaceAll("_", " ")}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: "center", padding: 20, color: "#64748b" }}
                  >
                    Carregando registros...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              marginTop: 16,
            }}
          >
            <button
              disabled={loading || page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              style={buttonStyles.paginationButtonStyle(loading || page === 1)}
            >
              <FiChevronLeft size={20} />
            </button>

            <span style={{ fontWeight: 600 }}>
              Página {page} de {totalPages}
            </span>

            <button
              disabled={loading || page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              style={buttonStyles.paginationButtonStyle(loading || page >= totalPages)}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}