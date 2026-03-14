import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { layoutStyles } from "../../styles/layout";
import { tableStyles } from "../../styles/table";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type Grupo = { id: number; nome: string };
type Subgrupo = { id: number; nome: string };

type EstoqueLoteRow = {
  id: number;
  produto_id: number;
  lote: string;
  validade?: string | null;
  quantidade: string | number;
  custo?: string | number | null;
  valor_total?: string | number | null;
  situacao_validade?: string;
  produto?: {
    id: number;
    nome?: string;
    descricao?: string;
    sku?: string;
    grupo?: { id: number; nome?: string };
    subgrupo?: { id: number; nome?: string };
  };
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
  return { data: [], total: 0 };
}

function toNumber(v: any): number {
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

function formatQtyBR(v: any) {
  return toNumber(v).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function formatMoneyBR(v: any) {
  return toNumber(v).toLocaleString("pt-BR", {
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

function getSituacaoStyle(situacao: string | undefined) {
  const s = String(situacao || "OK").toUpperCase();

  if (s === "VENCIDO") {
    return { background: "#fee2e2", color: "#991b1b" };
  }

  if (s === "VENCE_30") {
    return { background: "#fef3c7", color: "#92400e" };
  }

  if (s === "VENCE_60" || s === "VENCE_90") {
    return { background: "#dbeafe", color: "#1e40af" };
  }

  if (s === "SEM_VALIDADE") {
    return { background: "#e5e7eb", color: "#374151" };
  }

  return { background: "#dcfce7", color: "#166534" };
}

function getSituacaoLabel(situacao: string | undefined) {
  const s = String(situacao || "OK").toUpperCase();

  if (s === "VENCE_30") return "Vence em até 30 dias";
  if (s === "VENCE_60") return "Vence em até 60 dias";
  if (s === "VENCE_90") return "Vence em até 90 dias";
  if (s === "SEM_VALIDADE") return "Sem validade";

  return s.replaceAll("_", " ");
}

const filterRow: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-end",
};

const filterField: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const filterLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#374151",
};

const fullControl: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
};


export default function EstoqueLotesList() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<EstoqueLoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [subgrupos, setSubgrupos] = useState<Subgrupo[]>([]);

  const [busca, setBusca] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [subgrupoId, setSubgrupoId] = useState("");
  const [lote, setLote] = useState("");
  const [situacaoValidade, setSituacaoValidade] = useState("");
  const [validadeInicio, setValidadeInicio] = useState("");
  const [validadeFim, setValidadeFim] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

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

  async function loadGrupos() {
    try {
      const res = await api.get("/grupos", { params: { page: 1, limit: 1000 } });
      const data = res.data?.data ?? res.data?.rows ?? [];
      setGrupos(data);
    } catch {
      setGrupos([]);
    }
  }

  async function loadSubgrupos(grupo_id?: string) {
    if (!grupo_id) {
      setSubgrupos([]);
      return;
    }

    try {
      const res = await api.get("/subgrupos", {
        params: { grupo_id: Number(grupo_id) },
      });
      const data = res.data?.data ?? res.data?.rows ?? res.data ?? [];
      setSubgrupos(Array.isArray(data) ? data : []);
    } catch {
      setSubgrupos([]);
    }
  }

  async function carregar() {
    setLoading(true);

    try {
      const params: any = {
        page,
        limit,
      };

      if (busca) params.busca = busca;
      if (grupoId) params.grupo_id = Number(grupoId);
      if (subgrupoId) params.subgrupo_id = Number(subgrupoId);
      if (lote) params.lote = lote;
      if (situacaoValidade) params.situacao_validade = situacaoValidade;
      if (validadeInicio) params.validade_inicio = validadeInicio;
      if (validadeFim) params.validade_fim = validadeFim;

      const res = await api.get("/estoque-lotes", { params });
      const { data, total } = pickListResponse(res.data);

      setRows(data);
      setTotal(total);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar estoque por lote");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGrupos();
  }, []);

  useEffect(() => {
    loadSubgrupos(grupoId);
    setSubgrupoId("");
  }, [grupoId]);

  useEffect(() => {
    carregar();
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      carregar();
    }, 400);

    return () => clearTimeout(t);
  }, [busca, grupoId, subgrupoId, lote, situacaoValidade, validadeInicio, validadeFim]);

  const totalPages = Math.ceil(total / limit);

  const hasFilters = useMemo(
    () =>
      !!busca ||
      !!grupoId ||
      !!subgrupoId ||
      !!lote ||
      !!situacaoValidade ||
      !!validadeInicio ||
      !!validadeFim,
    [busca, grupoId, subgrupoId, lote, situacaoValidade, validadeInicio, validadeFim]
  );

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <div>
          <h1 style={layoutStyles.title}>Estoque por Lote</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {total} lote(s) encontrado(s)
          </div>
        </div>
      </div>

      <div style={layoutStyles.cardCompact}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* linha 1 */}
          <div style={filterRow}>
            <div style={{ ...filterField, minWidth: 360, flex: 2.2 }}>
              <label style={filterLabel}>Buscar produto</label>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{ ...filterStyles.input, ...fullControl }}
                placeholder="Nome, descrição ou SKU"
              />
            </div>

            <div style={{ ...filterField, minWidth: 180, flex: 1 }}>
              <label style={filterLabel}>Grupo</label>
              <select
                value={grupoId}
                onChange={(e) => setGrupoId(e.target.value)}
                style={{ ...filterStyles.select, ...fullControl }}
              >
                <option value="">Todos</option>
                {grupos.map((g) => (
                  <option key={g.id} value={String(g.id)}>
                    {g.nome}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ ...filterField, minWidth: 180, flex: 1 }}>
              <label style={filterLabel}>Subgrupo</label>
              <select
                value={subgrupoId}
                onChange={(e) => setSubgrupoId(e.target.value)}
                style={{ ...filterStyles.select, ...fullControl }}
                disabled={!grupoId}
              >
                <option value="">Todos</option>
                {subgrupos.map((sg) => (
                  <option key={sg.id} value={String(sg.id)}>
                    {sg.nome}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ ...filterField, minWidth: 170, flex: 0.9 }}>
              <label style={filterLabel}>Lote</label>
              <input
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                style={{ ...filterStyles.input, ...fullControl }}
                placeholder="Ex.: L2026001"
              />
            </div>
          </div>

          {/* linha 2 */}
          <div style={filterRow}>
            <div style={{ ...filterField, width: 220 }}>
              <label style={filterLabel}>Situação validade</label>
              <select
                value={situacaoValidade}
                onChange={(e) => setSituacaoValidade(e.target.value)}
                style={{ ...filterStyles.select, ...fullControl }}
              >
                <option value="">Todas</option>
                <option value="VENCIDO">Vencido</option>
                <option value="VENCE_30">Vence em até 30 dias</option>
                <option value="VENCE_60">Vence em até 60 dias</option>
                <option value="VENCE_90">Vence em até 90 dias</option>
                <option value="OK">OK</option>
                <option value="SEM_VALIDADE">Sem validade</option>
              </select>
            </div>

            <div style={{ ...filterField, width: 170 }}>
              <label style={filterLabel}>Validade de</label>
              <input
                type="date"
                value={validadeInicio}
                onChange={(e) => setValidadeInicio(e.target.value)}
                style={{ ...filterStyles.input, ...fullControl }}
              />
            </div>

            <div style={{ ...filterField, width: 170 }}>
              <label style={filterLabel}>Validade até</label>
              <input
                type="date"
                value={validadeFim}
                onChange={(e) => setValidadeFim(e.target.value)}
                style={{ ...filterStyles.input, ...fullControl }}
              />
            </div>

            <div style={{ flex: 1 }} />

            {hasFilters && (
              <button
                style={{ ...buttonStyles.link, marginBottom: 2 }}
                onClick={() => {
                  setBusca("");
                  setGrupoId("");
                  setSubgrupoId("");
                  setLote("");
                  setSituacaoValidade("");
                  setValidadeInicio("");
                  setValidadeFim("");
                }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>


      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, margin: "12px 0 16px" }}>
        <button style={buttonStyles.link} onClick={() => navigate(-1)}>
          Voltar
        </button>
      </div>

      <div style={layoutStyles.card}>
        <div style={{ paddingBottom: 12, fontSize: 13, color: "#64748b" }}>
          {loading ? "Atualizando lista..." : `Exibindo ${rows.length} de ${total} registro(s)`}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ ...tableStyles.table, tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ ...tableStyles.th, width: "50%" }}>
                  Produto / Lote / Validade
                </th>

                <th style={{ ...tableStyles.th, width: 120, textAlign: "right" }}>
                  Quantidade
                </th>

                <th style={{ ...tableStyles.th, width: 120, textAlign: "right" }}>
                  Custo
                </th>

                <th style={{ ...tableStyles.th, width: 140, textAlign: "right" }}>
                  Valor total
                </th>

                <th style={{ ...tableStyles.th, width: 180, textAlign: "center" }}>
                  Situação
                </th>
              </tr>
            </thead>

            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                    Nenhum lote encontrado.
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
                      {/* PRODUTO */}
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>
                        {produtoNome}
                      </div>

                      {/* GRUPO / SUBGRUPO */}
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

                      {/* LOTE / VALIDADE */}
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: "#475569",
                          display: "flex",
                          gap: 16,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>
                          <strong>Lote:</strong> {r.lote || "-"}
                        </span>

                        <span>
                          <strong>Validade:</strong> {formatDateBR(r.validade)}
                        </span>
                      </div>

                      {r.produto?.sku && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            marginTop: 3,
                          }}
                        >
                          SKU: {r.produto.sku}
                        </div>
                      )}
                    </td>

                    <td style={tdRight}>{formatQtyBR(r.quantidade)}</td>

                    <td style={tdRight}>{formatMoneyBR(r.custo)}</td>

                    <td style={{ ...tdRight, fontWeight: 800 }}>
                      {formatMoneyBR(r.valor_total)}
                    </td>

                    <td style={{ ...tdCompact, textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          display: "inline-block",
                          ...getSituacaoStyle(r.situacao_validade),
                        }}
                      >
                        {getSituacaoLabel(r.situacao_validade)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
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
