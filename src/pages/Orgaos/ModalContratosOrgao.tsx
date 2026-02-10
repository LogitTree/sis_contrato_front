import { useEffect, useState } from 'react';
import api from '../../api/api';
import { buttonStyles } from '../../styles/buttons';
import { tableStyles } from '../../styles/table';
import { toast } from 'react-toastify';
import { formatarDataBR } from '../../utils/masks';

type Props = {
  orgaoId: number;
  onClose: () => void;
};

type ContratoResumo = {
  id: number;
  numero: string;
  data_inicio: string | null;
  data_fim: string | null;
};

export default function ModalContratosOrgao({ orgaoId, onClose }: Props) {
  const [contratos, setContratos] = useState<ContratoResumo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/orgaocontratante/${orgaoId}/contratos`);
        setContratos(res.data);
      } catch {
        toast.error('Erro ao carregar contratos');
        onClose();
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orgaoId, onClose]);

  return (
    <div style={overlay}>
      <div style={modal}>
        {/* ===== HEADER ===== */}
        <div style={header}>
          <h2 style={title}>📄 Contratos do Órgão</h2>
          <p style={subtitle}>
            Lista de contratos vinculados a este órgão
          </p>
        </div>

        {/* ===== CONTENT ===== */}
        <div style={content}>
          {loading ? (
            <p style={{ color: '#0f172a' }}>Carregando...</p>
          ) : contratos.length === 0 ? (
            <p style={{ color: '#0f172a' }}>
              Nenhum contrato encontrado.
            </p>
          ) : (
            <table
              style={{
                ...tableStyles.table,
                color: '#0f172a',
                borderCollapse: 'separate',
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  <th style={th}>Contrato</th>
                  <th style={{ ...th, textAlign: 'center' }}>
                    Início da Vigência
                  </th>
                  <th style={{ ...th, textAlign: 'center' }}>
                    Fim da Vigência
                  </th>
                </tr>
              </thead>

              <tbody>
                {contratos.map((c) => (
                  <tr key={c.id} style={tr}>
                    <td style={td}>{c.numero}</td>

                    <td style={{ ...td, textAlign: 'center' }}>
                      {formatarDataBR(c.data_inicio)}
                    </td>

                    <td style={{ ...td, textAlign: 'center' }}>
                      {formatarDataBR(c.data_fim)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ===== FOOTER ===== */}
        <div style={footer}>
          <button style={buttonStyles.secondary} onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== ESTILOS ===== */

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modal: React.CSSProperties = {
  background: '#fff',
  borderRadius: 10,
  width: 720,
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
};

const content: React.CSSProperties = {
  padding: 20,
  overflowY: 'auto',
  flex: 1,
};

const header: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid #e5e7eb',
  background: '#f9fafb',
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: '#0f172a',
};

const subtitle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: 13,
  color: '#475569',
};

const footer: React.CSSProperties = {
  padding: 16,
  borderTop: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'flex-end',
};

/* ===== TABELA ===== */

const th: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 13,
  fontWeight: 600,
  color: '#334155',
  background: '#f1f5f9',
  borderBottom: '1px solid #e5e7eb',
};

const td: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 14,
  borderBottom: '1px solid #e5e7eb',
};

const tr: React.CSSProperties = {
  transition: 'background 0.15s ease',
};
