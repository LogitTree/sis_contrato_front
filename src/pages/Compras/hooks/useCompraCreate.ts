// src/pages/Compras/hooks/useCompraCreate.ts

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import api from "../../../api/api";

import {
  listarFornecedoresCompra,
  type FornecedorOption,
} from "../../../services/compras/compraService";

const LS_DRAFT_KEY = "compra_create_draft_v1";

type ProdutoOption = {
  id: number;
  nome: string;
  descricao?: string;

  codigo?: string | null;
  sku?: string | null;
  cod_barra?: string | null;
  codigo_barras?: string | null;

  preco_custo?: string | number;
  preco_unitario?: string | number;
  custo_medio?: string | number;
  ult_custo?: string | number;
  ultimo_custo?: string | number;

  qtd_livre?: string | number;
  qtd_disponivel?: string | number;
  estoque_atual?: string | number;

  grupo?: {
    id?: number;
    nome?: string;
  };

  subgrupo?: {
    id?: number;
    nome?: string;
  };
};

type CompraItem = {
  id: number;
  produto_id: number;
  qtd: string | number;
  preco_unitario: string | number;
  previsao_entrega?: string | null;

  produto?: {
    id: number;
    nome?: string;
    descricao?: string;

    codigo?: string | null;
    sku?: string | null;
    cod_barra?: string | null;
    codigo_barras?: string | null;
  };
};

function toNumberAny(value: any): number {
  if (value === null || value === undefined) return 0;

  const text = String(value).trim();

  if (!text) return 0;

  if (text.includes(",") && text.includes(".")) {
    const parsed = Number(
      text.replace(/\./g, "").replace(",", ".")
    );

    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (text.includes(",")) {
    const parsed = Number(text.replace(",", "."));

    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(text);

  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyFromApi(value: any): number {
  const numberValue = toNumberAny(value);

  const isInteger =
    Math.abs(numberValue - Math.round(numberValue)) < 1e-9;

  if (isInteger && numberValue >= 100000) {
    return numberValue / 100;
  }

  return numberValue;
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function useCompraCreate() {
  const qtdRef = useRef<HTMLInputElement | null>(null);
  const fornecedorBuscaRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  const [removingItemId, setRemovingItemId] =
    useState<number | null>(null);

  const [fornecedores, setFornecedores] = useState<
    FornecedorOption[]
  >([]);

  const [produtos, setProdutos] = useState<ProdutoOption[]>([]);

  const [compraId, setCompraId] = useState<number | null>(null);
  const [itens, setItens] = useState<CompraItem[]>([]);

  /* =========================
     FORNECEDOR
  ========================= */

  const [fornecedorId, setFornecedorId] = useState("");

  const [fornecedorBusca, setFornecedorBusca] = useState("");

  const [fornecedorDropdown, setFornecedorDropdown] =
    useState(false);

  /* =========================
     CABEÇALHO
  ========================= */

  const [dataPedido, setDataPedido] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [observacao, setObservacao] = useState("");

  const [numeroNF, setNumeroNF] = useState("");
  const [serieNF, setSerieNF] = useState("");
  const [dataEmissaoNF, setDataEmissaoNF] = useState("");
  const [chaveNfe, setChaveNfe] = useState("");

  const [valorFrete, setValorFrete] = useState("");
  const [valorDesconto, setValorDesconto] = useState("");

  const [formaPagamento, setFormaPagamento] = useState("");
  const [condicaoPagamento, setCondicaoPagamento] =
    useState("");

  const [dataVencimento, setDataVencimento] = useState("");

  /* =========================
     PRODUTO / ITEM
  ========================= */

  const [produtoId, setProdutoId] = useState("");
  const [qtd, setQtd] = useState("");
  const [precoUnit, setPrecoUnit] = useState("");
  const [previsaoEntrega, setPrevisaoEntrega] = useState("");

  /* =========================
     CARREGAMENTOS
  ========================= */

  async function loadCombos() {
    try {
      const fornecedoresData =
        await listarFornecedoresCompra();

      setFornecedores(
        Array.isArray(fornecedoresData)
          ? fornecedoresData
          : []
      );
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar fornecedores.");
      setFornecedores([]);
    }

    try {
      const response = await api.get("/produtos", {
        params: {
          page: 1,
          limit: 100000,
        },
      });

      const rows =
        response.data?.data ??
        response.data?.rows ??
        response.data?.items ??
        response.data ??
        [];

      setProdutos(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar produtos.");
      setProdutos([]);
    }
  }

  async function loadCompra(id: number) {
    try {
      const response = await api.get(`/compras/${id}`);

      const compra =
        response.data?.data ?? response.data ?? {};

      const lista =
        compra?.itens ??
        compra?.CompraItems ??
        compra?.compra_itens ??
        compra?.items ??
        [];

      setItens(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar itens da compra.");
    }
  }

  /* =========================
     MAPAS E SELEÇÕES
  ========================= */

  const fornecedoresMap = useMemo(() => {
    const map = new Map<number, FornecedorOption>();

    fornecedores.forEach((fornecedor) => {
      map.set(Number(fornecedor.id), fornecedor);
    });

    return map;
  }, [fornecedores]);

  const produtosMap = useMemo(() => {
    const map = new Map<number, ProdutoOption>();

    produtos.forEach((produto) => {
      map.set(Number(produto.id), produto);
    });

    return map;
  }, [produtos]);

  const fornecedorSelecionado = useMemo(() => {
    const id = Number(fornecedorId);

    if (!id) return null;

    return fornecedoresMap.get(id) ?? null;
  }, [fornecedorId, fornecedoresMap]);

  const produtoSelecionado = useMemo(() => {
    const id = Number(produtoId);

    if (!id) return null;

    return produtosMap.get(id) ?? null;
  }, [produtoId, produtosMap]);

  const fornecedoresFiltrados = useMemo(() => {
    const term = normalizeText(fornecedorBusca);

    const listaOrdenada = [...fornecedores].sort((a, b) =>
      String(a.nome || "").localeCompare(
        String(b.nome || ""),
        "pt-BR"
      )
    );

    if (!term) {
      return listaOrdenada.slice(0, 20);
    }

    return listaOrdenada
      .filter((fornecedor) => {
        const campos = [
          fornecedor.id,
          fornecedor.nome,
        ];

        return campos.some((campo) =>
          normalizeText(campo).includes(term)
        );
      })
      .slice(0, 30);
  }, [fornecedores, fornecedorBusca]);

  function selecionarFornecedor(
    fornecedor: FornecedorOption
  ) {
    setFornecedorId(String(fornecedor.id));
    setFornecedorBusca(fornecedor.nome || "");
    setFornecedorDropdown(false);
  }

  function limparFornecedor() {
    setFornecedorId("");
    setFornecedorBusca("");
    setFornecedorDropdown(false);

    setTimeout(() => {
      fornecedorBuscaRef.current?.focus();
    }, 50);
  }

  function alterarBuscaFornecedor(value: string) {
    setFornecedorBusca(value);
    setFornecedorDropdown(true);

    const fornecedorAtual =
      fornecedorSelecionado?.nome || "";

    if (
      normalizeText(value) !==
      normalizeText(fornecedorAtual)
    ) {
      setFornecedorId("");
    }
  }

  function abrirFornecedorDropdown() {
    if (loading || savingHeader || compraId) return;

    setFornecedorDropdown(true);
  }

  function fecharFornecedorDropdown() {
    setFornecedorDropdown(false);
  }

  /* =========================
     RASCUNHO LOCAL
  ========================= */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_DRAFT_KEY);

      if (!raw) return;

      const draft = JSON.parse(raw);

      if (!draft || compraId) return;

      if (draft.fornecedorId) {
        setFornecedorId(String(draft.fornecedorId));
      }

      if (draft.dataPedido) {
        setDataPedido(String(draft.dataPedido));
      }

      if (draft.observacao !== undefined) {
        setObservacao(
          String(draft.observacao ?? "")
        );
      }

      if (draft.numeroNF !== undefined) {
        setNumeroNF(String(draft.numeroNF ?? ""));
      }

      if (draft.serieNF !== undefined) {
        setSerieNF(String(draft.serieNF ?? ""));
      }

      if (draft.dataEmissaoNF !== undefined) {
        setDataEmissaoNF(
          String(draft.dataEmissaoNF ?? "")
        );
      }

      if (draft.chaveNfe !== undefined) {
        setChaveNfe(String(draft.chaveNfe ?? ""));
      }

      if (draft.valorFrete !== undefined) {
        setValorFrete(
          String(draft.valorFrete ?? "")
        );
      }

      if (draft.valorDesconto !== undefined) {
        setValorDesconto(
          String(draft.valorDesconto ?? "")
        );
      }

      if (draft.formaPagamento !== undefined) {
        setFormaPagamento(
          String(draft.formaPagamento ?? "")
        );
      }

      if (draft.condicaoPagamento !== undefined) {
        setCondicaoPagamento(
          String(draft.condicaoPagamento ?? "")
        );
      }

      if (draft.dataVencimento !== undefined) {
        setDataVencimento(
          String(draft.dataVencimento ?? "")
        );
      }
    } catch (error) {
      console.error(
        "Erro ao restaurar rascunho da compra:",
        error
      );
    }
  }, [compraId]);

  useEffect(() => {
    if (compraId) return;

    try {
      localStorage.setItem(
        LS_DRAFT_KEY,
        JSON.stringify({
          fornecedorId,
          dataPedido,
          observacao,

          numeroNF,
          serieNF,
          dataEmissaoNF,
          chaveNfe,

          valorFrete,
          valorDesconto,

          formaPagamento,
          condicaoPagamento,
          dataVencimento,
        })
      );
    } catch (error) {
      console.error(
        "Erro ao salvar rascunho da compra:",
        error
      );
    }
  }, [
    fornecedorId,
    dataPedido,
    observacao,
    numeroNF,
    serieNF,
    dataEmissaoNF,
    chaveNfe,
    valorFrete,
    valorDesconto,
    formaPagamento,
    condicaoPagamento,
    dataVencimento,
    compraId,
  ]);

  /*
   * Após restaurar fornecedor_id do rascunho,
   * preenche a descrição quando os fornecedores terminarem
   * de carregar.
   */
  useEffect(() => {
    if (!fornecedorSelecionado) return;

    setFornecedorBusca(
      fornecedorSelecionado.nome || ""
    );
  }, [fornecedorSelecionado]);

  /* =========================
     INICIALIZAÇÃO
  ========================= */

  useEffect(() => {
    async function init() {
      setLoading(true);

      try {
        await loadCombos();
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  /* =========================
     PRODUTO SELECIONADO
  ========================= */

  useEffect(() => {
    if (!produtoId) return;

    if (produtoSelecionado) {
      const preco =
        produtoSelecionado.preco_custo ??
        produtoSelecionado.preco_unitario ??
        "";

      if (preco && !precoUnit) {
        setPrecoUnit(
          String(moneyFromApi(preco))
        );
      }
    }

    setTimeout(() => {
      qtdRef.current?.focus();
    }, 60);
  }, [produtoId, produtoSelecionado, precoUnit]);

  /* =========================
     TOTAIS
  ========================= */

  const totais = useMemo(() => {
    const totalItens = itens.length;

    const totalQtd = itens.reduce(
      (accumulator, item) =>
        accumulator + toNumberAny(item.qtd),
      0
    );

    const totalValor = itens.reduce(
      (accumulator, item) => {
        const quantidade = toNumberAny(item.qtd);

        const preco = moneyFromApi(
          item.preco_unitario
        );

        return accumulator + quantidade * preco;
      },
      0
    );

    const frete = toNumberAny(valorFrete);
    const desconto = toNumberAny(valorDesconto);

    const totalFinal =
      totalValor + frete - desconto;

    return {
      totalItens,
      totalQtd,
      totalValor,
      frete,
      desconto,
      totalFinal,
    };
  }, [itens, valorFrete, valorDesconto]);

  const disableHeader =
    loading || savingHeader || !!compraId;

  const disableItem =
    loading || savingItem || !compraId;

  const qtdNum = useMemo(
    () => toNumberAny(qtd),
    [qtd]
  );

  const precoUnitNum = useMemo(
    () => toNumberAny(precoUnit),
    [precoUnit]
  );

  const canInsert =
    !disableItem &&
    !!produtoId &&
    qtdNum > 0 &&
    precoUnitNum > 0;

  /* =========================
     SALVAR CABEÇALHO
  ========================= */

  async function salvarCabecalho(
    event?: React.FormEvent
  ) {
    event?.preventDefault();

    if (!fornecedorId) {
      toast.error("Selecione o fornecedor.");
      return;
    }

    if (!dataPedido) {
      toast.error("Informe a data do pedido.");
      return;
    }

    setSavingHeader(true);

    try {
      const payload = {
        fornecedor_id: Number(fornecedorId),
        data_pedido: dataPedido,
        observacao: observacao.trim() || null,

        numero_nota_fiscal:
          numeroNF.trim() || null,

        serie_nota_fiscal:
          serieNF.trim() || null,

        data_emissao_nf:
          dataEmissaoNF || null,

        chave_nfe:
          chaveNfe.trim() || null,

        valor_frete: String(
          toNumberAny(valorFrete)
        ),

        valor_desconto: String(
          toNumberAny(valorDesconto)
        ),

        forma_pagamento:
          formaPagamento.trim() || null,

        condicao_pagamento:
          condicaoPagamento.trim() || null,

        data_vencimento:
          dataVencimento || null,
      };

      const response = await api.post(
        "/compras",
        payload
      );

      const id =
        response.data?.data?.id ??
        response.data?.id ??
        response.data?.data?.data?.id ??
        null;

      if (!id) {
        throw new Error(
          "API não retornou o ID da compra."
        );
      }

      setCompraId(Number(id));
      setFornecedorDropdown(false);

      try {
        localStorage.removeItem(LS_DRAFT_KEY);
      } catch {
        // silencioso
      }

      toast.success(
        "Compra criada. Agora adicione os itens."
      );

      await loadCompra(Number(id));
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          "Erro ao salvar cabeçalho."
      );
    } finally {
      setSavingHeader(false);
    }
  }

  /* =========================
     ADICIONAR ITEM
  ========================= */

  async function adicionarItem() {
    if (!compraId) {
      toast.error(
        "Salve o cabeçalho da compra primeiro."
      );

      return;
    }

    if (!produtoId) {
      toast.error("Selecione um produto.");
      return;
    }

    if (qtdNum <= 0) {
      toast.error("Informe a quantidade.");
      return;
    }

    if (precoUnitNum <= 0) {
      toast.error(
        "Informe um preço unitário maior que zero."
      );

      return;
    }

    setSavingItem(true);

    try {
      await api.post(
        `/compras/${compraId}/itens`,
        {
          produto_id: Number(produtoId),
          qtd: String(qtdNum),
          preco_unitario: String(precoUnitNum),
          previsao_entrega:
            previsaoEntrega || null,
        }
      );

      toast.success("Item inserido.");

      setProdutoId("");
      setQtd("");
      setPrecoUnit("");
      setPrevisaoEntrega("");

      await loadCompra(compraId);
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.error ||
          "Erro ao inserir item."
      );
    } finally {
      setSavingItem(false);
    }
  }

  /* =========================
     REMOVER ITEM
  ========================= */

  async function removerItem(itemId: number) {
    if (!compraId) return;

    const confirmed = window.confirm(
      "Remover este item?"
    );

    if (!confirmed) return;

    setRemovingItemId(itemId);

    try {
      await api.delete(
        `/compras/${compraId}/itens/${itemId}`
      );

      toast.success("Item removido.");

      await loadCompra(compraId);
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.error ||
          "Erro ao remover item."
      );
    } finally {
      setRemovingItemId(null);
    }
  }

  return {
    qtdRef,
    fornecedorBuscaRef,

    loading,
    savingHeader,
    savingItem,
    removingItemId,

    fornecedores,
    produtos,

    compraId,
    itens,

    fornecedorId,
    setFornecedorId,

    fornecedorBusca,
    setFornecedorBusca,
    fornecedorDropdown,
    setFornecedorDropdown,
    fornecedoresFiltrados,
    selecionarFornecedor,
    limparFornecedor,
    alterarBuscaFornecedor,
    abrirFornecedorDropdown,
    fecharFornecedorDropdown,

    dataPedido,
    setDataPedido,
    observacao,
    setObservacao,

    numeroNF,
    setNumeroNF,
    serieNF,
    setSerieNF,
    dataEmissaoNF,
    setDataEmissaoNF,
    chaveNfe,
    setChaveNfe,

    valorFrete,
    setValorFrete,
    valorDesconto,
    setValorDesconto,

    formaPagamento,
    setFormaPagamento,
    condicaoPagamento,
    setCondicaoPagamento,
    dataVencimento,
    setDataVencimento,

    produtoId,
    setProdutoId,
    qtd,
    setQtd,
    precoUnit,
    setPrecoUnit,
    previsaoEntrega,
    setPrevisaoEntrega,

    fornecedorSelecionado,
    produtoSelecionado,
    totais,

    disableHeader,
    disableItem,
    canInsert,

    salvarCabecalho,
    adicionarItem,
    removerItem,
    loadCompra,
  };
}

export const compraCreateUtils = {
  toNumberAny,
  moneyFromApi,
};