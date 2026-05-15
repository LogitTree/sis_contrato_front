import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  buscarVendaDireta,
  cancelarVendaDireta,
  finalizarVendaDireta,
  removerItemVendaDireta,
  type VendaDireta,
  type VendaDiretaItem,
} from "../../../services/vendadireta/vendaDiretaService";

function toNumberAny(v: any): number {
  if (v === null || v === undefined) return 0;

  const s = String(v).trim();
  if (!s) return 0;

  if (s.includes(",") && s.includes(".")) {
    const n = Number(s.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  if (s.includes(",")) {
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function moneyFromApi(v: any): number {
  return toNumberAny(v);
}

export function useVendaDiretaEdit(vendaId: number) {
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);

  const [venda, setVenda] = useState<VendaDireta | null>(null);
  const [itens, setItens] = useState<VendaDiretaItem[]>([]);

  const [lotesSelecionados, setLotesSelecionados] = useState<
    Record<string | number, number>
  >({});

  async function carregarVenda() {
    if (!vendaId) return;

    setLoading(true);

    try {
      const result = await buscarVendaDireta(vendaId);

      setVenda(result);
      setItens(Array.isArray(result?.itens) ? result.itens : []);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao carregar venda.");
      setVenda(null);
      setItens([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarVenda();
  }, [vendaId]);

  const vendaBloqueada = useMemo(() => {
    return !!venda?.status && String(venda.status).toUpperCase() !== "RASCUNHO";
  }, [venda]);

  const totais = useMemo(() => {
    const totalItens = itens.length;

    const totalQtd = itens.reduce((acc, item) => {
      return acc + toNumberAny(item.qtd);
    }, 0);

    const totalDesconto = itens.reduce((acc, item) => {
      return acc + moneyFromApi(item.valor_desconto);
    }, 0);

    const totalVenda = itens.reduce((acc, item) => {
      return acc + moneyFromApi(item.valor_total);
    }, 0);

    return {
      totalItens,
      totalQtd,
      totalDesconto,
      totalVenda,
    };
  }, [itens]);

  function selecionarLote(itemId: number, loteId: string) {
    setLotesSelecionados((prev) => ({
      ...prev,
      [itemId]: Number(loteId),
    }));
  }

  async function removerItem(itemId: number) {
    if (!vendaId) return;

    if (!window.confirm("Remover este item da venda?")) return;

    setRemovingItemId(itemId);

    try {
      await removerItemVendaDireta(vendaId, itemId);

      toast.success("Item removido.");

      await carregarVenda();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao remover item.");
    } finally {
      setRemovingItemId(null);
    }
  }

  async function finalizarVenda() {
    if (!vendaId) return;

    if (!itens.length) {
      toast.error("Adicione pelo menos um item para finalizar.");
      return;
    }

    setFinishing(true);

    try {
      await finalizarVendaDireta(vendaId, {
        lotes: lotesSelecionados,
      });

      toast.success("Venda finalizada com sucesso.");

      await carregarVenda();
    } catch (error: any) {
      console.error(error);

      const details = error?.response?.data?.details;

      if (Array.isArray(details) && details.length > 0) {
        toast.error(details[0]?.motivo || "Erro ao finalizar venda.");
      } else {
        toast.error(error?.response?.data?.error || "Erro ao finalizar venda.");
      }
    } finally {
      setFinishing(false);
    }
  }

  async function cancelarVenda() {
    if (!vendaId) return;

    if (!window.confirm("Cancelar esta venda?")) return;

    setFinishing(true);

    try {
      await cancelarVendaDireta(vendaId, {
        motivo: "Cancelada pelo usuário.",
      });

      toast.success("Venda cancelada.");

      await carregarVenda();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao cancelar venda.");
    } finally {
      setFinishing(false);
    }
  }

  return {
    loading,
    finishing,
    removingItemId,

    venda,
    itens,
    vendaBloqueada,
    totais,

    lotesSelecionados,
    selecionarLote,

    carregarVenda,
    removerItem,
    finalizarVenda,
    cancelarVenda,
  };
}

export const vendaDiretaEditUtils = {
  toNumberAny,
  moneyFromApi,
};