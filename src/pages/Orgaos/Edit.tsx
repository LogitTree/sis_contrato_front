import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { layoutStyles } from '../../styles/layout';
import { buttonStyles } from '../../styles/buttons';
import { formStyles } from '../../styles/form';
import api from '../../api/api';

import { maskCNPJ, maskCEP, maskTelefone } from '../../utils/masks';
import { toast } from 'react-toastify';

/* =========================
   Types
========================= */
type OrgaoForm = {
    nome: string;
    cnpj: string;
    tipo: string;
    esfera: 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL';

    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;

    telefone: string;
    email_oficial: string;

    responsavel: string;
    cargo_responsavel: string;
};

/* =========================
   Component
========================= */
export default function OrgaoEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    const [form, setForm] = useState<OrgaoForm>({
        nome: '',
        cnpj: '',
        tipo: '',
        esfera: 'MUNICIPAL',

        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',

        telefone: '',
        email_oficial: '',

        responsavel: '',
        cargo_responsavel: '',
    });

    /* =========================
       Load Órgão
    ========================= */
    useEffect(() => {
        async function loadOrgao() {
            try {
                const response = await api.get(`/orgaocontratante/${id}`);
                const data = response.data;

                setForm({
                    ...data,
                    cnpj: maskCNPJ(data.cnpj || ''),
                    cep: maskCEP(data.cep || ''),
                    telefone: maskTelefone(data.telefone || ''),
                });
            } catch (error) {
                console.error('Erro ao carregar órgão', error);
                toast.error('Erro ao carregar órgão contratante');
                navigate('/orgaos');
            } finally {
                setLoadingData(false);
            }
        }

        loadOrgao();
    }, [id, navigate]);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target;

        let newValue = value;

        if (name === 'cnpj') newValue = maskCNPJ(value);
        if (name === 'cep') newValue = maskCEP(value);
        if (name === 'telefone') newValue = maskTelefone(value);

        setForm((prev) => ({ ...prev, [name]: newValue }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            await api.put(`/orgaocontratante/${id}`, form);
            toast.success('Órgão contratante atualizado com sucesso');
            navigate('/orgaos');
        } catch {
            toast.error('Erro ao atualizar órgão contratante');
        } finally {
            setLoading(false);
        }
    }

    if (loadingData) {
        return (
            <div style={layoutStyles.page}>
                <div style={layoutStyles.header}>
                    <h1 style={layoutStyles.title}>Editar Órgão</h1>
                </div>
                <p>Carregando dados...</p>
            </div>
        );
    }

    return (
        <div style={layoutStyles.page}>
            <div style={layoutStyles.header}>
                <h1 style={layoutStyles.title}>Editar Órgão Contratante</h1>
            </div>

            <div style={layoutStyles.card}>
                <form onSubmit={handleSubmit} style={formStyles.form}>
                    <div style={{ width: '100%' }}>
                        {/* ===== Dados Gerais ===== */}
                        <h2 style={layoutStyles.subtitle}>Dados do Órgão</h2>

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

                        <div style={formStyles.row}>
                            <div style={formStyles.field}>
                                <label style={formStyles.label}>CNPJ</label>
                                <input
                                    name="cnpj"
                                    value={form.cnpj}
                                    onChange={handleChange}
                                    style={formStyles.input}
                                    placeholder="00.000.000/0000-00"
                                    required
                                />
                            </div>

                            <div style={formStyles.field}>
                                <label style={formStyles.label}>Tipo</label>
                                <input
                                    name="tipo"
                                    value={form.tipo}
                                    onChange={handleChange}
                                    style={formStyles.input}
                                    placeholder="Prefeitura, Secretaria, Fundação..."
                                    required
                                />
                            </div>
                        </div>

                        <div style={formStyles.field}>
                            <label style={formStyles.label}>Esfera</label>
                            <select
                                name="esfera"
                                value={form.esfera}
                                onChange={handleChange}
                                style={formStyles.select}
                            >
                                <option value="MUNICIPAL">Municipal</option>
                                <option value="ESTADUAL">Estadual</option>
                                <option value="FEDERAL">Federal</option>
                            </select>
                        </div>

                        {/* ===== Endereço ===== */}
                        <h2 style={layoutStyles.subtitle}>Endereço</h2>

                        <div style={formStyles.row}>
                            <div style={formStyles.field}>
                                <label style={formStyles.label}>Logradouro</label>
                                <input
                                    name="logradouro"
                                    value={form.logradouro}
                                    onChange={handleChange}
                                    style={formStyles.input}
                                />
                            </div>

                            <div style={formStyles.field}>
                                <label style={formStyles.label}>Número</label>
                                <input
                                    name="numero"
                                    value={form.numero}
                                    onChange={handleChange}
                                    style={formStyles.input}
                                />
                            </div>
                        </div>

                        <div style={formStyles.field}>
                            <label style={formStyles.label}>Complemento</label>
                            <input
                                name="complemento"
                                value={form.complemento}
                                onChange={handleChange}
                                style={formStyles.input}
                            />
                        </div>

                        <div style={formStyles.row}>
                            <div style={formStyles.field}>
                                <label style={formStyles.label}>Bairro</label>
                                <input
                                    name="bairro"
                                    value={form.bairro}
                                    onChange={handleChange}
                                    style={formStyles.input}
                                />
                            </div>

                            <div style={formStyles.field}>
                                <label style={formStyles.label}>Cidade</label>
                                <input
                                    name="cidade"
                                    value={form.cidade}
                                    onChange={handleChange}
                                    style={formStyles.input}
                                />
                            </div>

                            <div style={formStyles.field}>
                                <label style={formStyles.label}>Estado</label>
                                <input
                                    name="estado"
                                    value={form.estado}
                                    onChange={handleChange}
                                    style={formStyles.input}
                                    maxLength={2}
                                />
                            </div>
                        </div>

                        <div style={formStyles.field}>
                            <label style={formStyles.label}>CEP</label>
                            <input
                                name="cep"
                                value={form.cep}
                                onChange={handleChange}
                                style={formStyles.input}
                                placeholder="00000-000"
                            />
                        </div>

                        {/* ===== Contato ===== */}
                        <h2 style={layoutStyles.subtitle}>Contato</h2>

                        <div style={formStyles.row}>
                            <div style={formStyles.field}>
                                <label style={formStyles.label}>Telefone</label>
                                <input
                                    name="telefone"
                                    value={form.telefone}
                                    onChange={handleChange}
                                    style={formStyles.input}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div style={formStyles.field}>
                                <label style={formStyles.label}>E-mail Oficial</label>
                                <input
                                    name="email_oficial"
                                    type="email"
                                    value={form.email_oficial}
                                    onChange={handleChange}
                                    style={formStyles.input}
                                />
                            </div>
                        </div>

                        {/* ===== Responsável ===== */}
                        <h2 style={layoutStyles.subtitle}>Responsável</h2>

                        <div style={formStyles.row}>
                            <div style={formStyles.field}>
                                <label style={formStyles.label}>Nome</label>
                                <input
                                    name="responsavel"
                                    value={form.responsavel}
                                    onChange={handleChange}
                                    style={formStyles.input}
                                />
                            </div>

                            <div style={formStyles.field}>
                                <label style={formStyles.label}>Cargo</label>
                                <input
                                    name="cargo_responsavel"
                                    value={form.cargo_responsavel}
                                    onChange={handleChange}
                                    style={formStyles.input}
                                />
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
                                onClick={() => navigate('/orgaos')}
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
