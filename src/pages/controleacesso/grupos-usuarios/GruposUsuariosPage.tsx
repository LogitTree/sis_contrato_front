import { useMemo, useState } from "react";
import { FiShield, FiUsers, FiUserCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import PageShell from "../../../components/executive/PageShell";
import PageHeader from "../../../components/executive/PageHeader";
import SummaryCard from "../../../components/executive/SummaryCard";
import DataCard from "../../../components/executive/DataCard";
import SearchBox from "../../../components/executive/SearchBox";
import StatusBadge from "../../../components/executive/StatusBadge";

import GrupoUsuarioModal from "./GrupoUsuarioModal";
import { useGruposUsuarios } from "./hooks/useGruposUsuarios";

import { buttonStyles } from "../../../styles/buttons";

import type { GrupoUsuario } from "../../../services/controleacesso/grupoUsuarioService";

export default function GruposUsuariosPage() {
    const [search, setSearch] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<GrupoUsuario | null>(null);

    const { data, isLoading, mutateCreate, mutateUpdate, mutateRemove } =
        useGruposUsuarios();

    const grupos = useMemo(() => data || [], [data]);

    const navigate = useNavigate();

    function handlePermissoes(item: GrupoUsuario) {
        navigate(`/controle-acesso/grupos-usuarios/${item.id}/permissoes`);
    }

    const filteredData = useMemo(() => {
        const term = search.toLowerCase().trim();

        if (!term) return grupos;

        return grupos.filter((item) => {
            return (
                item.nome?.toLowerCase().includes(term) ||
                item.descricao?.toLowerCase().includes(term) ||
                item.status?.toLowerCase().includes(term)
            );
        });
    }, [grupos, search]);

    function handleNew() {
        setSelectedItem(null);
        setOpenModal(true);
    }

    function handleEdit(item: GrupoUsuario) {
        setSelectedItem(item);
        setOpenModal(true);
    }

    async function handleDelete(item: GrupoUsuario) {
        const confirmed = window.confirm(
            `Deseja realmente inativar o grupo "${item.nome}"?`
        );

        if (!confirmed) return;

        await mutateRemove(item.id);
    }

    async function handleSubmit(values: any) {
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
                title="Grupos de Usuários"
                subtitle="Gerencie os perfis de acesso e organize permissões por grupo."
                action={
                    <button style={buttonStyles.primary} onClick={handleNew}>
                        Novo grupo
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
                    label="Total de grupos"
                    value={grupos.length}
                    icon={<FiUsers size={18} />}
                />

                <SummaryCard
                    label="Grupos ativos"
                    value={grupos.filter((item) => item.status === "ATIVO").length}
                    tone="success"
                    icon={<FiUserCheck size={18} />}
                />

                <SummaryCard
                    label="Inativos"
                    value={grupos.filter((item) => item.status === "INATIVO").length}
                    tone="danger"
                    icon={<FiShield size={18} />}
                />

                <SummaryCard
                    label="Controle de acesso"
                    value="Grupos"
                    tone="info"
                    icon={<FiShield size={18} />}
                />
            </div>

            <DataCard
                title="Cadastro de grupos"
                subtitle="Controle os grupos que receberão permissões no sistema."
                right={
                    <div style={{ width: 360 }}>
                        <SearchBox
                            value={search}
                            onChange={setSearch}
                            placeholder="Buscar por nome, descrição ou status"
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
                                {["ID", "Grupo", "Descrição", "Status", "Ações"].map(
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
                                    <td colSpan={5} style={emptyStyle}>
                                        Carregando grupos...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={emptyStyle}>
                                        Nenhum grupo encontrado.
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

                                        <td style={tdStyle}>
                                            <div
                                                style={{
                                                    maxWidth: 460,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    color: "#64748b",
                                                }}
                                            >
                                                {item.descricao || "Sem descrição"}
                                            </div>
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
                                                    onClick={() => handlePermissoes(item)}
                                                >
                                                    Permissões
                                                </button>

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

            <GrupoUsuarioModal
                isOpen={openModal}
                initialData={selectedItem}
                loading={isLoading}
                onClose={() => {
                    setOpenModal(false);
                    setSelectedItem(null);
                }}
                onSubmit={handleSubmit}
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