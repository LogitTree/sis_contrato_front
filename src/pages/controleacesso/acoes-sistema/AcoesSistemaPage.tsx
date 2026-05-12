import { useMemo, useState } from "react";
import PageShell from "../../../components/executive/PageShell";
import PageHeader from "../../../components/executive/PageHeader";
import SummaryCard from "../../../components/executive/SummaryCard";
import DataCard from "../../../components/executive/DataCard";
import SearchBox from "../../../components/executive/SearchBox";
import StatusBadge from "../../../components/executive/StatusBadge";
import { buttonStyles } from "../../../styles/buttons";
import type { AcaoSistema } from "../../../services/controleacesso/acaoSistemaService";
import { useAcoesSistema } from "./hooks/useAcoesSistema";
import AcaoSistemaModal from "./components/modal-acao-sistema";

export default function AcoesSistemaPage() {
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AcaoSistema | null>(null);

  const { data, loading, resumo, criar, atualizar, remover } =
    useAcoesSistema();

  const filteredData = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return data;

    return data.filter((item) => {
      return (
        item.modulo?.toLowerCase().includes(term) ||
        item.nome?.toLowerCase().includes(term) ||
        item.codigo?.toLowerCase().includes(term) ||
        item.descricao?.toLowerCase().includes(term)
      );
    });
  }, [data, search]);

  function handleNew() {
    setSelectedItem(null);
    setOpenModal(true);
  }

  function handleEdit(item: AcaoSistema) {
    setSelectedItem(item);
    setOpenModal(true);
  }

  async function handleDelete(item: AcaoSistema) {
    const confirmed = window.confirm(
      `Deseja realmente inativar a ação "${item.nome}"?`
    );

    if (!confirmed) return;

    await remover(item.id);
  }

  return (
    <PageShell>
      <PageHeader
        title="Ações do Sistema"
        subtitle="Gerencie as permissões disponíveis para os grupos de acesso."
        action={
          <button style={buttonStyles.primary} onClick={handleNew}>
            Nova ação
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
        <SummaryCard label="Total de ações" value={resumo.total} />
        <SummaryCard label="Ações ativas" value={resumo.ativas} tone="success" />
        <SummaryCard label="Inativas" value={resumo.inativas} tone="danger" />
        <SummaryCard label="Módulos" value={resumo.modulos} />
      </div>

      <DataCard
        title="Cadastro de ações"
        subtitle="Controle os códigos de permissão usados no sistema."
        right={
          <div style={{ width: 360 }}>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Buscar por módulo, nome, código ou descrição"
            />
          </div>
        }
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
                {["ID", "Módulo", "Ação", "Código", "Status", "Ações"].map(
                  (title) => (
                    <th
                      key={title}
                      style={{
                        padding: "12px 14px",
                        textAlign: title === "Ações" ? "right" : "left",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        color: "#64748b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {title}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 36,
                      textAlign: "center",
                      fontSize: 13,
                      color: "#64748b",
                    }}
                  >
                    Carregando ações...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 36,
                      textAlign: "center",
                      fontSize: 13,
                      color: "#64748b",
                    }}
                  >
                    Nenhuma ação encontrada.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <td style={tdStyle}>{item.id}</td>

                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-flex",
                          borderRadius: 999,
                          background: "#f1f5f9",
                          padding: "4px 10px",
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#334155",
                        }}
                      >
                        {item.modulo}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>
                        {item.nome}
                      </div>
                      {item.descricao && (
                        <div
                          style={{
                            marginTop: 3,
                            maxWidth: 420,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: 12,
                            color: "#64748b",
                          }}
                        >
                          {item.descricao}
                        </div>
                      )}
                    </td>

                    <td style={tdStyle}>
                      <code
                        style={{
                          borderRadius: 8,
                          background: "#f8fafc",
                          border: "1px solid #e5e7eb",
                          padding: "4px 8px",
                          fontSize: 11,
                          color: "#334155",
                        }}
                      >
                        {item.codigo}
                      </code>
                    </td>

                    <td style={tdStyle}>
                      <StatusBadge status={item.status} />
                    </td>

                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 8,
                        }}
                      >
                        <button
                          type="button"
                          style={buttonStyles.secondary}
                          onClick={() => handleEdit(item)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          style={buttonStyles.danger}
                          onClick={() => handleDelete(item)}
                        >
                          Inativar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DataCard>

      <AcaoSistemaModal
        isOpen={openModal}
        initialData={selectedItem}
        loading={loading}
        onClose={() => {
          setOpenModal(false);
          setSelectedItem(null);
        }}
        onSubmit={async (values) => {
          if (selectedItem?.id) {
            await atualizar(selectedItem.id, values);
          } else {
            await criar(values);
          }

          setOpenModal(false);
          setSelectedItem(null);
        }}
      />
    </PageShell>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 13,
  color: "#334155",
  verticalAlign: "middle",
};