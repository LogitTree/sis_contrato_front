import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiPackage, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

import api from "../../api/api";
import { buttonStyles } from "../../styles/buttons";
import { filterStyles } from "../../styles/filters";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
};

type Empresa = {
  id: number;
  razao_social: string;
  nome_fantasia?: string;
  cnpj?: string;
  status?: string;
};

type Grupo = {
  id: number;
  nome: string;
  ativo?: boolean;
};

type ResumoImportacao = {
  total_produtos: number;
  ja_existentes: number;
  novos: number;
};

export default function ImportarProdutosModal({
  isOpen,
  onClose,
  onImported,
}: Props) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);

  const [empresaId, setEmpresaId] = useState("");
  const [gruposSelecionados, setGruposSelecionados] = useState<number[]>([]);
  const [buscaGrupo, setBuscaGrupo] = useState("");

  const [loadingDados, setLoadingDados] = useState(false);
  const [simulando, setSimulando] = useState(false);
  const [importando, setImportando] = useState(false);

  const [resumo, setResumo] = useState<ResumoImportacao | null>(null);

  const gruposFiltrados = useMemo(() => {
    const busca = buscaGrupo.trim().toLowerCase();

    if (!busca) return grupos;

    return grupos.filter((grupo) =>
      grupo.nome.toLowerCase().includes(busca)
    );
  }, [grupos, buscaGrupo]);

  const todosFiltradosSelecionados =
    gruposFiltrados.length > 0 &&
    gruposFiltrados.every((grupo) =>
      gruposSelecionados.includes(Number(grupo.id))
    );

  async function carregarDados() {
    setLoadingDados(true);

    try {
      const [empresasResponse, gruposResponse] = await Promise.all([
        api.get("/empresas", {
          params: {
            page: 1,
            limit: 1000,
            sort: "razao_social",
            order: "ASC",
          },
        }),
        api.get("/grupos", {
          params: {
            page: 1,
            limit: 1000,
            orderBy: "nome",
            orderDir: "ASC",
            ativo: true,
          },
        }),
      ]);

      const empresasRows = Array.isArray(empresasResponse.data)
        ? empresasResponse.data
        : empresasResponse.data?.data ||
          empresasResponse.data?.rows ||
          [];

      const gruposRows = Array.isArray(gruposResponse.data)
        ? gruposResponse.data
        : gruposResponse.data?.data ||
          gruposResponse.data?.rows ||
          [];

      setEmpresas(empresasRows);
      setGrupos(gruposRows);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar empresas e grupos.");
    } finally {
      setLoadingDados(false);
    }
  }

  function limparFormulario() {
    setEmpresaId("");
    setGruposSelecionados([]);
    setBuscaGrupo("");
    setResumo(null);
  }

  function fecharModal() {
    if (importando) return;

    limparFormulario();
    onClose();
  }

  function toggleGrupo(grupoId: number) {
    setResumo(null);

    setGruposSelecionados((anteriores) => {
      if (anteriores.includes(grupoId)) {
        return anteriores.filter((id) => id !== grupoId);
      }

      return [...anteriores, grupoId];
    });
  }

  function toggleTodosFiltrados() {
    setResumo(null);

    const idsFiltrados = gruposFiltrados.map((grupo) => Number(grupo.id));

    setGruposSelecionados((anteriores) => {
      if (todosFiltradosSelecionados) {
        return anteriores.filter((id) => !idsFiltrados.includes(id));
      }

      return Array.from(new Set([...anteriores, ...idsFiltrados]));
    });
  }

  function validarSelecao() {
    if (!empresaId) {
      toast.warning("Selecione uma empresa.");
      return false;
    }

    if (gruposSelecionados.length === 0) {
      toast.warning("Selecione pelo menos um grupo.");
      return false;
    }

    return true;
  }

  async function simularImportacao() {
    if (!validarSelecao()) return;

    setSimulando(true);

    try {
      const response = await api.post(
        "/produto-empresas/importacao/simular",
        {
          empresa_contratada_id: Number(empresaId),
          grupo_ids: gruposSelecionados,
          subgrupo_ids: [],
        }
      );

      const dados = response.data?.data ?? response.data;

      setResumo({
        total_produtos: Number(dados?.total_produtos) || 0,
        ja_existentes: Number(dados?.ja_existentes) || 0,
        novos: Number(dados?.novos) || 0,
      });
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Erro ao simular importação."
      );
    } finally {
      setSimulando(false);
    }
  }

  async function importarProdutos() {
    if (!validarSelecao()) return;

    const quantidade = resumo?.novos;

    const mensagem =
      quantidade !== undefined
        ? `Confirma a inclusão de ${quantidade} produto(s) nesta empresa?`
        : "Confirma a importação dos produtos selecionados?";

    if (!window.confirm(mensagem)) return;

    setImportando(true);

    try {
      const response = await api.post("/produto-empresas/importacao", {
        empresa_contratada_id: Number(empresaId),
        grupo_ids: gruposSelecionados,
        subgrupo_ids: [],
      });

      const dados = response.data?.data ?? response.data;
      const importados = Number(dados?.importados) || 0;

      if (importados > 0) {
        toast.success(`${importados} produto(s) importado(s) com sucesso.`);
      } else {
        toast.info("Todos os produtos selecionados já estavam vinculados.");
      }

      onImported?.();
      fecharModal();
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Erro ao importar produtos."
      );
    } finally {
      setImportando(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      carregarDados();
    }
  }, [isOpen]);

  useEffect(() => {
    setResumo(null);
  }, [empresaId]);

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <div style={titleStyle}>Importar produtos por grupo</div>

            <div style={subtitleStyle}>
              Vincule, em lote, produtos ainda não cadastrados para uma empresa.
            </div>
          </div>

          <button
            type="button"
            style={closeButtonStyle}
            onClick={fecharModal}
            disabled={importando}
            title="Fechar"
          >
            <FiX size={17} />
          </button>
        </div>

        <div style={contentStyle}>
          {loadingDados ? (
            <div style={emptyStyle}>Carregando dados...</div>
          ) : (
            <>
              <div>
                <label style={labelStyle}>Empresa</label>

                <select
                  value={empresaId}
                  onChange={(event) => setEmpresaId(event.target.value)}
                  style={fieldStyle}
                  disabled={simulando || importando}
                >
                  <option value="">Selecione uma empresa</option>

                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nome_fantasia || empresa.razao_social}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={groupsHeaderStyle}>
                  <div>
                    <label style={{ ...labelStyle, marginBottom: 2 }}>
                      Grupos de produtos
                    </label>

                    <div style={helperStyle}>
                      {gruposSelecionados.length} grupo(s) selecionado(s)
                    </div>
                  </div>

                  <button
                    type="button"
                    style={selectAllButtonStyle}
                    onClick={toggleTodosFiltrados}
                    disabled={
                      gruposFiltrados.length === 0 ||
                      simulando ||
                      importando
                    }
                  >
                    {todosFiltradosSelecionados
                      ? "Desmarcar exibidos"
                      : "Selecionar exibidos"}
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Pesquisar grupo"
                  value={buscaGrupo}
                  onChange={(event) => setBuscaGrupo(event.target.value)}
                  style={{
                    ...fieldStyle,
                    marginTop: 10,
                  }}
                  disabled={simulando || importando}
                />

                <div style={groupsContainerStyle}>
                  {gruposFiltrados.length === 0 ? (
                    <div style={emptyGroupStyle}>
                      Nenhum grupo encontrado.
                    </div>
                  ) : (
                    gruposFiltrados.map((grupo) => {
                      const grupoId = Number(grupo.id);
                      const checked =
                        gruposSelecionados.includes(grupoId);

                      return (
                        <label
                          key={grupo.id}
                          style={{
                            ...groupRowStyle,
                            background: checked ? "#f0fdfa" : "#ffffff",
                            borderColor: checked ? "#99f6e4" : "#e5e7eb",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleGrupo(grupoId)}
                            disabled={simulando || importando}
                            style={{
                              width: 18,
                              height: 18,
                              cursor: "pointer",
                            }}
                          />

                          <span style={groupNameStyle}>{grupo.nome}</span>

                          {checked && (
                            <FiCheck size={17} color="#0f766e" />
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {resumo && (
                <div style={summaryContainerStyle}>
                  <div style={summaryTitleStyle}>
                    <FiPackage size={17} />
                    Resumo da importação
                  </div>

                  <div style={summaryGridStyle}>
                    <div style={summaryItemStyle}>
                      <span style={summaryLabelStyle}>
                        Produtos encontrados
                      </span>

                      <strong style={summaryValueStyle}>
                        {resumo.total_produtos}
                      </strong>
                    </div>

                    <div style={summaryItemStyle}>
                      <span style={summaryLabelStyle}>Já existentes</span>

                      <strong style={summaryValueStyle}>
                        {resumo.ja_existentes}
                      </strong>
                    </div>

                    <div
                      style={{
                        ...summaryItemStyle,
                        background: "#ecfdf5",
                        borderColor: "#a7f3d0",
                      }}
                    >
                      <span
                        style={{
                          ...summaryLabelStyle,
                          color: "#047857",
                        }}
                      >
                        Serão adicionados
                      </span>

                      <strong
                        style={{
                          ...summaryValueStyle,
                          color: "#047857",
                        }}
                      >
                        {resumo.novos}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={footerStyle}>
          <button
            type="button"
            style={buttonStyles.secondary}
            onClick={fecharModal}
            disabled={importando}
          >
            Cancelar
          </button>

          <button
            type="button"
            style={buttonStyles.secondary}
            onClick={simularImportacao}
            disabled={
              loadingDados ||
              simulando ||
              importando ||
              !empresaId ||
              gruposSelecionados.length === 0
            }
          >
            {simulando ? "Simulando..." : "Simular"}
          </button>

          <button
            type="button"
            style={buttonStyles.primary}
            onClick={importarProdutos}
            disabled={
              loadingDados ||
              simulando ||
              importando ||
              !empresaId ||
              gruposSelecionados.length === 0 ||
              resumo?.novos === 0
            }
          >
            {importando ? "Importando..." : "Importar produtos"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(15, 23, 42, 0.52)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modalStyle: React.CSSProperties = {
  width: 760,
  maxWidth: "96vw",
  maxHeight: "92vh",
  background: "#ffffff",
  borderRadius: 24,
  overflow: "hidden",
  boxShadow: "0 28px 80px rgba(15, 23, 42, 0.35)",
  display: "flex",
  flexDirection: "column",
};

const headerStyle: React.CSSProperties = {
  padding: "20px 22px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "#0f172a",
};

const subtitleStyle: React.CSSProperties = {
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

const contentStyle: React.CSSProperties = {
  padding: 20,
  overflowY: "auto",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 800,
  color: "#374151",
};

const helperStyle: React.CSSProperties = {
  marginTop: 3,
  fontSize: 12,
  color: "#64748b",
};

const fieldStyle: React.CSSProperties = {
  ...filterStyles.input,
  width: "100%",
  height: 40,
  boxSizing: "border-box",
};

const groupsHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const selectAllButtonStyle: React.CSSProperties = {
  border: 0,
  background: "transparent",
  color: "#0f766e",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const groupsContainerStyle: React.CSSProperties = {
  marginTop: 10,
  maxHeight: 280,
  overflowY: "auto",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 8,
  display: "flex",
  flexDirection: "column",
  gap: 7,
  background: "#f8fafc",
};

const groupRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minHeight: 44,
  padding: "9px 11px",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  cursor: "pointer",
};

const groupNameStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 13,
  fontWeight: 800,
  color: "#334155",
};

const emptyGroupStyle: React.CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: "#64748b",
  fontSize: 13,
};

const summaryContainerStyle: React.CSSProperties = {
  marginTop: 18,
  padding: 16,
  border: "1px solid #dbeafe",
  borderRadius: 18,
  background: "#f8fafc",
};

const summaryTitleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 900,
  color: "#0f172a",
};

const summaryGridStyle: React.CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};

const summaryItemStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
  background: "#ffffff",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#64748b",
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  color: "#0f172a",
};

const footerStyle: React.CSSProperties = {
  padding: "16px 20px",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  background: "#f8fafc",
};

const emptyStyle: React.CSSProperties = {
  padding: 40,
  textAlign: "center",
  fontSize: 13,
  color: "#64748b",
};