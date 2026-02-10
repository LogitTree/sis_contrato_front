import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

import { layoutStyles } from '../../styles/layout';
import { tableStyles } from '../../styles/table';
import { buttonStyles } from '../../styles/buttons';
import { badgeStyles } from '../../styles/badges';
import { filterStyles } from '../../styles/filters';

import { FiEdit, FiCheckSquare, FiList } from 'react-icons/fi';
import { toast } from 'react-toastify';

import { moedaBR, formatarDataBR } from '../../utils/masks';

type PedidoVenda = {
  id: number;
  status: string;
  createdAt: string;
  total?: number;
  contrato?: {
    numero: string;
  };
};

export default function PedidoVendaList() {
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState<PedidoVenda[]>([]);
  const [loading, setLoading] = useState(false);

  /* ===== filtros ===== */
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  /* ===== paginação ===== */
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  /* =========================
     LOAD LIST
  ========================= */
  async function carregarPedidos() {
    setLoading(true);
    try {
      const res = await api.get('/pedidovenda', {
        params: {
          search,
          status,
          page,
          limit,
        },
      });

      // ajuste conforme seu backend (array simples ou { rows, count })
      setPedidos(res.data.rows || res.data);
      setTotal(res.data.count || res.data.length);
    } catch (error) {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarPedidos();
  }, [page]);

  /* =========================
     APROVAR PEDIDO
  ========================= */
  async function aprovarPedido(id: number) {
    if (!window.confirm('Deseja aprovar este pedido?')) return;

    try {
      const res = await api.post(`/pedidovenda/${id}/aprovar`);

      if (res.data.ok) {
        toast.success('Pedido aprovado com sucesso');
      } else {
        toast.warning('Pedido possui itens bloqueados');
      }

      carregarPedidos();
    } catch (error) {
      toast.error('Erro ao aprovar pedido');
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={layoutStyles.page}>
      {/* ===== HEADER ===== */}
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Pedidos de Venda</h1>

        <button
          style={buttonStyles.primary}
          onClick={() => navigate('/pedidos-venda/novo')}
        >
          + Novo Pedido
        </button>
      </div>

      {/* ===== FILTROS ===== */}
            <div
        style={{
          ...layoutStyles.card,
          height: 'auto',
          minHeight: 'unset',
          flex: 'unset',
          paddingBottom: 16,
          marginBottom: 8
        }}
      >
        <div style={filterStyles.row}>
          <input
            placeholder="Buscar por contrato..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={filterStyles.input}
          />

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={filterStyles.select}
          >
            <option value="">Todos os status</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="APROVADO">Aprovado</option>
          </select>

          <button
            style={buttonStyles.secondary}
            onClick={() => {
              setPage(1);
              carregarPedidos();
            }}
          >
            Filtrar
          </button>
        </div>
      </div>

      {/* ===== TABELA ===== */}
      <div style={layoutStyles.card}>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.th}>Pedido</th>
              <th style={tableStyles.th}>Contrato</th>
              <th style={tableStyles.th}>Data</th>
              <th style={tableStyles.th}>Total</th>
              <th style={tableStyles.th}>Status</th>
              <th style={tableStyles.th}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>
                  Carregando...
                </td>
              </tr>
            )}

            {!loading && pedidos.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>
                  Nenhum pedido encontrado
                </td>
              </tr>
            )}

            {pedidos.map(p => (
              <tr key={p.id}>
                <td style={tableStyles.td}>#{p.id}</td>
                <td style={tableStyles.td}>{p.contrato?.numero}</td>
                <td style={tableStyles.td}>{formatarDataBR(p.createdAt)}</td>
                <td style={tableStyles.td}>
                  {moedaBR(p.total || 0)}
                </td>
                <td style={tableStyles.td}>
                  <span
                    style={{
                      ...badgeStyles.base,
                      ...(p.status === 'APROVADO'
                        ? badgeStyles.success
                        : badgeStyles.warning),
                    }}
                  >
                    {p.status}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {p.status === 'RASCUNHO' && (
                    <button
                      style={buttonStyles.icon}
                      title="Editar"
                      onClick={() =>
                        navigate(`/pedidos-venda/${p.id}/editar`)
                      }
                    >
                      <FiEdit />
                    </button>
                  )}

                  <button
                    style={buttonStyles.icon}
                    title="Itens"
                    onClick={() =>
                      navigate(`/pedidos-venda/${p.id}/itens`)
                    }
                  >
                    <FiList />
                  </button>

                  {p.status === 'RASCUNHO' && (
                    <button
                      style={buttonStyles.icon}
                      title="Aprovar"
                      onClick={() => aprovarPedido(p.id)}
                    >
                      <FiCheckSquare />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ===== PAGINAÇÃO ===== */}
        {totalPages > 1 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button
              style={buttonStyles.secondary}
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Anterior
            </button>

            <span style={{ lineHeight: '36px' }}>
              Página {page} de {totalPages}
            </span>

            <button
              style={buttonStyles.secondary}
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
