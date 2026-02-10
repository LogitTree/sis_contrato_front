import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/api';

import { layoutStyles } from '../../styles/layout';
import { tableStyles } from '../../styles/table';
import { buttonStyles } from '../../styles/buttons';
import { badgeStyles } from '../../styles/badges';

import { toast } from 'react-toastify';
import { FiTrash2 } from 'react-icons/fi';
import { numeroBR } from '../../utils/format';


import ModalAdicionarItem from './ModalAdicionarItem';

/* =========================
   ESTILOS LOCAIS
========================= */
const contratoCard: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const contratoInfo: React.CSSProperties = {
    color: '#111827',
};

const contratoTitulo: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 8,
};

const contratoLinha: React.CSSProperties = {
    fontSize: 14,
    marginBottom: 4,
    color: '#374151',
};

/* =========================
   TIPOS
========================= */
type Produto = {
    id: number;
    nome: string;
};

type ContratoItem = {
    id: number;
    unidade_contratada: string;
    fator_multiplicacao: number;
    preco_unitario_contratado: number;
    qtd_maxima_contratada: number;
    valor_maximo_contratado: number;
    produto?: Produto;
};

type Contrato = {
    id: number;
    numero: string;
    status: string;
    orgao?: {
        nome: string;
    };
    empresa?: {
        nome_fantasia?: string;
        razao_social?: string;
    };
    itens: ContratoItem[];
};

/* =========================
   UTIL
========================= */
function moedaBR(valor: number) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

/* =========================
   COMPONENT
========================= */
export default function ContratoItens() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [contrato, setContrato] = useState<Contrato | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    /* =========================
       CARREGAR CONTRATO
    ========================= */
    async function carregarItens() {
        try {
            const res = await api.get(`/contratos/${id}`);
            setContrato(res.data);
        } catch (error) {
            toast.error('Erro ao carregar itens do contrato');
        }
    }

    useEffect(() => {
        async function load() {
            try {
                await carregarItens();
            } catch {
                navigate('/contratos');
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [id, navigate]);

    if (loading) {
        return (
            <div style={layoutStyles.page}>
                <h1>Carregando itens do contrato...</h1>
            </div>
        );
    }

    if (!contrato) return null;

    /* =========================
       TOTAL DO CONTRATO
    ========================= */
    const totalContrato = contrato.itens.reduce((acc, item) => {
        return (
            acc +
            Number(item.preco_unitario_contratado) *
            Number(item.qtd_maxima_contratada)
        );
    }, 0);

    return (
        <div style={layoutStyles.page}>
            {/* ===== CARD CONTRATO ===== */}
            <div style={contratoCard}>
                <div style={contratoInfo}>
                    <div style={contratoTitulo}>
                        Contrato Nº {contrato.numero}
                    </div>

                    <div style={contratoLinha}>
                        <strong>Órgão:</strong> {contrato.orgao?.nome}
                    </div>

                    <div style={contratoLinha}>
                        <strong>Empresa:</strong>{' '}
                        {contrato.empresa?.nome_fantasia ||
                            contrato.empresa?.razao_social}
                    </div>
                </div>

                <span
                    style={{
                        ...badgeStyles.base,
                        ...(contrato.status === 'ATIVO'
                            ? badgeStyles.success
                            : badgeStyles.warning),
                    }}
                >
                    {contrato.status}
                </span>
            </div>

            {/* ===== ACTIONS ===== */}
            <div style={{ marginBottom: 16 }}>
                <button
                    style={buttonStyles.primary}
                    onClick={() => setModalOpen(true)}
                >
                    + Adicionar Item
                </button>

                <button
                    style={{ ...buttonStyles.link, marginLeft: 12 }}
                    onClick={() => navigate('/contratos')}
                >
                    Voltar
                </button>
            </div>

            {/* ===== MODAL ===== */}
            {modalOpen && (
                <ModalAdicionarItem
                    contratoId={Number(id)}
                    onClose={() => setModalOpen(false)}
                    onSaved={() => {
                        setModalOpen(false);
                        carregarItens();
                    }}
                />
            )}

            {/* ===== TABELA ===== */}
            <div style={layoutStyles.card}>
                <table style={tableStyles.table}>
                    <thead>
                        <tr>
                            <th style={tableStyles.th}>Produto</th>
                            <th style={tableStyles.th}>Unidade</th>
                            <th style={tableStyles.th}>Fator</th>
                            <th style={tableStyles.th}>Preço (Contrato)</th>
                            <th style={tableStyles.th}>Qtd Contratada</th>
                            <th style={tableStyles.th}>Total</th>
                            <th style={tableStyles.th}></th>
                        </tr>
                    </thead>

                    <tbody>
                        {contrato.itens.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    style={{
                                        ...tableStyles.td,
                                        textAlign: 'center',
                                        padding: 20,
                                    }}
                                >
                                    Nenhum item cadastrado para este contrato.
                                </td>
                            </tr>
                        )}

                        {contrato.itens.map((item, index) => {
                            const totalItem =
                                Number(item.preco_unitario_contratado) *
                                Number(item.qtd_maxima_contratada);

                            const totalEstoque =
                                Number(item.qtd_maxima_contratada) *
                                Number(item.fator_multiplicacao);

                            return (
                                <tr
                                    key={item.id}
                                    style={{
                                        background:
                                            index % 2 === 0 ? '#ffffff' : '#f9fafb',
                                    }}
                                >
                                    <td style={tableStyles.td}>
                                        {item.produto?.nome}
                                    </td>

                                    <td style={tableStyles.td}>
                                        {item.unidade_contratada}
                                    </td>

                                    <td style={tableStyles.td}>
                                        <strong>{numeroBR(item.fator_multiplicacao, 0)}</strong>
                                        <span style={{ opacity: 0.6 }}> × estoque</span>
                                    </td>


                                    <td style={tableStyles.td}>
                                        {moedaBR(item.preco_unitario_contratado)}
                                    </td>

                                    <td style={tableStyles.td}>
                                        <div>
                                            {numeroBR(item.qtd_maxima_contratada, 3)}{' '}
                                            {item.unidade_contratada}
                                        </div>
                                        <div style={{ fontSize: 12, opacity: 0.6 }}>
                                            = {numeroBR(totalEstoque, 0)} UN estoque
                                        </div>
                                    </td>


                                    <td style={tableStyles.td}>
                                        {moedaBR(totalItem)}
                                    </td>

                                    <td style={tableStyles.td}>
                                        <button
                                            style={{
                                                ...buttonStyles.icon,
                                                color: '#dc2626',
                                            }}
                                            title="Remover item do contrato"
                                            onClick={() =>
                                                toast.info(
                                                    'Remover item (próximo passo)'
                                                )
                                            }
                                        >
                                            <FiTrash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* ===== TOTAL ===== */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: 20,
                        paddingTop: 12,
                        borderTop: '1px solid #e5e7eb',
                        fontSize: 18,
                        fontWeight: 600,
                    }}
                >
                    Total do Contrato:&nbsp;
                    <span style={{ color: '#16a34a' }}>
                        {moedaBR(totalContrato)}
                    </span>
                </div>
            </div>
        </div>
    );
}
