import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { layoutStyles } from '../../styles/layout';
import { buttonStyles } from '../../styles/buttons';
import { formStyles } from '../../styles/form';
import api from '../../api/api';
import { maskCNPJ, maskCEP, maskTelefone } from '../../utils/masks';
import { toast } from 'react-toastify';

/* =========================
   Types
========================= */
type EmpresaForm = {
    razao_social: string;
    nome_fantasia: string;
    cnpj: string;
    inscricao_estadual: string;
    inscricao_municipal: string;

    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;

    telefone: string;
    email: string;

    responsavel_legal: string;
    cargo_responsavel: string;

    status: 'ATIVA' | 'INATIVA';
};

/* =========================
   Form Section (leve)
========================= */
function FormSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '1px',
                background: '#fafafa',
            }}
        >
            <h3
                style={{
                    marginBottom: '4px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#111827',
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: '8px',
                }}
            >
                {title}
            </h3>

            {children}
        </div>
    );
}

/* =========================
   Component
========================= */
export default function EmpresaCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<EmpresaForm>({
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        inscricao_estadual: '',
        inscricao_municipal: '',

        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',

        telefone: '',
        email: '',

        responsavel_legal: '',
        cargo_responsavel: '',

        status: 'ATIVA',
    });

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
            await api.post('/empresas', form);
            toast.success('Empresa cadastrada com sucesso');
            navigate('/empresas');
        } catch {
            toast.error('Erro ao salvar empresa');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={layoutStyles.page}>
            <div style={layoutStyles.header}>
                <h1 style={layoutStyles.title}>Nova Empresa</h1>
            </div>

            <div style={layoutStyles.card}>
                <form onSubmit={handleSubmit} style={formStyles.form}>
                    {/* ===== Dados da Empresa ===== */}
                    <FormSection title="Dados da Empresa">
                        <div style={formStyles.field}>
                            <label style={formStyles.label}>Razão Social</label>
                            <input
                                name="razao_social"
                                value={form.razao_social}
                                onChange={handleChange}
                                style={formStyles.input}
                                required
                            />
                        </div>

                        <div style={formStyles.field}>
                            <label style={formStyles.label}>Nome Fantasia</label>
                            <input
                                name="nome_fantasia"
                                value={form.nome_fantasia}
                                onChange={handleChange}
                                style={formStyles.input}
                                required
                            />
                        </div>
                    </FormSection>

                    {/* ===== Documentos ===== */}
                    <FormSection title="Documentos">
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
                                <label style={formStyles.label}>
                                    Inscrição Estadual
                                </label>
                                <input
                                    name="inscricao_estadual"
                                    value={form.inscricao_estadual}
                                    onChange={handleChange}
                                    style={formStyles.input}
                                />
                            </div>

                            <div style={formStyles.field}>
                                <label style={formStyles.label}>
                                    Inscrição Municipal
                                </label>
                                <input
                                    name="inscricao_municipal"
                                    value={form.inscricao_municipal}
                                    onChange={handleChange}
                                    style={formStyles.input}
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* ===== Endereço ===== */}
                    <FormSection title="Endereço">
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
                    </FormSection>

                    {/* ===== Contato ===== */}
                    <FormSection title="Contato">
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
                                <label style={formStyles.label}>E-mail</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    style={formStyles.input}
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* ===== Responsável Legal ===== */}
                    <FormSection title="Responsável Legal">
                        <div style={formStyles.row}>
                            <div style={formStyles.field}>
                                <label style={formStyles.label}>Nome</label>
                                <input
                                    name="responsavel_legal"
                                    value={form.responsavel_legal}
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
                    </FormSection>

                    {/* ===== Finalização ===== */}
                    <FormSection title="Finalização">
                        <div style={formStyles.field}>
                            <label style={formStyles.label}>Status</label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                style={formStyles.select}
                            >
                                <option value="ATIVA">Ativa</option>
                                <option value="INATIVA">Inativa</option>
                            </select>
                        </div>

                    </FormSection>

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
                                onClick={() => navigate('/empresas')}
                            >
                                Cancelar
                            </button>
                        </div>
                </form>
            </div>
        </div>
    );
}
