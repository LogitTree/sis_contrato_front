import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiCheckCircle, FiKey, FiLayers, FiShield } from "react-icons/fi";

import PageShell from "../../../../components/executive/PageShell";
import PageHeader from "../../../../components/executive/PageHeader";
import SummaryCard from "../../../../components/executive/SummaryCard";
import DataCard from "../../../../components/executive/DataCard";
import SearchBox from "../../../../components/executive/SearchBox";

import { buttonStyles } from "../../../../styles/buttons";
import { useAcoesSistema } from "../../acoes-sistema/hooks/useAcoesSistema";
import { useGruposUsuarios } from "../hooks/useGruposUsuarios";
import { usePermissoesGrupo } from "./hooks/usePermissoesGrupo";

export default function PermissoesGrupoPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const grupoId = Number(id);

  const [search, setSearch] = useState("");
  const [selecionadas, setSelecionadas] = useState<number[]>([]);

  const { data: acoes = [], loading: loadingAcoes } = useAcoesSistema();
  const { data: grupos = [], isLoading: loadingGrupos } = useGruposUsuarios();

  const {
    acoesSelecionadas,
    loading: loadingPermissoes,
    salvar,
  } = usePermissoesGrupo(grupoId);

  const grupoAtual = useMemo(() => {
    return grupos.find((grupo) => Number(grupo.id) === grupoId);
  }, [grupos, grupoId]);

  useMemo(() => {
    setSelecionadas(acoesSelecionadas);
  }, [acoesSelecionadas]);

  const filteredAcoes = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return acoes;

    return acoes.filter((acao) => {
      return (
        acao.modulo?.toLowerCase().includes(term) ||
        acao.nome?.toLowerCase().includes(term) ||
        acao.codigo?.toLowerCase().includes(term) ||
        acao.descricao?.toLowerCase().includes(term)
      );
    });
  }, [acoes, search]);

  const acoesAgrupadas = useMemo(() => {
    const map = new Map<string, typeof acoes>();

    filteredAcoes.forEach((acao) => {
      const modulo = acao.modulo || "Outros";

      if (!map.has(modulo)) {
        map.set(modulo, []);
      }

      map.get(modulo)?.push(acao);
    });

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredAcoes]);

  function toggleAcao(acaoId: number) {
    setSelecionadas((prev) => {
      if (prev.includes(acaoId)) {
        return prev.filter((id) => id !== acaoId);
      }

      return [...prev, acaoId];
    });
  }

  async function handleSalvar() {
    await salvar(selecionadas);
  }

  const loading = loadingAcoes || loadingGrupos || loadingPermissoes;

  return (
    <PageShell>
      <PageHeader
        title="Permissões do Grupo"
        subtitle={`Defina as ações permitidas para ${
          grupoAtual?.nome || "o grupo selecionado"
        }.`}
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              style={buttonStyles.secondary}
              onClick={() => navigate("/controle-acesso/grupos-usuarios")}
            >
              Voltar
            </button>

            <button
              type="button"
              style={buttonStyles.primary}
              onClick={handleSalvar}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar permissões"}
            </button>
          </div>
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
          label="Grupo"
          value={grupoAtual?.nome || "-"}
          icon={<FiShield size={18} />}
        />

        <SummaryCard
          label="Total de ações"
          value={acoes.length}
          icon={<FiKey size={18} />}
        />

        <SummaryCard
          label="Selecionadas"
          value={selecionadas.length}
          tone="success"
          icon={<FiCheckCircle size={18} />}
        />

        <SummaryCard
          label="Módulos"
          value={acoesAgrupadas.length}
          tone="info"
          icon={<FiLayers size={18} />}
        />
      </div>

      <DataCard
        title="Controle de permissões"
        subtitle="Marque as ações que este grupo poderá executar no sistema."
        right={
          <div style={{ width: 360 }}>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Buscar por módulo, ação, código ou descrição"
            />
          </div>
        }
      >
        {loading ? (
          <div style={emptyStyle}>Carregando permissões...</div>
        ) : acoesAgrupadas.length === 0 ? (
          <div style={emptyStyle}>Nenhuma ação encontrada.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {acoesAgrupadas.map(([modulo, items]) => (
              <div key={modulo} style={moduleCardStyle}>
                <div style={moduleHeaderStyle}>
                  <div>
                    <div style={moduleTitleStyle}>{modulo}</div>
                    <div style={moduleSubtitleStyle}>
                      {items.length} ação(ões) neste módulo
                    </div>
                  </div>

                  <div style={moduleCounterStyle}>
                    {
                      items.filter((item) => selecionadas.includes(item.id))
                        .length
                    }
                    /{items.length}
                  </div>
                </div>

                <div style={permissionsGridStyle}>
                  {items.map((acao) => {
                    const checked = selecionadas.includes(acao.id);

                    return (
                      <button
                        key={acao.id}
                        type="button"
                        onClick={() => toggleAcao(acao.id)}
                        style={{
                          ...permissionItemStyle,
                          ...(checked ? permissionItemActiveStyle : {}),
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={permissionTitleStyle}>{acao.nome}</div>
                          <div style={permissionCodeStyle}>{acao.codigo}</div>
                          {acao.descricao && (
                            <div style={permissionDescriptionStyle}>
                              {acao.descricao}
                            </div>
                          )}
                        </div>

                        <span
                          style={{
                            ...checkboxStyle,
                            ...(checked ? checkboxActiveStyle : {}),
                          }}
                        >
                          {checked ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </DataCard>
    </PageShell>
  );
}

const emptyStyle: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontSize: 13,
  color: "#64748b",
};

const moduleCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 20,
  background: "#f8fafc",
  padding: 16,
};

const moduleHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  marginBottom: 14,
};

const moduleTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 850,
  color: "#0f172a",
};

const moduleSubtitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 3,
};

const moduleCounterStyle: React.CSSProperties = {
  borderRadius: 999,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  padding: "5px 10px",
  fontSize: 12,
  fontWeight: 800,
  color: "#334155",
};

const permissionsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};

const permissionItemStyle: React.CSSProperties = {
  minHeight: 92,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  textAlign: "left",
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  borderRadius: 18,
  padding: 14,
  cursor: "pointer",
  transition: "all .2s ease",
};

const permissionItemActiveStyle: React.CSSProperties = {
  border: "1px solid #86efac",
  background: "#ecfdf5",
};

const permissionTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 4,
};

const permissionCodeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#475569",
  background: "#f1f5f9",
  borderRadius: 8,
  padding: "3px 7px",
  display: "inline-block",
};

const permissionDescriptionStyle: React.CSSProperties = {
  marginTop: 7,
  fontSize: 12,
  color: "#64748b",
  lineHeight: 1.35,
};

const checkboxStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 15,
  fontWeight: 900,
  flexShrink: 0,
};

const checkboxActiveStyle: React.CSSProperties = {
  background: "#16a34a",
  borderColor: "#16a34a",
};