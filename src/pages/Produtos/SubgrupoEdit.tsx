import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { layoutStyles } from '../../styles/layout';
import { buttonStyles } from '../../styles/buttons';
import { formStyles } from '../../styles/form';

import api from '../../api/api';
import { toast } from 'react-toastify';

/* =========================
   Types
========================= */
type Grupo = {
  id: number;
  nome: string;
};

type SubgrupoForm = {
  nome: string;
  grupo_id: string;
  ativo: boolean;
};

/* =========================
   Component
========================= */
export default function SubgrupoEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [grupos, setGrupos] = useState<Grupo[]>([]);

  const [form, setForm] = useState<SubgrupoForm>({
    nome: '',
    grupo_id: '',
    ativo: true,
  });

  /* =========================
     Load Grupos
  ========================= */
  useEffect(() => {
    async function loadGrupos() {
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

    loadGrupos();
  }, []);

  /* =========================
     Load Subgrupo
  ========================= */
  useEffect(() => {
    async function loadSubgrupo() {
      try {
        const res = await api.get(`/subgrupos/${id}`);
        const data = res.data;

        setForm({
          nome: data.nome ?? '',
          grupo_id: data.grupo_id ? String(data.grupo_id) : '',
          ativo: Boolean(data.ativo),
        });
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar subgrupo');
        navigate('/subgrupos');
      } finally {
        setLoadingData(false);
      }
    }

    loadSubgrupo();
  }, [id, navigate]);

  /* =========================
     Handlers
  ========================= */
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: name === 'ativo' ? value === 'true' : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/subgrupos/${id}`, {
        nome: form.nome,
        grupo_id: form.grupo_id,
        ativo: form.ativo,
      });

      toast.success('Subgrupo atualizado com sucesso');
      navigate('/subgrupos');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar subgrupo');
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
          <h1 style={layoutStyles.title}>Editar Subgrupo</h1>
        </div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Editar Subgrupo</h1>
      </div>

      {/* CARD */}
      <div style={layoutStyles.card}>
        <form onSubmit={handleSubmit} style={formStyles.form}>
          <div style={{ width: '100%' }}>
            {/* ===== Dados do Subgrupo ===== */}
            <h2 style={layoutStyles.subtitle}>Dados do Subgrupo</h2>

            <div style={formStyles.field}>
              <label style={formStyles.label}>Nome</label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                style={formStyles.input}
                placeholder="Ex: Produtos de Limpeza"
                required
              />
            </div>

            <div style={formStyles.field}>
              <label style={formStyles.label}>Grupo</label>
              <select
                name="grupo_id"
                value={form.grupo_id}
                onChange={handleChange}
                style={formStyles.select}
                required
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
              <label style={formStyles.label}>Status</label>
              <select
                name="ativo"
                value={String(form.ativo)}
                onChange={handleChange}
                style={formStyles.select}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
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
                onClick={() => navigate('/subgrupos')}
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
