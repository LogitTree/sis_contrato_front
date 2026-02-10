import { useEffect, useState } from 'react';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';

import { layoutStyles } from '../../styles/layout';
import { tableStyles } from '../../styles/table';
import { buttonStyles } from '../../styles/buttons';
import { filterStyles } from '../../styles/filters';

import {
  FiEdit,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

import { toast } from 'react-toastify';

/* =========================
   Types
========================= */
type Subgrupo = {
  id: number;
  nome: string;
  grupo_id: number;
  // futuramente pode vir assim:
  // grupo?: { id: number; nome: string };
};

/* =========================
   Component
========================= */
export default function SubgrupoList() {
  const navigate = useNavigate();

  const [subgrupos, setSubgrupos] = useState<Subgrupo[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [filtroNome, setFiltroNome] = useState('');

  // ordenação
  const [orderBy, setOrderBy] = useState<'id' | 'nome'>('id');
  const [orderDir, setOrderDir] = useState<'ASC' | 'DESC'>('ASC');

  // paginação
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

async function carregarSubgrupos() {
  setLoading(true);

  try {
    const res = await api.get('/subgrupos', {
      params: {
        page,
        limit,
        orderBy,
        orderDir,
        nome: filtroNome || undefined,
      },
    });

    // 🔥 NORMALIZAÇÃO DO RETORNO
    if (Array.isArray(res.data)) {
      // backend retorna array simples
      setSubgrupos(res.data);
      setTotal(res.data.length);
    } else {
      // backend retorna { data, total }
      setSubgrupos(res.data.data || []);
      setTotal(res.data.total || 0);
    }
  } catch {
    toast.error('Erro ao carregar subgrupos');
    setSubgrupos([]);
    setTotal(0);
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    carregarSubgrupos();
  }, []);

  useEffect(() => {
    setPage(1);
    carregarSubgrupos();
  }, [filtroNome, orderBy, orderDir]);

  useEffect(() => {
    carregarSubgrupos();
  }, [page]);

  function handleSort(coluna: 'id' | 'nome') {
    if (orderBy === coluna) {
      setOrderDir(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setOrderBy(coluna);
      setOrderDir('ASC');
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Deseja excluir este subgrupo?')) return;

    try {
      await api.delete(`/subgrupos/${id}`);
      toast.success('Subgrupo excluído');
      carregarSubgrupos();
    } catch {
      toast.error('Erro ao excluir subgrupo');
    }
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Subgrupos</h1>
      </div>

      {/* FILTRO */}
      <div
        style={{
          ...layoutStyles.card,
          padding: '12px 16px',
          marginBottom: 12,
          minHeight: 'unset',
          height: 'auto',
          flex: 'unset',
        }}
      >
        <input
          type="text"
          placeholder="Buscar por nome"
          value={filtroNome}
          onChange={e => setFiltroNome(e.target.value)}
          style={{
            ...filterStyles.input,
            height: 36,
          }}
        />
      </div>

      {/* ACTIONS */}
      <div style={{ marginBottom: 16 }}>
        <button
          style={buttonStyles.primary}
          onClick={() => navigate('/subgrupos/novo')}
        >
          + Novo Subgrupo
        </button>

        <button
          style={{ ...buttonStyles.link, marginLeft: 12 }}
          onClick={() => navigate(-1)}
        >
          Voltar
        </button>
      </div>

      {/* TABELA */}
      <div style={layoutStyles.card}>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <>
            <table style={tableStyles.table}>
              <thead>
                <tr>
                  <th
                    style={{ ...tableStyles.th, width: '10%', cursor: 'pointer' }}
                    onClick={() => handleSort('id')}
                  >
                    ID {orderBy === 'id' && (orderDir === 'ASC' ? '▲' : '▼')}
                  </th>

                  <th
                    style={{ ...tableStyles.th, cursor: 'pointer' }}
                    onClick={() => handleSort('nome')}
                  >
                    Nome {orderBy === 'nome' && (orderDir === 'ASC' ? '▲' : '▼')}
                  </th>

                  <th
                    style={{
                      ...tableStyles.th,
                      width: '15%',
                      textAlign: 'center',
                    }}
                  >
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {subgrupos.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: 20 }}>
                      Nenhum subgrupo encontrado
                    </td>
                  </tr>
                )}

                {subgrupos.map((sg, index) => (
                  <tr
                    key={sg.id}
                    style={{
                      background: index % 2 ? '#f9fafb' : '#fff',
                    }}
                  >
                    <td style={tableStyles.td}>{sg.id}</td>
                    <td style={tableStyles.td}>{sg.nome}</td>

                    {/* AÇÕES */}
                    <td
                      style={{
                        ...tableStyles.td,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        <button
                          title="Editar"
                          style={{
                            ...buttonStyles.icon,
                            color: '#2563eb',
                          }}
                          onClick={() =>
                            navigate(`/subgrupos/${sg.id}/editar`)
                          }
                        >
                          <FiEdit size={18} />
                        </button>

                        <button
                          title="Excluir"
                          style={{
                            ...buttonStyles.icon,
                            color: '#dc2626',
                          }}
                          onClick={() => handleDelete(sg.id)}
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* PAGINAÇÃO */}
            {subgrupos.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 16,
                }}
              >
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={buttonStyles.paginationButtonStyle(page === 1)}
                >
                  <FiChevronLeft size={20} />
                </button>

                <span style={{ fontWeight: 600 }}>
                  Página {page} de {totalPages}
                </span>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={buttonStyles.paginationButtonStyle(page >= totalPages)}
                >
                  <FiChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
