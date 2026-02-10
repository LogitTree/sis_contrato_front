import { useEffect, useState } from 'react';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';
import type { Produto } from '../../types/Produto';

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
} from 'react-icons/fi';

// import { formatMoedaBR } from '../../utils/masks';

export default function ProdutosList() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // ordenação
  const [orderBy, setOrderBy] = useState<
    'id' | 'nome' | 'grupo' | 'subgrupo'
  >('id');
  const [orderDir, setOrderDir] = useState<'ASC' | 'DESC'>('ASC');

  // paginação
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const navigate = useNavigate();

  async function carregarProdutos() {
    setLoading(true);

    const params: any = {
      page,
      limit,
      orderBy,
      orderDir,
    };

    if (filtroNome) params.nome = filtroNome;
    if (filtroStatus) params.ativo = filtroStatus === 'ATIVO';

    try {
      const res = await api.get('/produtos', { params });
      setProdutos(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    setPage(1);
    carregarProdutos();
  }, [filtroNome, filtroStatus, orderBy, orderDir]);

  useEffect(() => {
    carregarProdutos();
  }, [page]);

  function handleSort(coluna: 'id' | 'nome' | 'grupo' | 'subgrupo') {
    if (orderBy === coluna) {
      setOrderDir(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setOrderBy(coluna);
      setOrderDir('ASC');
    }
  }

  async function handleDelete(id: number) {
    const confirm = window.confirm(
      'Tem certeza que deseja excluir este produto?'
    );
    if (!confirm) return;

    try {
      await api.delete(`/produtos/${id}`);
      carregarProdutos();
      toast.success('Produto excluído com sucesso');
    } catch {
      toast.error('Erro ao excluir produto');
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Produtos</h1>
      </div>

      {/* FILTROS */}
      <div
        style={{
          ...layoutStyles.card,
          height: 'auto',
          minHeight: 'unset',
          flex: 'unset',
          paddingBottom: 16,
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Buscar por nome"
            value={filtroNome}
            onChange={e => setFiltroNome(e.target.value)}
            style={filterStyles.input}
          />

          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            style={filterStyles.select}
          >
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>

          {(filtroNome || filtroStatus) && (
            <button
              style={buttonStyles.link}
              onClick={() => {
                setFiltroNome('');
                setFiltroStatus('');
              }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{ marginBottom: 16 }}>
        <button
          style={buttonStyles.primary}
          onClick={() => navigate('/produtos/novo')}
        >
          + Novo Produto
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
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th
                      style={{ ...tableStyles.th, width: '5%', cursor: 'pointer' }}
                      onClick={() => handleSort('id')}
                    >
                      ID {orderBy === 'id' && (orderDir === 'ASC' ? '▲' : '▼')}
                    </th>

                    <th
                      style={{ ...tableStyles.th, width: '20%', cursor: 'pointer' }}
                      onClick={() => handleSort('nome')}
                    >
                      Nome {orderBy === 'nome' && (orderDir === 'ASC' ? '▲' : '▼')}
                    </th>

                    <th style={{ ...tableStyles.th, width: '15%' }}>Grupo</th>
                    <th style={{ ...tableStyles.th, width: '15%' }}>Subgrupo</th>
                    <th style={{ ...tableStyles.th, width: '8%' }}>Unidade</th>
                    <th style={{ ...tableStyles.th, width: '10%' }}>Preço Ref.</th>
                    <th style={{ ...tableStyles.th, width: '10%' }}>Custo Médio</th>
                    <th style={{ ...tableStyles.th, width: '7%' }}>Status</th>

                    {/* 🔥 AÇÕES — FIXO EM PX */}
                    <th
                      style={{
                        ...tableStyles.th,
                        minWidth: 120,
                        width: 120,
                        maxWidth: 120,
                        textAlign: 'center',
                      }}
                    >
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {produtos.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: 20 }}>
                        Nenhum produto encontrado.
                      </td>
                    </tr>
                  )}

                  {produtos.map((p, index) => (
                    <tr
                      key={p.id}
                      style={{
                        background: index % 2 === 0 ? '#fff' : '#f9fafb',
                      }}
                    >
                      <td style={tableStyles.td}>{p.id}</td>
                      <td style={tableStyles.td}>{p.nome}</td>
                      <td style={tableStyles.td}>{p.grupo?.nome || '-'}</td>
                      <td style={tableStyles.td}>{p.subgrupo?.nome || '-'}</td>
                      <td style={tableStyles.td}>{p.unidade}</td>
                      <td style={tableStyles.td}>{(p.preco_referencia)}</td>
                      <td style={tableStyles.td}>{(p.custo_medio)}</td>

                      <td style={tableStyles.td}>
                        <span
                          style={{
                            ...badgeStyles.base,
                            ...((p.ativo)
                              ? badgeStyles.success
                              : badgeStyles.danger),
                          }}
                        >
                          {p.ativo ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </td>

                      {/* 🔥 AÇÕES — FIXO EM PX */}
                      <td
                        style={{
                          ...tableStyles.td,
                          minWidth: 120,
                          width: 120,
                          maxWidth: 120,
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <button
                            style={buttonStyles.icon}
                            onClick={() => navigate(`/produtos/${p.id}/editar`)}
                          >
                            <FiEdit size={18} color="#2563eb" />

                          </button>

                          <button
                            style={buttonStyles.icon}
                            onClick={() => handleDelete(p.id)}
                          >
                            <FiTrash2 size={18} color="#dc2626" />

                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINAÇÃO */}
            {produtos.length > 0 && (
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
                  onClick={() => setPage(prev => prev - 1)}
                  style={buttonStyles.paginationButtonStyle(page === 1)}
                >
                  <FiChevronLeft size={20} />
                </button>

                <span
                  style={{
                    fontWeight: 600,
                    color: '#0f172a',
                    minWidth: '90px',
                    textAlign: 'center',
                  }}
                >
                  Página {page} de {totalPages || 1}
                </span>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(prev => prev + 1)}
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
