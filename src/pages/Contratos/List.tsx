import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import type { Contrato } from "../../types/Contrato";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { badgeStyles } from "../../styles/badges";
import { filterStyles } from "../../styles/filters";
import { fieldFocusHandlers } from "../../styles/focus";

import { FiEdit, FiTrash2, FiList, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { formatarDataBR } from "../../utils/masks";
import { toast } from "react-toastify";

export default function ContratosList() {
  const navigate = useNavigate();

  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);

  // paginação
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // filtros
  const [filtroNumero, setFiltroNumero] = useState("");
  const [filtroOrgao, setFiltroOrgao] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  // debounce
  const [debNumero, setDebNumero] = useState("");
  const [debOrgao, setDebOrgao] = useState("");
  const [debStatus, setDebStatus] = useState("");

  // ordenação (mantida como estava)
  const [orderBy] = useState<"numero" | "data_inicio" | "data_fim" | "status">("data_inicio");
  const [orderDir] = useState<"ASC" | "DESC">("DESC");

  const safeTotal = Number.isFinite(total) && total > 0 ? total : contratos.length;

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(safeTotal / limit));
  }, [safeTotal, limit]);

  const statusBadge = (status?: string | null) => {
    const s = (status ?? "").toUpperCase();

    if (s === "ATIVO") return { ...badgeStyles.base, ...badgeStyles.success };
    if (s === "SUSPENSO") return { ...badgeStyles.base, ...badgeStyles.warning };
    if (s === "ENCERRADO") return { ...badgeStyles.base, ...badgeStyles.danger };

    return badgeStyles.base;
  };

  async function carregarContratos() {
    setLoading(true);

    const numero = debNumero.trim();
    const orgaoRaw = debOrgao.trim();
    const status = debStatus.trim();

    // 🔥 normaliza ordenação (evita mandar campo que o backend não reconhece)
    const orderByMap: Record<string, string> = {
      numero: "numero",
      data_inicio: "data_inicio",
      data_fim: "data_fim",
      status: "status",
    };

    const params: any = {
      page,
      limit,
      orderBy: orderByMap[orderBy] ?? "data_inicio",
      orderDir,
    };

    // ✅ filtro por número do contrato
    if (numero) {
      params.numero = numero;
      params.q = numero;            // caso o backend use busca única
      params.search = numero;       // variação comum
      params.numero_like = `%${numero}%`; // se o backend usar *_like
    }

    // ✅ filtro por órgão (aceita ID ou nome)
    if (orgaoRaw) {
      const onlyDigits = orgaoRaw.replace(/\D/g, "");
      const isId = onlyDigits.length > 0 && onlyDigits === orgaoRaw; // digitou só número

      if (isId) {
        params.orgao_id = Number(orgaoRaw);
        params.orgaoId = Number(orgaoRaw);
      } else {
        params.orgao = orgaoRaw;
        params.orgao_nome = orgaoRaw;
        params.orgaoNome = orgaoRaw;
        params.orgao_like = `%${orgaoRaw}%`;
        params.search = params.search ?? orgaoRaw;
      }
    }

    // ✅ status do contrato
    if (status) {
      params.status = status;
    }

    try {
      const res = await api.get("/contratos", { params });

      // ✅ DEBUG: veja no console se está indo certo
      console.log("GET /contratos params =>", res.config.params);

      const data = res.data?.data ?? res.data ?? [];
      setContratos(Array.isArray(data) ? data : []);

      const totalApi = res.data?.total ?? res.data?.meta?.total ?? res.data?.count ?? 0;
      setTotal(Number(totalApi) || 0);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar contratos");
      setContratos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  // debounce filtros
  useEffect(() => {
    const t = setTimeout(() => {
      setDebNumero(filtroNumero.trim());
      setDebOrgao(filtroOrgao.trim());
      setDebStatus(filtroStatus);
    }, 450);

    return () => clearTimeout(t);
  }, [filtroNumero, filtroOrgao, filtroStatus]);

  // reset de página ao mudar filtros
  useEffect(() => setPage(1), [debNumero, debOrgao, debStatus]);

  // buscar ao mudar filtros/paginação
  useEffect(() => {
    carregarContratos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debNumero, debOrgao, debStatus, orderBy, orderDir]);

  async function excluirContrato(contratoId: number) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este contrato? Essa ação não poderá ser desfeita."
    );
    if (!confirmar) return;

    try {
      await api.delete(`/contratos/${contratoId}`);
      toast.success("Contrato excluído com sucesso");
      carregarContratos();
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.warning("Não é possível excluir este contrato pois ele possui itens vinculados.");
      } else {
        toast.error("Erro ao excluir contrato");
      }
    }
  }

  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Contratos</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {loading ? "Carregando..." : `${safeTotal} registro(s) encontrado(s)`}
          </div>
        </div>
      </div>

      {/* FILTROS (card separado - padrão empresas) */}
      <div style={layoutStyles.cardCompact}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 16,
            width: "100%",
            flexWrap: "wrap",        // ✅ permite quebrar linha
            rowGap: 12,              // ✅ espaço quando quebrar
          }}
        >
          {/* Número */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 260 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Número do Contrato
            </label>
            <input
              value={filtroNumero}
              onChange={(e) => setFiltroNumero(e.target.value)}
              placeholder="Ex: 001/2025"
              style={{ ...filterStyles.input, width: "100%", boxSizing: "border-box" }}
            />
          </div>

          {/* Órgão */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 260 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Órgão
            </label>
            <input
              value={filtroOrgao}
              onChange={(e) => setFiltroOrgao(e.target.value)}
              placeholder="Nome do órgão"
              style={{ ...filterStyles.input, width: "100%", boxSizing: "border-box" }}
            />
          </div>

          {/* Status */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220, minWidth: 220 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Status
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={{ ...filterStyles.select, width: "100%", boxSizing: "border-box" }}
            >
              <option value="">Todos</option>
              <option value="ATIVO">Ativo</option>
              <option value="SUSPENSO">Suspenso</option>
              <option value="ENCERRADO">Encerrado</option>
            </select>
          </div>

          {(filtroNumero || filtroOrgao || filtroStatus) && (
            <button
              style={{ ...buttonStyles.link, marginBottom: 2 }}
              onClick={() => {
                setFiltroNumero("");
                setFiltroOrgao("");
                setFiltroStatus("");

                // ✅ zera os debounced também (evita ficar “preso” até o timeout)
                setDebNumero("");
                setDebOrgao("");
                setDebStatus("");

                setPage(1);
              }}
              disabled={loading}
              title="Limpar filtros"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* BOTÕES ABAIXO DO FILTRO (padrão empresas) */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, margin: "12px 0 16px" }}>
        <button style={buttonStyles.link} onClick={() => navigate(-1)} disabled={loading}>
          Voltar
        </button>

        <button style={buttonStyles.primary} onClick={() => navigate("/contratos/novo")} disabled={loading}>
          + Novo Contrato
        </button>
      </div>

      {/* TABELA */}
      <div style={layoutStyles.card}>
        <div style={{ paddingBottom: 12, fontSize: 13, color: "#64748b" }}>
          {loading ? "Atualizando lista..." : `Exibindo ${contratos.length} de ${safeTotal} registro(s)`}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ ...tableStyles.table, tableLayout: "fixed" }}>
            <thead style={tableStyles.thead}>
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
                <tr key={c.id} style={tableStyles.row(index)}>
                  <td style={tableStyles.td}>{c.numero}</td>

                  <td
                    style={{
                      ...tableStyles.td,
                      ...tableStyles.tdWrap,
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
                        onMouseEnter={(ev) => (ev.currentTarget.style.background = "rgba(37,99,235,0.08)")}
                        onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                      >
                        <FiEdit size={18} color="#2563eb" />
                      </button>

                      <button
                        style={buttonStyles.icon}
                        onClick={() => excluirContrato(c.id)}
                        title="Excluir"
                        onMouseEnter={(ev) => (ev.currentTarget.style.background = "rgba(220,38,38,0.08)")}
                        onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                      >
                        <FiTrash2 size={18} color="#dc2626" />
                      </button>

                      <button
                        style={buttonStyles.icon}
                        onClick={() => navigate(`/contratos/${c.id}/itens`)}
                        title="Itens do contrato"
                        onMouseEnter={(ev) => (ev.currentTarget.style.background = "rgba(15,23,42,0.06)")}
                        onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                      >
                        <FiList size={18} color="#111827" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {loading && contratos.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                    Carregando registros...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              style={buttonStyles.paginationButtonStyle(page === 1)}
            >
              <FiChevronLeft size={20} />
            </button>

            <span style={{ fontWeight: 600, minWidth: 90, textAlign: "center" }}>
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