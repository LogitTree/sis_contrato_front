import { useEffect, useState } from 'react';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';
import type { Produto } from '../../types/Produto';

import { layoutStyles } from '../../styles/layout';
import { tableStyles } from '../../styles/table';
import { buttonStyles } from '../../styles/buttons';
import { filterStyles } from '../../styles/filters';

import { toast } from 'react-toastify';
import { FiEdit, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function ProdutosList() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroNome, setFiltroNome] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // ✅ Ordenação só do que faz sentido na tabela atual
  const [orderBy, setOrderBy] = useState<'id' | 'nome'>('id');
  const [orderDir, setOrderDir] = useState<'ASC' | 'DESC'>('ASC');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Debounce nos filtros/ordenação
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      carregarProdutos();
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroNome, filtroStatus, orderBy, orderDir]);

  // ✅ Paginação imediata
  useEffect(() => {
    carregarProdutos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      await api.delete(`/produtos/${id}`);
      toast.success('Produto excluído com sucesso');
      carregarProdutos();
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
        <div style={{ fontSize: 13, color: '#64748b' }}>
          {total} produto(s) encontrado(s)
        </div>
      </div>

      {/* FILTROS */}
      <div style={layoutStyles.cardCompact}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 16,
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
              Nome
            </label>
            <input
              type="text"
              placeholder="Buscar produto"
              value={filtroNome}
              onChange={e => setFiltroNome(e.target.value)}
              style={{
                ...filterStyles.input,
                height: 36,
                padding: '0 12px',
                boxSizing: 'border-box',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 220 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
              Status
            </label>
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              style={{
                ...filterStyles.select,
                height: 36,
                padding: '0 12px',
                boxSizing: 'border-box',
                width: '100%',
              }}
            >
              <option value="">Todos</option>
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>

          {(filtroNome || filtroStatus) && (
            <button
              style={{ ...buttonStyles.link, marginBottom: 2 }}
              onClick={() => {
                setFiltroNome('');
                setFiltroStatus('');
              }}
              disabled={loading}
              title="Limpar filtros"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* BOTÕES */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          margin: '12px 0 16px',
        }}
      >
        <button style={buttonStyles.link} onClick={() => navigate(-1)} disabled={loading}>
          Voltar
        </button>

        <button
          style={buttonStyles.primary}
          onClick={() => navigate('/produtos/novo')}
          disabled={loading}
        >
          + Novo Produto
        </button>
      </div>

      {/* TABELA */}
      <div style={layoutStyles.card}>
        <div style={{ paddingBottom: 12, fontSize: 13, color: '#64748b' }}>
          {loading
            ? 'Atualizando lista...'
            : `Exibindo ${produtos.length} de ${total} registro(s)`}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ ...tableStyles.table, tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th
                  style={{ ...tableStyles.th, width: 60, cursor: 'pointer' }}
                  onClick={() => handleSort('id')}
                  title="Ordenar por ID"
                >
                  ID {orderBy === 'id' && (orderDir === 'ASC' ? '▲' : '▼')}
                </th>

                <th
                  style={{ ...tableStyles.th, width: '50%', cursor: 'pointer' }}
                  onClick={() => handleSort('nome')}
                  title="Ordenar por Nome"
                >
                  Nome {orderBy === 'nome' && (orderDir === 'ASC' ? '▲' : '▼')}
                </th>

                <th style={{ ...tableStyles.th, width: '26%' }}>
                  Grupo / Subgrupo
                </th>

                <th style={{ ...tableStyles.th, width: 90 }}>Unidade</th>

                <th style={{ ...tableStyles.th, width: 110, textAlign: 'right' }}>
                  Preço Ref.
                </th>

                <th style={{ ...tableStyles.th, width: 110, textAlign: 'right' }}>
                  Custo Médio
                </th>

                <th
                  style={{ ...tableStyles.th, width: 120, textAlign: 'center' }}
                >
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {produtos.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>
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

                  <td
                    style={{
                      ...tableStyles.td,
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                    }}
                    title={p.nome}
                  >
                    {p.nome}
                  </td>

                  <td
                    style={{
                      ...tableStyles.td,
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      lineHeight: 1.4,
                    }}
                  >
                    <div>
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>Grupo: </span>
                      {p.grupo?.nome || '-'}
                    </div>

                    <div style={{ marginTop: 2 }}>
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>
                        Subgrupo:{' '}
                      </span>
                      {p.subgrupo?.nome || '-'}
                    </div>
                  </td>

                  <td style={tableStyles.td}>{p.unidade}</td>

                  <td style={{ ...tableStyles.td, textAlign: 'right', paddingRight: 8 }}>
                    {p.preco_referencia}
                  </td>

                  <td style={{ ...tableStyles.td, textAlign: 'right', paddingRight: 8 }}>
                    {p.custo_medio}
                  </td>

                  <td style={{ ...tableStyles.td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        style={buttonStyles.icon}
                        onClick={() => navigate(`/produtos/${p.id}/editar`)}
                        disabled={loading}
                        title="Editar"
                      >
                        <FiEdit size={18} color="#2563eb" />
                      </button>

                      <button
                        style={buttonStyles.icon}
                        onClick={() => handleDelete(p.id)}
                        disabled={loading}
                        title="Excluir"
                      >
                        <FiTrash2 size={18} color="#dc2626" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* ✅ placeholder discreto durante loading (evita “vazio”) */}
              {loading && produtos.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                    Carregando registros...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
        {totalPages > 1 && (
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
              disabled={loading || page === 1}
              onClick={() => setPage(prev => prev - 1)}
              style={buttonStyles.paginationButtonStyle(loading || page === 1)}
              title="Página anterior"
            >
              <FiChevronLeft size={20} />
            </button>

            <span style={{ fontWeight: 600 }}>
              Página {page} de {totalPages}
            </span>

            <button
              disabled={loading || page >= totalPages}
              onClick={() => setPage(prev => prev + 1)}
              style={buttonStyles.paginationButtonStyle(loading || page >= totalPages)}
              title="Próxima página"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}