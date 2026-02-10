import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { layoutStyles } from '../../styles/layout';
import { buttonStyles } from '../../styles/buttons';
import { formStyles } from '../../styles/form';
import api from '../../api/api';
// import { parseDecimalBR } from '../../utils/number';

import { toast } from 'react-toastify';

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

  ativo: boolean;
};

/* =========================
   Component
========================= */
export default function ProdutoEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

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
    ativo: true,
  });

  /* =========================
     Styles (igual Create)
  ========================= */
  const sectionStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
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
     Load Grupos
  ========================= */
  useEffect(() => {
    async function carregarGrupos() {
      try {
        const res = await api.get('/grupos', {
          params: { limit: 1000 },
        });

        setGrupos(res.data.data || []);
      } catch {
        toast.error('Erro ao carregar grupos');
        setGrupos([]);
      }
    }

    carregarGrupos();
  }, []);

  /* =========================
     Load Produto
  ========================= */
  useEffect(() => {
    async function loadProduto() {
      try {
        const response = await api.get(`/produtos/${id}`);
        const data = response.data;

        setForm({
          nome: data.nome ?? '',
          descricao: data.descricao ?? '',
          unidade: data.unidade ?? '',
          grupo_id: data.grupo_id ? String(data.grupo_id) : '',
          subgrupo_id: data.subgrupo_id ? String(data.subgrupo_id) : '',
          preco_referencia: String(data.preco_referencia ?? ''),
          custo_medio: String(data.custo_medio ?? ''),
          ult_custo: String(data.ult_custo ?? ''),
          ativo: Boolean(data.ativo),
        });

        const grupoId = data.grupo_id ? String(data.grupo_id) : '';

        setForm({
          nome: data.nome ?? '',
          descricao: data.descricao ?? '',
          unidade: data.unidade ?? '',
          grupo_id: grupoId,
          subgrupo_id: data.subgrupo_id ? String(data.subgrupo_id) : '',
          preco_referencia: String(data.preco_referencia ?? ''),
          custo_medio: String(data.custo_medio ?? ''),
          ult_custo: String(data.ult_custo ?? ''),
          ativo: Boolean(data.ativo),
        });

        // ⬇️ só carrega subgrupos DEPOIS de normalizar
        if (grupoId) {
          try {
            const sg = await api.get('/subgrupos', {
              params: { grupo_id: grupoId },
            });

            setSubgrupos(Array.isArray(sg.data) ? sg.data : []);
          } catch {
            setSubgrupos([]);
          }
        }

      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar produto');
        navigate('/produtos');
      } finally {
        setLoadingData(false);
      }
    }

    loadProduto();
  }, [id, navigate]);

  /* =========================
     Load Subgrupos on Grupo change
  ========================= */
  useEffect(() => {
    if (!form.grupo_id) {
      setSubgrupos([]);
      setForm(prev => ({ ...prev, subgrupo_id: '' }));
      return;
    }

    api
      .get('/subgrupos', { params: { grupo_id: form.grupo_id } })
      .then(res => setSubgrupos(res.data.data || []))
      .catch(() => setSubgrupos([]));
  }, [form.grupo_id]);

  /* =========================
     Handlers
  ========================= */
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
      const payload = {
        nome: form.nome,
        descricao: form.descricao,
        unidade: form.unidade,
        grupo_id: form.grupo_id || null,
        subgrupo_id: form.subgrupo_id || null,
        preco_referencia: (form.preco_referencia),
        custo_medio: (form.custo_medio),
        ult_custo: (form.ult_custo),
        ativo: form.ativo,
      };

      await api.put(`/produtos/${id}`, payload);

      toast.success('Produto atualizado com sucesso');
      navigate('/produtos');
    } catch {
      toast.error('Erro ao atualizar produto');
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     Render
  ========================= */
  if (loadingData) {
    return (
      <div style={layoutStyles.page}>
        <div style={layoutStyles.header}>
          <h1 style={layoutStyles.title}>Editar Produto</h1>
        </div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Editar Produto</h1>
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
                  disabled={!form.grupo_id}
                  style={{
                    ...formStyles.select,
                    opacity: form.grupo_id ? 1 : 0.6,
                  }}
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

          {/* ===== Status ===== */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Status</div>
            <div style={dividerStyle} />

            <select
              value={form.ativo ? 'ATIVO' : 'INATIVO'}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  ativo: e.target.value === 'ATIVO',
                }))
              }
              style={formStyles.select}
            >
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>
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
