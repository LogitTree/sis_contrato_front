import { useEffect, useState } from 'react';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';
import type { EmpresaContratada } from '../../types/EmpresaContratada';
import { layoutStyles } from '../../styles/layout';
import { tableStyles } from '../../styles/table';
import { buttonStyles } from '../../styles/buttons';
import { badgeStyles } from '../../styles/badges';
import { filterStyles } from '../../styles/filters';
import { toast } from 'react-toastify';
import {
    FiEdit,
    FiTrash2,
    FiChevronLeft,
    FiChevronRight,
    FiChevronUp,
    FiChevronDown
} from 'react-icons/fi';

export default function EmpresasList() {
    const [empresas, setEmpresas] = useState<EmpresaContratada[]>([]);
    const [filtroTexto, setFiltroTexto] = useState('');
    const [debouncedFiltro, setDebouncedFiltro] = useState(filtroTexto);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState<'id' | 'razao_social' | 'cnpj' | 'status'>('id');
    const [order, setOrder] = useState<'ASC' | 'DESC'>('ASC');


    // 🔢 Paginação
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(10);

    const navigate = useNavigate();

    const safeTotal = Number.isFinite(total) && total > 0 ? total : empresas.length;
    const totalPages = Math.max(1, Math.ceil(safeTotal / limit));


    function handleSort(column: typeof sort) {
        if (sort === column) {
            setOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSort(column);
            setOrder('ASC');
        }
    }

    function renderSortIcon(column: string) {
        if (sort !== column) return null;
        return order === 'ASC'
            ? <FiChevronUp size={14} />
            : <FiChevronDown size={14} />;
    }



    // 🔄 Buscar empresas
    async function fetchEmpresas() {
        setLoading(true);

        const params: any = {
            page,
            limit,
            sort,
            order,
        };


        if (debouncedFiltro) {
            if (/\d/.test(debouncedFiltro)) {
                params.cnpj = debouncedFiltro;
            } else {
                params.razao_social = debouncedFiltro;
            }
        }


        if (status) {
            params.status = status;
        }

        try {
            const response = await api.get('/empresas', { params });
            setEmpresas(response.data.data);
            setTotal(response.data.total);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar empresas');
        } finally {
            setLoading(false);
        }
    }

    // 🔄 Buscar ao mudar página ou filtros
    useEffect(() => {
        fetchEmpresas();
    }, [page, debouncedFiltro, status, sort, order]);

    useEffect(() => {
        setPage(1);
    }, [sort, order]);


    // 🔁 Resetar página quando filtros mudarem
    useEffect(() => {
        setPage(1);
    }, [filtroTexto, status]);

    // 🗑️ Excluir empresa
    async function handleDelete(id: number) {
        const confirm = window.confirm(
            'Tem certeza que deseja excluir esta empresa?'
        );

        if (!confirm) return;

        try {
            await api.delete(`/empresas/${id}`);
            toast.success('Empresa excluída com sucesso');
            fetchEmpresas();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao excluir empresa');
        }
    }
    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedFiltro(filtroTexto);
        }, 500); // ⏱️ tempo do debounce (ms)

        return () => clearTimeout(timeout);
    }, [filtroTexto]);

    if (loading) return <p>Carregando...</p>;

    return (
        <div style={layoutStyles.page}>
            <div style={layoutStyles.header}>
                <h1 style={layoutStyles.title}>Empresas</h1>
                <button
                    style={buttonStyles.primary}
                    onClick={() => navigate('/empresas/nova')}
                >
                    + Nova Empresa
                </button>
            </div>

            <div style={layoutStyles.card}>
                {/* 🔎 Filtros */}
                <div style={filterStyles.container}>
                    <span style={filterStyles.title}>Filtro</span>

                    <div style={filterStyles.row}>
                        <input
                            type="text"
                            placeholder="Buscar por razão social ou CNPJ"
                            style={filterStyles.input}
                            value={filtroTexto}
                            onChange={(e) => setFiltroTexto(e.target.value)}
                        />

                        <select
                            style={filterStyles.select}
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">Todos os status</option>
                            <option value="ATIVA">Ativa</option>
                            <option value="INATIVA">Inativa</option>
                        </select>
                    </div>
                </div>

                {/* 📋 Tabela */}
                <table style={tableStyles.table}>
                    <thead>
                        <tr>
                            <th
                                style={{ ...tableStyles.th, width: '5%', cursor: 'pointer' }}
                                onClick={() => handleSort('id')}
                            >
                                ID {renderSortIcon('id')}
                            </th>

                            <th
                                style={{ ...tableStyles.th, width: '35%', cursor: 'pointer' }}
                                onClick={() => handleSort('razao_social')}
                            >
                                Razão Social {renderSortIcon('razao_social')}
                            </th>

                            <th
                                style={{ ...tableStyles.th, width: '25%', cursor: 'pointer' }}
                                onClick={() => handleSort('cnpj')}
                            >
                                CNPJ {renderSortIcon('cnpj')}
                            </th>

                            <th
                                style={{ ...tableStyles.th, width: '15%', cursor: 'pointer' }}
                                onClick={() => handleSort('status')}
                            >
                                Status {renderSortIcon('status')}
                            </th>

                            <th style={{ ...tableStyles.th, width: '20%' }}>
                                Ações
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {empresas.map((e) => (
                            <tr key={e.id}>
                                <td style={tableStyles.td}>{e.id}</td>
                                <td style={tableStyles.td}>
                                    {e.razao_social}
                                </td>
                                <td style={tableStyles.td}>{e.cnpj}</td>
                                <td style={tableStyles.td}>
                                    <span
                                        style={{
                                            ...badgeStyles.base,
                                            ...(e.status === 'ATIVA'
                                                ? badgeStyles.success
                                                : badgeStyles.danger),
                                        }}
                                    >
                                        {e.status}
                                    </span>
                                </td>
                                <td style={tableStyles.td}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            title="Editar"
                                            onClick={() =>
                                                navigate(
                                                    `/empresas/${e.id}/editar`
                                                )
                                            }
                                            style={{
                                                ...buttonStyles.icon,
                                                color: '#2563eb',
                                            }}
                                        >
                                            <FiEdit size={18} />
                                        </button>

                                        <button
                                            title="Excluir"
                                            onClick={() =>
                                                handleDelete(e.id)
                                            }
                                            style={{
                                                ...buttonStyles.icon,
                                                color: '#dc2626',
                                            }}
                                        >
                                            <FiTrash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* 🔢 Paginação (sempre visível se houver dados) */}
                {empresas.length > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '16px',
                        }}
                    >
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((prev) => prev - 1)}
                            style={buttonStyles.paginationButtonStyle(page === 1)}
                        >
                            <FiChevronLeft size={20} />
                        </button>

                        <span
                            style={{
                                fontWeight: 600,
                                color: '#0f172a', // 🔥 força visibilidade
                                minWidth: '90px',
                                textAlign: 'center',
                            }}
                        >
                            Página {page} de {totalPages}
                        </span>


                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage((prev) => prev + 1)}
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
