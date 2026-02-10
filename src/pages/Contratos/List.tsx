import { useEffect, useMemo, useState } from 'react';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';
import type { Contrato } from '../../types/Contrato';

import { layoutStyles } from '../../styles/layout';
import { tableStyles } from '../../styles/table';
import { buttonStyles } from '../../styles/buttons';
import { badgeStyles } from '../../styles/badges';
import { formStyles } from '../../styles/form';

import { FiEdit, FiTrash2, FiList } from 'react-icons/fi';

import { formatarDataBR } from '../../utils/masks';



export default function ContratosList() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const LIMIT = 10;


  /* ===== FILTROS ===== */
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroOrgao, setFiltroOrgao] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  async function carregarContratos(pagina = 1) {
    const res = await api.get('/contratos', {
      params: {
        page: pagina,
        limit: LIMIT,
      },
    });

    setContratos(res.data.data);
    setPage(res.data.page);
    setTotalPages(res.data.totalPages);
  }

  useEffect(() => {
    carregarContratos(1);
  }, []);


  /* ===== CONTRATOS FILTRADOS ===== */
  const contratosFiltrados = useMemo(() => {
    return contratos.filter(c => {
      const matchNumero =
        !filtroNumero ||
        c.numero.toLowerCase().includes(filtroNumero.toLowerCase());

      const matchOrgao =
        !filtroOrgao ||
        c.orgao?.nome
          ?.toLowerCase()
          .includes(filtroOrgao.toLowerCase());

      const matchStatus =
        !filtroStatus || c.status === filtroStatus;

      return matchNumero && matchOrgao && matchStatus;
    });
  }, [contratos, filtroNumero, filtroOrgao, filtroStatus]);

  return (
    <div style={layoutStyles.page}>
      {/* ===== HEADER ===== */}
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Contratos</h1>
        <button
          style={buttonStyles.primary}
          onClick={() => navigate('/contratos/novo')}
        >
          + Novo Contrato
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

        <div style={formStyles.row}>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Número</label>
            <input
              value={filtroNumero}
              onChange={e => setFiltroNumero(e.target.value)}
              style={formStyles.input}
              placeholder="Ex: 001/2025"
            />
          </div>

          <div style={formStyles.field}>
            <label style={formStyles.label}>Órgão</label>
            <input
              value={filtroOrgao}
              onChange={e => setFiltroOrgao(e.target.value)}
              style={formStyles.input}
              placeholder="Nome do órgão"
            />
          </div>

          <div style={formStyles.field}>
            <label style={formStyles.label}>Status</label>
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              style={formStyles.select}
            >
              <option value="">Todos</option>
              <option value="ATIVO">Ativo</option>
              <option value="SUSPENSO">Suspenso</option>
              <option value="ENCERRADO">Encerrado</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              style={buttonStyles.link}
              onClick={() => {
                setFiltroNumero('');
                setFiltroOrgao('');
                setFiltroStatus('');
              }}
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* ===== TABELA ===== */}
      <div style={layoutStyles.card}>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.th}>Nº</th>
              <th style={tableStyles.th}>Órgão</th>
              <th style={tableStyles.th}>Início</th>
              <th style={tableStyles.th}>Fim</th>
              <th style={tableStyles.th}>Status</th>
              <th style={tableStyles.th}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {contratosFiltrados.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{ ...tableStyles.td, textAlign: 'center', padding: 20 }}
                >
                  Nenhum contrato encontrado.
                </td>
              </tr>
            )}

            {contratosFiltrados.map(c => (
              <tr key={c.id}>
                <td style={tableStyles.td}>{c.numero}</td>
                <td style={tableStyles.td}>{c.orgao?.nome}</td>
                <td style={tableStyles.td}>{formatarDataBR(c.data_inicio)}</td>
                <td style={tableStyles.td}>{formatarDataBR(c.data_fim)}</td>
                <td style={tableStyles.td}>
                  <span
                    style={{
                      ...badgeStyles.base,
                      ...(c.status === 'ATIVO'
                        ? badgeStyles.success
                        : badgeStyles.warning),
                    }}
                  >
                    {c.status ?? '—'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={{ ...buttonStyles.icon, color: '#2563eb' }}
                    onClick={() => navigate(`/contratos/${c.id}/editar`)}
                    title="Editar"
                  >
                    <FiEdit size={18} />
                  </button>

                  <button
                    style={{ ...buttonStyles.icon, color: '#dc2626' }}
                    title="Excluir"
                    onClick={() =>
                      console.log('Excluir contrato', c.id)
                    }
                  >
                    <FiTrash2 size={18} />
                  </button>

                  <button
                    style={{
                      ...buttonStyles.icon,
                      color: '#111827', // preto elegante
                    }}
                    title="Itens do contrato"
                    onClick={() => navigate(`/contratos/${c.id}/itens`)}
                  >
                    <FiList size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 16,
          }}
        >
          <button
            style={buttonStyles.secondary}
            disabled={page === 1}
            onClick={() => carregarContratos(page - 1)}
          >
            ← Anterior
          </button>

          <span>
            Página {page} de {totalPages}
          </span>

          <button
            style={buttonStyles.secondary}
            disabled={page === totalPages}
            onClick={() => carregarContratos(page + 1)}
          >
            Próxima →
          </button>
        </div>

      </div>
    </div>
  );
}
