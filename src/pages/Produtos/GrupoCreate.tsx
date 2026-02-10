import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
export default function GrupoCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<GrupoForm>({
    nome: '',
    ativo: true,
  });

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
      await api.post('/grupos', form);

      toast.success('Grupo cadastrado com sucesso');
      navigate('/grupos');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar grupo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={layoutStyles.page}>
      {/* HEADER */}
      <div style={layoutStyles.header}>
        <h1 style={layoutStyles.title}>Novo Grupo</h1>
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
                placeholder="Ex: Material de Limpeza"
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
