import { useMemo, useState } from "react";
import {
  FiUserCheck, FiUsers, FiShield, FiKey, FiEdit,
  FiTrash2, FiBriefcase
} from "react-icons/fi";

import PageShell from "../../../components/executive/PageShell";
import PageHeader from "../../../components/executive/PageHeader";
import SummaryCard from "../../../components/executive/SummaryCard";
import DataCard from "../../../components/executive/DataCard";
import SearchBox from "../../../components/executive/SearchBox";
import StatusBadge from "../../../components/executive/StatusBadge";

import { buttonStyles } from "../../../styles/buttons";

import { useUsuarios } from "./hooks/useUsuarios";
import UsuarioModal from "./UsuarioModal";
import { useGruposUsuarios } from "../grupos-usuarios/hooks/useGruposUsuarios";
import UsuarioEmpresasModal from "./UsuarioEmpresasModal";
import UsuarioSenhaModal from "./UsuarioSenhaModal";

import type { UsuarioSistema, UsuarioPayload } from "../../../services/controleacesso/usuarioService";

export default function UsuariosPage() {
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UsuarioSistema | null>(null);

  const { data, isLoading, mutateCreate, mutateUpdate, mutateRemove } =
    useUsuarios();

  const { data: grupos = [] } = useGruposUsuarios();

  const [openSenhaModal, setOpenSenhaModal] = useState(false);

  const [usuarioSenha, setUsuarioSenha] =
    useState<UsuarioSistema | null>(null);

  const usuarios = useMemo(() => data || [], [data]);

  const [openEmpresasModal, setOpenEmpresasModal] = useState(false);
  const [usuarioEmpresas, setUsuarioEmpresas] =
    useState<UsuarioSistema | null>(null);

  const gruposMap = useMemo(() => {
    const map = new Map<number, string>();

    grupos.forEach((grupo) => {
      map.set(Number(grupo.id), grupo.nome);
    });

    return map;
  }, [grupos]);

  const filteredData = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return usuarios;

    return usuarios.filter((item) => {
      const grupoNome = gruposMap.get(Number(item.grupo_usuario_id)) || "";

      return (
        item.nome?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        grupoNome.toLowerCase().includes(term)
      );
    });
  }, [usuarios, search, gruposMap]);

  function handleNew() {
    setSelectedItem(null);
    setOpenModal(true);
  }

  function handleEdit(item: UsuarioSistema) {
    setSelectedItem(item);
    setOpenModal(true);
  }

  function handleSenha(item: UsuarioSistema) {
    setUsuarioSenha(item);
    setOpenSenhaModal(true);
  }

  async function handleDelete(item: UsuarioSistema) {
    const confirmed = window.confirm(
      `Deseja realmente inativar o usuário "${item.nome}"?`
    );

    if (!confirmed) return;

    await mutateRemove(item.id);
  }

  function handleEmpresas(item: UsuarioSistema) {
    setUsuarioEmpresas(item);
    setOpenEmpresasModal(true);
  }

  async function handleSubmit(values: UsuarioPayload) {
    if (selectedItem?.id) {
      await mutateUpdate(selectedItem.id, values);
    } else {
      await mutateCreate(values);
    }

    setOpenModal(false);
    setSelectedItem(null);
  }

  return (
    <PageShell>
      <PageHeader
        title="Usuários"
        subtitle="Gerencie os usuários do sistema e seus grupos de acesso."
        action={
          <button style={buttonStyles.primary} onClick={handleNew}>
            Novo usuário
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
          label="Total de usuários"
          value={usuarios.length}
          icon={<FiUsers size={18} />}
        />

        <SummaryCard
          label="Usuários ativos"
          value={usuarios.filter((item) => item.status === "ATIVO").length}
          tone="success"
          icon={<FiUserCheck size={18} />}
        />

        <SummaryCard
          label="Inativos"
          value={usuarios.filter((item) => item.status === "INATIVO").length}
          tone="danger"
          icon={<FiShield size={18} />}
        />

        <SummaryCard
          label="Grupos disponíveis"
          value={grupos.length}
          tone="info"
          icon={<FiShield size={18} />}
        />
      </div>

      <DataCard
        title="Cadastro de usuários"
        subtitle="Controle usuários, status e vínculo com grupos de permissão."
        right={
          <div style={{ width: 360 }}>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nome, email ou grupo"
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
                {["ID", "Nome", "Email", "Grupo", "Status", "Ações"].map(
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Carregando usuários...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Nenhum usuário encontrado.
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
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>
                        {item.nome}
                      </div>
                    </td>

                    <td style={tdStyle}>{item.email}</td>

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
                        {item.grupoUsuario?.nome ||
                          gruposMap.get(Number(item.grupo_usuario_id)) ||
                          "-"}
                      </span>
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
                          alignItems: "center",
                        }}
                      >
                        <button
                          type="button"
                          style={buttonStyles.icon}
                          onClick={() => handleEmpresas(item)}
                          title="Empresas vinculadas"
                        >
                          <FiBriefcase size={18} color="#0f766e" />
                        </button>

                        <button
                          type="button"
                          style={buttonStyles.icon}
                          onClick={() => handleEdit(item)}
                          title="Editar usuário"
                        >
                          <FiEdit size={18} color="#2563eb" />
                        </button>

                        <button
                          type="button"
                          style={buttonStyles.icon}
                          onClick={() => handleSenha(item)}
                          title="Alterar senha"
                        >
                          <FiKey size={18} color="#ea580c" />
                        </button>

                        <button
                          type="button"
                          style={buttonStyles.icon}
                          onClick={() => handleDelete(item)}
                          title="Inativar usuário"
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
      </DataCard>

      <UsuarioModal
        isOpen={openModal}
        initialData={selectedItem}
        grupos={grupos}
        loading={isLoading}
        onClose={() => {
          setOpenModal(false);
          setSelectedItem(null);
        }}
        onSubmit={handleSubmit}
      />

      <UsuarioEmpresasModal
        isOpen={openEmpresasModal}
        usuario={usuarioEmpresas}
        onClose={() => {
          setOpenEmpresasModal(false);
          setUsuarioEmpresas(null);
        }}
      />

      <UsuarioSenhaModal
        isOpen={openSenhaModal}
        usuario={usuarioSenha}
        onClose={() => {
          setOpenSenhaModal(false);
          setUsuarioSenha(null);
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

const emptyStyle: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontSize: 13,
  color: "#64748b",
};