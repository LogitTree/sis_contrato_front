import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  listarVendasDiretas,
  type VendaDireta,
} from "../../../services/vendadireta/vendaDiretaService";

function moneyFromApi(v: any): number {
  const n = Number(String(v ?? "0").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function useVendaDiretaList() {
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [vendas, setVendas] = useState<VendaDireta[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  async function carregar() {
    setLoading(true);

    try {
      const result = await listarVendasDiretas({
        search: search || undefined,
        status: status || undefined,
        page,
        limit,
      });

      setVendas(Array.isArray(result?.data) ? result.data : []);
      setTotal(Number(result?.total || 0));
      setTotalPages(Number(result?.totalPages || 1));
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao carregar vendas.");
      setVendas([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  function limparFiltros() {
    setSearch("");
    setStatus("");
    setPage(1);
  }

  useEffect(() => {
    carregar();
  }, [page, limit]);

  const resumo = useMemo(() => {
    const totalVendas = vendas.length;

    const concluidas = vendas.filter(
      (venda) => String(venda.status).toUpperCase() === "CONCLUIDO"
    ).length;

    const canceladas = vendas.filter(
      (venda) => String(venda.status).toUpperCase() === "CANCELADO"
    ).length;

    const rascunhos = vendas.filter(
      (venda) => String(venda.status).toUpperCase() === "RASCUNHO"
    ).length;

    const valorTotal = vendas.reduce((acc, venda) => {
      return acc + moneyFromApi(venda.valor_total);
    }, 0);

    return {
      totalVendas,
      concluidas,
      canceladas,
      rascunhos,
      valorTotal,
    };
  }, [vendas]);

  return {
    loading,

    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    limit,
    setLimit,

    vendas,
    total,
    totalPages,
    resumo,

    carregar,
    limparFiltros,
  };
}