import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import type { Contrato } from "../../types/Contrato";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { badgeStyles } from "../../styles/badges";
import { filterStyles } from "../../styles/filters";

import { FiEdit, FiTrash2, FiList, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { formatarDataBR } from "../../utils/masks";
import { toast } from "react-toastify";

export default function ContratosList() {
  const navigate = useNavigate();

  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔢 Paginação
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // 🔍 Filtros
  const [filtroNumero, setFiltroNumero] = useState("");
  const [filtroOrgao, setFiltroOrgao] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  // debounce
  const [debNumero, setDebNumero] = useState("");
  const [debOrgao, setDebOrgao] = useState("");
  const [debStatus, setDebStatus] = useState("");

  // (opcional) ordenar
  const [orderBy] = useState<"numero" | "data_inicio" | "data_fim" | "status">("data_inicio");
  const [orderDir] = useState<"ASC" | "DESC">("DESC");

  async function carregarContratos() {
    setLoading(true);

    const params: any = {
      page,
      limit,
      orderBy,
      orderDir,
    };

    // se seu backend já suporta filtros, mantém assim:
    if (debNumero) params.numero = debNumero;
    if (debOrgao) params.orgao = debOrgao; // ou orgao_nome (depende da sua API)
    if (debStatus) params.status = debStatus;

    try {
      const res = await api.get("/contratos", { params });

      // ✅ padrões diferentes de resposta
      const data = res.data?.data ?? res.data ?? [];
      setContratos(Array.isArray(data) ? data : []);

      const totalApi =
        res.data?.total ??
        res.data?.meta?.total ??
        res.data?.count ??
        0;

      setTotal(Number(totalApi) || 0);
    } catch {
      toast.error("Erro ao carregar contratos");
      setContratos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarContratos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debNumero, debOrgao, debStatus, orderBy, orderDir]);

  // debounce filtros
  useEffect(() => {
    const t = setTimeout(() => {
      setDebNumero(filtroNumero.trim());
      setDebOrgao(filtroOrgao.trim());
      setDebStatus(filtroStatus);
      setPage(1);
    }, 400);

    return () => clearTimeout(t);
  }, [filtroNumero, filtroOrgao, filtroStatus]);

  async function excluirContrato(contratoId: number) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este contrato? Essa ação não poderá ser desfeita."
    );
    if (!confirmar) return;

    try {
      await api.delete(`/contratos/${contratoId}`);
      toast.success("Contrato excluído com sucesso");

      // 🔁 recarrega a página atual (ou volta pra 1 se esvaziar)
      carregarContratos();
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.warning("Não é possível excluir este contrato pois ele possui itens vinculados.");
      } else {
        toast.error("Erro ao excluir contrato");
      }
    }
  }

  const totalPages = useMemo(() => {
    const safeTotal = Number.isFinite(total) && total > 0 ? total : contratos.length;
    return Math.max(1, Math.ceil(safeTotal / limit));
  }, [total, contratos.length, limit]);

  const statusBadge = (status?: string | null) => {
    const s = (status ?? "").toUpperCase();

    if (s === "ATIVO") return { ...badgeStyles.base, ...badgeStyles.success };
    if (s === "SUSPENSO") return { ...badgeStyles.base, ...badgeStyles.warning };
    if (s === "ENCERRADO") return { ...badgeStyles.base, ...badgeStyles.danger };

    return badgeStyles.base;
  };

  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Contratos</h1>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            {total || contratos.length} registro(s)
          </div>

          <button style={buttonStyles.primary} onClick={() => navigate("/contratos/novo")}>
            + Novo Contrato
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div style={layoutStyles.cardCompact}>
        <div style={filterStyles.container}>
          <span style={filterStyles.title}>Filtros</span>

          <div
            style={{
              ...filterStyles.row,
              gridTemplateColumns: "1fr 1fr 220px", // 🔥 2 inputs + select fixo
            }}
          >
            <input
              value={filtroNumero}
              onChange={(e) => setFiltroNumero(e.target.value)}
              style={filterStyles.input}
              placeholder="Número (ex: 001/2025)"
            />

            <input
              value={filtroOrgao}
              onChange={(e) => setFiltroOrgao(e.target.value)}
              style={filterStyles.input}
              placeholder="Órgão (nome)"
            />

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={filterStyles.select}
            >
              <option value="">Todos</option>
              <option value="ATIVO">Ativo</option>
              <option value="SUSPENSO">Suspenso</option>
              <option value="ENCERRADO">Encerrado</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <button
              type="button"
              style={buttonStyles.link}
              onClick={() => {
                setFiltroNumero("");
                setFiltroOrgao("");
                setFiltroStatus("");
              }}
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div style={layoutStyles.card}>
        <div style={{ paddingBottom: 12, fontSize: 13, color: "#64748b" }}>
          {loading ? "Carregando..." : `Exibindo ${contratos.length} registro(s)`}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ ...tableStyles.table, tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ ...tableStyles.th, width: 130 }}>Nº</th>
                <th style={{ ...tableStyles.th, width: "36%" }}>Órgão</th>
                <th style={{ ...tableStyles.th, width: 130, textAlign: "center" }}>Início</th>
                <th style={{ ...tableStyles.th, width: 130, textAlign: "center" }}>Fim</th>
                <th style={{ ...tableStyles.th, width: 130, textAlign: "center" }}>Status</th>
                <th style={{ ...tableStyles.th, width: 140, textAlign: "center" }}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {!loading && contratos.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                    Nenhum contrato encontrado.
                  </td>
                </tr>
              )}

              {contratos.map((c, index) => (
                <tr key={c.id} style={{ background: index % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={tableStyles.td}>{c.numero}</td>

                  <td
                    style={{
                      ...tableStyles.td,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      lineHeight: 1.35,
                    }}
                    title={c.orgao?.nome}
                  >
                    {c.orgao?.nome || "—"}
                  </td>

                  <td style={{ ...tableStyles.td, textAlign: "center" }}>
                    {formatarDataBR(c.data_inicio)}
                  </td>

                  <td style={{ ...tableStyles.td, textAlign: "center" }}>
                    {formatarDataBR(c.data_fim)}
                  </td>

                  <td style={{ ...tableStyles.td, textAlign: "center" }}>
                    <span style={statusBadge(c.status)}>{c.status ?? "—"}</span>
                  </td>

                  <td style={{ ...tableStyles.td, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button
                        style={buttonStyles.icon}
                        onClick={() => navigate(`/contratos/${c.id}/editar`)}
                        title="Editar"
                      >
                        <FiEdit size={18} color="#2563eb" />
                      </button>

                      <button
                        style={buttonStyles.icon}
                        onClick={() => excluirContrato(c.id)}
                        title="Excluir"
                      >
                        <FiTrash2 size={18} color="#dc2626" />
                      </button>

                      <button
                        style={buttonStyles.icon}
                        onClick={() => navigate(`/contratos/${c.id}/itens`)}
                        title="Itens do contrato"
                      >
                        <FiList size={18} color="#111827" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
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
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              style={buttonStyles.paginationButtonStyle(page === 1)}
            >
              <FiChevronLeft size={20} />
            </button>

            <span style={{ fontWeight: 600, color: "#0f172a" }}>
              Página {page} de {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={buttonStyles.paginationButtonStyle(page >= totalPages)}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}