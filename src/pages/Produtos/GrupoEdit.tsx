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
type GrupoForm = {
  nome: string;
  ativo: boolean;
};

/* =========================
   Component
========================= */
export default function GrupoEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState<GrupoForm>({
    nome: '',
    ativo: true,
  });

  /* =========================
     Load Grupo
  ========================= */
  useEffect(() => {
    async function loadGrupo() {
      try {
        const res = await api.get(`/grupos/${id}`);
        const data = res.data;

        setForm({
          nome: data.nome ?? '',
          ativo: Boolean(data.ativo),
        });
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar grupo');
        navigate('/grupos');
      } finally {
        setLoadingData(false);
      }
    }

    loadGrupo();
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
      await api.put(`/grupos/${id}`, form);

      toast.success('Grupo atualizado com sucesso');
      navigate('/grupos');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar grupo');
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
          <h1 style={layoutStyles.title}>Editar Grupo</h1>
        </div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Editar Grupo</h1>
      </div>

      {/* CARD */}
      <div style={layoutStyles.card}>
        <form onSubmit={handleSubmit} style={formStyles.form}>
          <div style={{ width: '100%' }}>
            {/* ===== Dados do Grupo ===== */}
            <h2 style={layoutStyles.subtitle}>Dados do Grupo</h2>

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
                onClick={() => navigate('/grupos')}
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
