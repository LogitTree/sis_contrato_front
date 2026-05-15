import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCornerUpLeft,
  FiEdit,
  FiFileText,
  FiLock,
  FiSend,
  FiTrash2,
  FiXCircle,
  FiTruck
} from "react-icons/fi";

import PageShell from "../../components/executive/PageShell";
import PageHeader from "../../components/executive/PageHeader";
import SummaryCard from "../../components/executive/SummaryCard";
import DataCard from "../../components/executive/DataCard";

import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import { usePedidoVendaList } from "./hooks/usePedidoVendaList";

function toNumberSafe(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  if (typeof v === "string") {
    const n = Number(v.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  return 0;
}

function formatMoneyBR(v: any): string {
  return toNumberSafe(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateBR(value: any): string {
  if (!value) return "-";

  const s = String(value).slice(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }

  return "-";
}

function calcTotal(row: any) {
  if (row?.total !== undefined && row?.total !== null) {
    return toNumberSafe(row.total);
  }

  const itens =
    row?.itens ??
    row?.PedidoVendaItems ??
    row?.pedidoItens ??
    row?.pedido_itens ??
    row?.items ??
    [];

  if (!Array.isArray(itens)) return 0;

  return itens.reduce((acc, item) => {
    return acc + toNumberSafe(item?.qtd) * toNumberSafe(item?.preco_unitario);
  }, 0);
}

function getStatusVisual(row: any) {
  const statusBase = String(row?.status || "").toUpperCase();

  const totalExpedido = toNumberSafe(row?.total_expedido);
  const totalDevolvido = toNumberSafe(row?.total_devolvido);

  if (totalExpedido > 0 && totalDevolvido >= totalExpedido) {
    return "DEVOLVIDO";
  }

  if (totalDevolvido > 0 && totalDevolvido < totalExpedido) {
    return "PARCIALMENTE_DEVOLVIDO";
  }

  return statusBase || "-";
}

function statusStyle(status: string): React.CSSProperties {
  const s = String(status || "").toUpperCase();

  if (s === "RASCUNHO") {
    return { background: "#f1f5f9", color: "#475569" };
  }

  if (s === "APROVADO") {
    return { background: "#dbeafe", color: "#1d4ed8" };
  }

  if (s === "PARCIALMENTE_ATENDIDO") {
    return { background: "#e0f2fe", color: "#075985" };
  }

  if (s === "ATENDIDO" || s === "CONCLUIDO" || s === "CONCLUÍDO") {
    return { background: "#dcfce7", color: "#166534" };
  }

  if (s === "CANCELADO") {
    return { background: "#fee2e2", color: "#991b1b" };
  }

  if (s === "DEVOLVIDO") {
    return { background: "#fef3c7", color: "#92400e" };
  }

  if (s === "PARCIALMENTE_DEVOLVIDO") {
    return { background: "#ffedd5", color: "#9a3412" };
  }

  return { background: "#f8fafc", color: "#475569" };
}

function flowPerms(status?: string) {
  const s = String(status || "").toUpperCase();

  return {
    canEditHeader: s === "RASCUNHO",

    canOpen:
      s === "RASCUNHO" ||
      s === "APROVADO" ||
      s === "PARCIALMENTE_ATENDIDO" ||
      s === "ATENDIDO" ||
      s === "CONCLUIDO" ||
      s === "CONCLUÍDO" ||
      s === "PARCIALMENTE_DEVOLVIDO" ||
      s === "DEVOLVIDO",

    canAprovar:
      s === "RASCUNHO" || s === "APROVADO" || s === "PARCIALMENTE_ATENDIDO",

    canConcluir: s === "ATENDIDO",

    canCancelar:
      s === "RASCUNHO" || s === "APROVADO" || s === "PARCIALMENTE_ATENDIDO",

    canDevolver:
      s === "PARCIALMENTE_ATENDIDO" ||
      s === "ATENDIDO" ||
      s === "CONCLUIDO" ||
      s === "CONCLUÍDO" ||
      s === "PARCIALMENTE_DEVOLVIDO",
  };
}

function statusLabel(status: string) {
  return String(status || "-").replaceAll("_", " ");
}

export default function PedidoVendaList() {
  const navigate = useNavigate();

  const {
    rows,
    loading,
    total,
    page,
    setPage,
    limit,
    filtros,
    ordenacao,
    combos,
    actions,
  } = usePedidoVendaList();

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const resumo = useMemo(() => {
    const totalGeral = rows.reduce((acc, row) => acc + calcTotal(row), 0);

    return {
      totalPedidos: total,
      naPagina: rows.length,
      totalGeral,
      aprovados: rows.filter((row) =>
        ["APROVADO", "ATENDIDO", "CONCLUIDO", "CONCLUÍDO"].includes(
          String(row.status).toUpperCase()
        )
      ).length,
    };
  }, [rows, total]);

  function sortLabel(coluna: string) {
    if (ordenacao.orderBy !== coluna) return "";
    return ordenacao.orderDir === "ASC" ? " ↑" : " ↓";
  }

  return (
    <PageShell>
      <PageHeader
        title="Pedidos de Venda"
        subtitle="Gerencie vendas, aprovações, expedições, devoluções e relatórios operacionais."
        action={
          <button
            type="button"
            style={buttonStyles.primary}
            onClick={() => navigate("/pedidosvenda/novo")}
          >
            Novo pedido
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
        <SummaryCard label="Total de pedidos" value={resumo.totalPedidos} />
        <SummaryCard label="Nesta página" value={resumo.naPagina} />
        <SummaryCard
          label="Aprovados/atendidos"
          value={resumo.aprovados}
          tone="success"
        />
        <SummaryCard
          label="Total estimado"
          value={formatMoneyBR(resumo.totalGeral)}
          tone="info"
        />
      </div>

      <DataCard
        title="Filtros"
        subtitle="Refine a listagem por contrato, empresa, status e período."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label style={labelStyle}>Contrato</label>
            <select
              value={filtros.filtroContratoId}
              onChange={(e) => {
                filtros.setFiltroContratoId(e.target.value);
                setPage(1);
              }}
              style={{ ...filterStyles.select, width: "100%" }}
            >
              <option value="">Todos</option>
              {combos.contratosOptions.map((contrato) => (
                <option key={contrato.id} value={contrato.id}>
                  {contrato.numero}
                  {contrato.orgaoNome ? ` - ${contrato.orgaoNome}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Empresa</label>
            <select
              value={filtros.filtroEmpresaId}
              onChange={(e) => {
                filtros.setFiltroEmpresaId(e.target.value);
                setPage(1);
              }}
              style={{ ...filterStyles.select, width: "100%" }}
            >
              <option value="">Todas</option>
              {combos.empresasOptions.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={filtros.filtroStatus}
              onChange={(e) => {
                filtros.setFiltroStatus(e.target.value);
                setPage(1);
              }}
              style={{ ...filterStyles.select, width: "100%" }}
            >
              <option value="">Todos</option>
              <option value="RASCUNHO">Rascunho</option>
              <option value="APROVADO">Aprovado</option>
              <option value="PARCIALMENTE_ATENDIDO">Parcialmente atendido</option>
              <option value="ATENDIDO">Atendido</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="DEVOLVIDO">Devolvido</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Início</label>
            <input
              type="date"
              value={filtros.filtroDataInicio}
              onChange={(e) => {
                filtros.setFiltroDataInicio(e.target.value);
                setPage(1);
              }}
              style={{
                ...filterStyles.input,
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                height: 40,
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Fim</label>
            <input
              type="date"
              value={filtros.filtroDataFim}
              onChange={(e) => {
                filtros.setFiltroDataFim(e.target.value);
                setPage(1);
              }}
              style={{
                ...filterStyles.input,
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                height: 40,
              }}
            />
          </div>

          <div>
            <button
              type="button"
              style={{
                ...buttonStyles.secondary,
                width: "100%",
                height: 40,
              }}
              onClick={filtros.limparFiltros}
              disabled={!filtros.hasFilters}
            >
              Limpar
            </button>
          </div>
        </div>
      </DataCard>

      <div style={{ height: 16 }} />

      <DataCard
        title="Lista de pedidos"
        subtitle="Acompanhe o status operacional dos pedidos de venda."
      >
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                <Th onClick={() => ordenacao.handleSort("id")}>
                  ID{sortLabel("id")}
                </Th>
                <Th onClick={() => ordenacao.handleSort("data")}>
                  Data{sortLabel("data")}
                </Th>
                <Th onClick={() => ordenacao.handleSort("contrato_id")}>
                  Contrato{sortLabel("contrato_id")}
                </Th>
                <Th onClick={() => ordenacao.handleSort("status")}>
                  Status{sortLabel("status")}
                </Th>
                <Th>Total</Th>
                <Th align="right">Ações</Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Carregando pedidos...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Nenhum pedido de venda encontrado.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const statusVisual = getStatusVisual(row);
                  const perms = flowPerms(statusVisual);
                  const contrato = combos.contratosMap.get(
                    Number(row.contrato_id)
                  );

                  return (
                    <tr key={row.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={tdStyle}>#{row.id}</td>

                      <td style={tdStyle}>{formatDateBR(row.data)}</td>

                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>
                          {contrato?.numero || row.contrato_id || "-"}
                        </div>
                        {contrato?.orgaoNome && (
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {contrato.orgaoNome}
                          </div>
                        )}
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            borderRadius: 999,
                            padding: "5px 10px",
                            fontSize: 11,
                            fontWeight: 850,
                            ...statusStyle(statusVisual),
                          }}
                        >
                          {statusLabel(statusVisual)}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>
                          {formatMoneyBR(calcTotal(row))}
                        </div>
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          {perms.canOpen && (
                            <IconButton
                              title="Abrir pedido"
                              onClick={() => navigate(`/pedidosvenda/${row.id}/editar`)}
                            >
                              <FiEdit size={15} />
                            </IconButton>
                          )}

                          {perms.canAprovar && (
                            <IconButton
                              title="Aprovar/processar"
                              disabled={actions.actingId === row.id}
                              onClick={() => actions.aprovarPedido(row.id)}
                            >
                              <FiSend size={15} />
                            </IconButton>
                          )}

                          {perms.canConcluir && (
                            <IconButton
                              title="Concluir pedido"
                              disabled={actions.actingId === row.id}
                              onClick={() => actions.concluirPedido(row.id)}
                            >
                              <FiCheckCircle size={15} />
                            </IconButton>
                          )}

                          {perms.canCancelar && (
                            <IconButton
                              title="Cancelar pedido"
                              disabled={actions.actingId === row.id}
                              onClick={() => actions.cancelarPedido(row.id)}
                            >
                              <FiXCircle size={15} />
                            </IconButton>
                          )}

                          {perms.canDevolver && (
                            <IconButton
                              title="Registrar devolução"
                              disabled={actions.actingId === row.id}
                              onClick={() => actions.devolverPedido(row.id)}
                            >
                              <FiCornerUpLeft size={15} />
                            </IconButton>
                          )}

                          <IconButton //adicionar permissoes
                            title="Expedições / Romaneios"
                            onClick={() => navigate("/pedidosvenda/expedicoes")}
                          >
                            <FiTruck size={15} />
                          </IconButton>

                          <IconButton
                            title="Relatório operacional"
                            onClick={() =>
                              actions.emitirRelatorioPedido(row.id)
                            }
                          >
                            <FiFileText size={15} />
                          </IconButton>

                          {perms.canEditHeader ? (
                            <IconButton
                              title="Excluir pedido"
                              danger
                              disabled={actions.deletingId === row.id}
                              onClick={() => actions.excluirPedido(row.id)}
                            >
                              <FiTrash2 size={15} />
                            </IconButton>
                          ) : (
                            <IconButton title="Pedido bloqueado" disabled>
                              <FiLock size={15} />
                            </IconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13, color: "#64748b" }}>
            Página <strong>{page}</strong> de <strong>{totalPages}</strong> •{" "}
            {total} registro(s)
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={buttonStyles.secondary}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <FiChevronLeft size={16} />
            </button>

            <button
              type="button"
              style={buttonStyles.secondary}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      </DataCard>
    </PageShell>
  );
}

function Th({
  children,
  onClick,
  align = "left",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  align?: "left" | "right";
}) {
  return (
    <th
      onClick={onClick}
      style={{
        padding: "12px 14px",
        textAlign: align,
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: "#64748b",
        whiteSpace: "nowrap",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {children}
    </th>
  );
}

function IconButton({
  title,
  children,
  onClick,
  disabled,
  danger,
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 34,
        height: 34,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: disabled ? "#f8fafc" : "#ffffff",
        color: disabled ? "#94a3b8" : danger ? "#dc2626" : "#334155",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 800,
  color: "#374151",
  marginBottom: 6,
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 13,
  color: "#334155",
  verticalAlign: "middle",
};

const emptyStyle: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontSize: 13,
  color: "#64748b",
};