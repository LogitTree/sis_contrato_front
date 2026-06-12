import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiPackage,
  FiPlus,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "react-toastify";

import api from "../../api/api";
import type { Produto } from "../../types/Produto";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";
import StatusBadge from "../../components/executive/StatusBadge";

import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import ProdutoEmpresasModal from "./ProdutoEmpresasModal";

export default function ProdutosList() {
  const navigate = useNavigate();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const [openEmpresasModal, setOpenEmpresasModal] = useState(false);
  const [produtoEmpresas, setProdutoEmpresas] = useState<Produto | null>(null);

  const [filtroNome, setFiltroNome] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const [orderBy, setOrderBy] = useState<"id" | "nome">("nome");
  const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("ASC");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const brl = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  function toNumberAny(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const n = Number(String(value).replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  function formatMoney(value: unknown): string {
    const n = toNumberAny(value);
    return n === null ? "-" : brl.format(n);
  }

  async function carregarProdutos() {
    setLoading(true);

    try {
      const res = await api.get("/produtos", {
        params: {
          page,
          limit,
          orderBy,
          orderDir,
          nome: filtroNome || undefined,
          ativo: filtroStatus
            ? filtroStatus === "ATIVO"
            : undefined,
        },
      });

      const data = res.data?.data ?? [];

      setProdutos(Array.isArray(data) ? data : []);
      setTotal(Number(res.data?.total) || 0);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar produtos");
      setProdutos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      carregarProdutos();
    }, 350);

    return () => clearTimeout(timer);
  }, [filtroNome, filtroStatus, orderBy, orderDir]);

  useEffect(() => {
    carregarProdutos();
  }, [page]);

  function handleSort(coluna: "id" | "nome") {
    if (orderBy === coluna) {
      setOrderDir((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setOrderBy(coluna);
      setOrderDir("ASC");
    }
  }

  function handleEmpresas(produto: Produto) {
    setProdutoEmpresas(produto);
    setOpenEmpresasModal(true);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      await api.delete(`/produtos/${id}`);
      toast.success("Produto excluído com sucesso");
      carregarProdutos();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir produto");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const resumo = useMemo(() => {
    const ativos = produtos.filter((p: any) => p.ativo === true).length;
    const inativos = produtos.filter((p: any) => p.ativo === false).length;

    return {
      pagina: produtos.length,
      ativos,
      inativos,
      total,
    };
  }, [produtos, total]);

  return (
    <PageShell>
      <PageHeader
        title="Produtos"
        subtitle="Gerencie produtos, grupos, preços de referência e vínculo com empresas."
        action={
          <button
            type="button"
            style={buttonStyles.primary}
            onClick={() => navigate("/produtos/novo")}
            disabled={loading}
          >
            <FiPlus size={15} /> Novo produto
          </button>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <SummaryCard
          label="Total"
          value={resumo.total}
          icon={<FiPackage size={18} />}
        />

        <SummaryCard
          label="Na página"
          value={resumo.pagina}
          tone="info"
          icon={<FiPackage size={18} />}
        />

        <SummaryCard
          label="Ativos"
          value={resumo.ativos}
          tone="success"
          icon={<FiPackage size={18} />}
        />

        <SummaryCard
          label="Inativos"
          value={resumo.inativos}
          tone="danger"
          icon={<FiPackage size={18} />}
        />
      </div>

      <DataCard
        title="Filtros"
        subtitle="Pesquise produtos por nome e status."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 220px auto",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label style={labelStyle}>Nome</label>
            <input
              type="text"
              placeholder="Buscar produto"
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={fieldStyle}
            >
              <option value="">Todos</option>
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>

          <button
            type="button"
            style={{
              ...buttonStyles.secondary,
              height: 40,
            }}
            onClick={() => {
              setFiltroNome("");
              setFiltroStatus("");
              setPage(1);
            }}
            disabled={loading}
          >
            <FiSearch size={15} /> Limpar
          </button>
        </div>
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Cadastro de produtos"
        subtitle={
          loading
            ? "Atualizando lista..."
            : `Exibindo ${produtos.length} de ${total} registro(s)`
        }
      >
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
          }}
        >
          <table style={{ ...tableStyles.table, tableLayout: "fixed" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                <th
                  style={{ ...thStyle, width: 70, cursor: "pointer" }}
                  onClick={() => handleSort("id")}
                >
                  ID {orderBy === "id" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>

                <th
                  style={{ ...thStyle, width: "34%", cursor: "pointer" }}
                  onClick={() => handleSort("nome")}
                >
                  Nome {orderBy === "nome" && (orderDir === "ASC" ? "▲" : "▼")}
                </th>

                <th style={{ ...thStyle, width: 70 }}>ID</th>
                <th style={{ ...thStyle, width: "46%" }}>Produto</th>
                <th style={{ ...thStyle, width: "24%" }}>Características</th>
                <th style={{ ...thStyle, width: 120, textAlign: "right" }}>Preço Ref.</th>
                <th style={{ ...thStyle, width: 120, textAlign: "right" }}>Custo Médio</th>
                <th style={{ ...thStyle, width: 90, textAlign: "center" }}>Status</th>
                <th style={{ ...thStyle, width: 150, textAlign: "right" }}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading && produtos.length === 0 ? (
                <tr>
                  <td colSpan={7} style={emptyStyle}>
                    Carregando produtos...
                  </td>
                </tr>
              ) : produtos.length === 0 ? (
                <tr>
                  <td colSpan={7} style={emptyStyle}>
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                produtos.map((p, index) => (
                  <tr
                    key={p.id}
                    style={{
                      background: index % 2 === 0 ? "#fff" : "#f9fafb",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <td style={tdStyle}>{p.id}</td>

                    <td style={tdStyle}>
                      <strong style={{ color: "#0f172a" }}>{p.nome}</strong>
                    </td>

                    <td style={tdStyle}>
                      <div>
                        <span style={mutedStyle}>Grupo: </span>
                        {p.grupo?.nome || "-"}
                      </div>

                      <div style={{ marginTop: 2 }}>
                        <span style={mutedStyle}>Subgrupo: </span>
                        {p.subgrupo?.nome || "-"}
                      </div>

                      <div style={{ marginTop: 2 }}>
                        <span style={mutedStyle}>Unidade: </span>
                        {p.unidade || "-"}
                      </div>
                    </td>


                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {formatMoney((p as any).preco_referencia)}
                    </td>

                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {formatMoney((p as any).custo_medio)}
                    </td>

                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <StatusBadge
                        status={(p as any).ativo ? "ATIVO" : "INATIVO"}
                      />
                    </td>

                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          style={buttonStyles.icon}
                          onClick={() => handleEmpresas(p)}
                          disabled={loading}
                          title="Empresas"
                        >
                          <FiBriefcase size={18} color="#0f766e" />
                        </button>

                        <button
                          style={buttonStyles.icon}
                          onClick={() => navigate(`/produtos/${p.id}/editar`)}
                          disabled={loading}
                          title="Editar"
                        >
                          <FiEdit size={18} color="#2563eb" />
                        </button>

                        <button
                          style={buttonStyles.icon}
                          onClick={() => handleDelete(p.id)}
                          disabled={loading}
                          title="Excluir"
                        >
                          <FiTrash2 size={18} color="#dc2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button
              disabled={loading || page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              style={buttonStyles.paginationButtonStyle(loading || page === 1)}
            >
              <FiChevronLeft size={20} />
            </button>

            <span style={{ fontWeight: 700, color: "#334155" }}>
              Página {page} de {totalPages}
            </span>

            <button
              disabled={loading || page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              style={buttonStyles.paginationButtonStyle(
                loading || page >= totalPages
              )}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </DataCard>

      <ProdutoEmpresasModal
        isOpen={openEmpresasModal}
        produto={produtoEmpresas}
        onClose={() => {
          setOpenEmpresasModal(false);
          setProdutoEmpresas(null);
        }}
      />
    </PageShell>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 800,
  color: "#374151",
  marginBottom: 6,
};

const fieldStyle: React.CSSProperties = {
  ...filterStyles.input,
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  height: 40,
};

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "#64748b",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 13,
  color: "#334155",
  verticalAlign: "middle",
};

const mutedStyle: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: 12,
};

const emptyStyle: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontSize: 13,
  color: "#64748b",
};