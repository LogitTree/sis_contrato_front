import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { layoutStyles } from '../../styles/layout';
import { buttonStyles } from '../../styles/buttons';
import { formStyles } from '../../styles/form';
import api from '../../api/api';
import { toast } from 'react-toastify';
import { parseDecimalBR } from '../../utils/number';

/* =========================
   Types
========================= */
type Grupo = {
  id: number;
  nome: string;
};

type Subgrupo = {
  id: number;
  nome: string;
};

type ProdutoForm = {
  nome: string;
  descricao: string;
  unidade: string;

  grupo_id: string;
  subgrupo_id: string;

  preco_referencia: string;
  custo_medio: string;
  ult_custo: string;

  status: 'ATIVO' | 'INATIVO';
};

/* =========================
   Component
========================= */
export default function ProdutoCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [subgrupos, setSubgrupos] = useState<Subgrupo[]>([]);

  const [form, setForm] = useState<ProdutoForm>({
    nome: '',
    descricao: '',
    unidade: '',
    grupo_id: '',
    subgrupo_id: '',
    preco_referencia: '',
    custo_medio: '',
    ult_custo: '',
    status: 'ATIVO',
  });

  /* =========================
     Styles
  ========================= */
  const sectionStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 20,
    marginBottom: 1,
    backgroundColor: '#ffffff',
  };

  const sectionTitleStyle = {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    color: '#111827',
  };

  const dividerStyle = {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 20,
  };

  /* =========================
     Load grupos
  ========================= */
  useEffect(() => {
    api.get('/grupos').then(res => setGrupos(res.data));
  }, []);

  useEffect(() => {
    if (!form.grupo_id) {
      setSubgrupos([]);
      setForm(prev => ({ ...prev, subgrupo_id: '' }));
      return;
    }

    api
      .get('/subgrupos', { params: { grupo_id: form.grupo_id } })
      .then(res => setSubgrupos(res.data));
  }, [form.grupo_id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/produtos', {
        nome: form.nome,
        descricao: form.descricao,
        unidade: form.unidade,
        grupo_id: form.grupo_id || null,
        subgrupo_id: form.subgrupo_id || null,
        preco_referencia: parseDecimalBR(form.preco_referencia),
        custo_medio: parseDecimalBR(form.custo_medio),
        ult_custo: parseDecimalBR(form.ult_custo),
        ativo: form.status === 'ATIVO',
      });

      toast.success('Produto cadastrado com sucesso');
      navigate('/produtos');
    } catch {
      toast.error('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Novo Produto</h1>
      </div>

      <div style={layoutStyles.card}>
        <form onSubmit={handleSubmit} style={formStyles.form}>

          {/* ===== Dados do Produto ===== */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Dados do Produto</div>
            <div style={dividerStyle} />

            <div style={formStyles.field}>
              <label style={formStyles.label}>Nome</label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                style={formStyles.input}
                required
              />
            </div>

            <div style={formStyles.field}>
              <label style={formStyles.label}>Descrição</label>
              <input
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                style={formStyles.input}
              />
            </div>
          </div>

          {/* ===== Classificação ===== */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Classificação</div>
            <div style={dividerStyle} />

            <div style={formStyles.row}>
              <div style={formStyles.field}>
                <label style={formStyles.label}>Grupo</label>
                <select
                  name="grupo_id"
                  value={form.grupo_id}
                  onChange={handleChange}
                  style={formStyles.select}
                >
                  <option value="">Selecione</option>
                  {grupos.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>Subgrupo</label>
                <select
                  name="subgrupo_id"
                  value={form.subgrupo_id}
                  onChange={handleChange}
                  style={{
                    ...formStyles.select,
                    opacity: form.grupo_id ? 1 : 0.6,
                  }}
                  disabled={!form.grupo_id}
                >
                  <option value="">Selecione</option>
                  {subgrupos.map(sg => (
                    <option key={sg.id} value={sg.id}>
                      {sg.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ===== Valores ===== */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Valores</div>
            <div style={dividerStyle} />

            <div style={formStyles.row}>
              <div style={formStyles.field}>
                <label style={formStyles.label}>Preço de Referência</label>
                <input
                  name="preco_referencia"
                  value={form.preco_referencia}
                  onChange={handleChange}
                  style={{ ...formStyles.input, textAlign: 'right' }}
                />
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>Custo Médio</label>
                <input
                  name="custo_medio"
                  value={form.custo_medio}
                  onChange={handleChange}
                  style={{ ...formStyles.input, textAlign: 'right' }}
                />
              </div>

              <div style={formStyles.field}>
                <label style={formStyles.label}>Último Custo</label>
                <input
                  name="ult_custo"
                  value={form.ult_custo}
                  onChange={handleChange}
                  style={{ ...formStyles.input, textAlign: 'right' }}
                />
              </div>
            </div>
          </div>

          {/* ===== Actions ===== */}
          <div style={formStyles.actions}>
            <button
              type="submit"
              style={buttonStyles.primary}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>

            <button
              type="button"
              style={buttonStyles.link}
              onClick={() => navigate('/produtos')}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
