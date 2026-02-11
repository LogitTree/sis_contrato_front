import { useEffect, useState } from 'react';
import api from '../../api/api';
import { buttonStyles } from '../../styles/buttons';
import { formStyles } from '../../styles/form';
import { toast } from 'react-toastify';

type Props = {
  contratoId: number;
  onClose: () => void;
  onSaved: () => void;
};

type Produto = {
  id: number;
  nome: string;
};

type FormState = {
  produto_id: string;
  unidade_contratada: string;
  fator_multiplicacao: string;
  preco_unitario_contratado: string;
  qtd_maxima_contratada: string;
};

/* =========================
   HELPERS
========================= */
function extrairArray(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.rows)) return res.rows;
  return [];
}

export default function ModalAdicionarItem({
  contratoId,
  onClose,
  onSaved,
}: Props) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    produto_id: '',
    unidade_contratada: '',
    fator_multiplicacao: '1',
    preco_unitario_contratado: '',
    qtd_maxima_contratada: '',
  });

  /* =========================
     LOAD PRODUTOS
  ========================= */
  useEffect(() => {
    api
      .get('/produtos')
      .then(res => {
        setProdutos(extrairArray(res.data));
      })
      .catch(() => {
        toast.error('Erro ao carregar produtos');
        setProdutos([]);
      });
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function salvarItem() {
    const {
      produto_id,
      unidade_contratada,
      fator_multiplicacao,
      preco_unitario_contratado,
      qtd_maxima_contratada,
    } = form;

    if (
      !produto_id ||
      !unidade_contratada ||
      !fator_multiplicacao ||
      !preco_unitario_contratado ||
      !qtd_maxima_contratada
    ) {
      toast.warning('Preencha todos os campos');
      return;
    }

    if (Number(fator_multiplicacao) <= 0) {
      toast.warning('Fator de multiplicação inválido');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/contratos/${contratoId}/itens`, {
        produto_id: Number(produto_id),
        unidade_contratada,
        fator_multiplicacao: Number(fator_multiplicacao),
        preco_unitario_contratado: Number(preco_unitario_contratado),
        qtd_maxima_contratada: Number(qtd_maxima_contratada),
        valor_maximo_contratado:
          Number(preco_unitario_contratado) *
          Number(qtd_maxima_contratada),
      });

      toast.success('Item adicionado com sucesso');
      onSaved();
      onClose();
    } catch (error) {
      toast.error('Erro ao adicionar item');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        {/* ===== HEADER ===== */}
        <div style={header}>
          <h2 style={title}>➕ Novo Item de Contrato</h2>
          <p style={subtitle}>
            Defina a unidade contratada e como o item impacta o estoque
          </p>
        </div>

        {/* ===== FORM ===== */}
        <div style={{ padding: 20 }}>
          {/* PRODUTO */}
          <div style={formStyles.field}>
            <label style={formStyles.label}>Produto</label>
            <select
              name="produto_id"
              value={form.produto_id}
              onChange={handleChange}
              style={formStyles.select}
            >
              <option value="">Selecione</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* UNIDADE + FATOR */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>Unidade Contratada</label>
              <input
                name="unidade_contratada"
                value={form.unidade_contratada}
                onChange={handleChange}
                placeholder="Ex: CX, UN"
                style={formStyles.input}
              />
            </div>

            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>Fator (estoque)</label>
              <input
                type="number"
                step="0.0001"
                name="fator_multiplicacao"
                value={form.fator_multiplicacao}
                onChange={handleChange}
                style={formStyles.input}
              />
            </div>
          </div>

          <div style={hint}>
            Exemplo: 1 <strong>Caixa</strong> contém <strong>50 unidades</strong> →
            fator = <strong>50</strong>
          </div>

          {/* PREÇO + QTD */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>Preço Unitário</label>
              <input
                type="number"
                step="0.01"
                name="preco_unitario_contratado"
                value={form.preco_unitario_contratado}
                onChange={handleChange}
                style={formStyles.input}
              />
            </div>

            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>Qtd Máxima</label>
              <input
                type="number"
                step="0.001"
                name="qtd_maxima_contratada"
                value={form.qtd_maxima_contratada}
                onChange={handleChange}
                style={formStyles.input}
              />
            </div>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div style={footer}>
          <button type="button" style={buttonStyles.link} onClick={onClose}>
            Cancelar
          </button>

          <button
            type="button"
            style={buttonStyles.primary}
            disabled={loading}
            onClick={salvarItem}
          >
            {loading ? 'Salvando...' : 'Salvar Item'}
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
  width: 520,
  boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
  overflow: 'hidden',
};

const header: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid #eee',
  background: '#f9fafb',
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
};

const subtitle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: 13,
  color: '#555',
};

const footer: React.CSSProperties = {
  padding: 16,
  borderTop: '1px solid #eee',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
};

const hint: React.CSSProperties = {
  fontSize: 12,
  color: '#555',
  margin: '4px 0 12px',
};
