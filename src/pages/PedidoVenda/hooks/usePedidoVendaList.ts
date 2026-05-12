import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  aprovarPedidoVenda,
  cancelarPedidoVenda,
  concluirPedidoVenda,
  devolverPedidoVenda,
  excluirPedidoVenda,
  gerarRelatorioOperacionalPedidoVenda,
  listarContratosPedidoVenda,
  listarEmpresasPedidoVenda,
  listarPedidosVenda,
  type ContratoOption,
  type EmpresaOption,
  type PedidoVenda,
} from "../../../services/pedidoVenda/pedidoVendaService";

type OrderBy = "id" | "data" | "status" | "contrato_id";
type OrderDir = "ASC" | "DESC";

export function usePedidoVendaList() {
  const [rows, setRows] = useState<PedidoVenda[]>([]);
  const [loading, setLoading] = useState(true);

  const [contratosOptions, setContratosOptions] = useState<ContratoOption[]>([]);
  const [empresasOptions, setEmpresasOptions] = useState<EmpresaOption[]>([]);

  const [filtroContratoId, setFiltroContratoId] = useState("");
  const [filtroEmpresaId, setFiltroEmpresaId] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  const [orderBy, setOrderBy] = useState<OrderBy>("id");
  const [orderDir, setOrderDir] = useState<OrderDir>("DESC");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const hasFilters =
    !!filtroContratoId ||
    !!filtroEmpresaId ||
    !!filtroStatus ||
    !!filtroDataInicio ||
    !!filtroDataFim;

  const contratosMap = useMemo(() => {
    const map = new Map<number, ContratoOption>();
    contratosOptions.forEach((contrato) => {
      map.set(Number(contrato.id), contrato);
    });
    return map;
  }, [contratosOptions]);

  const carregarCombos = useCallback(async () => {
    try {
      const [contratos, empresas] = await Promise.all([
        listarContratosPedidoVenda(),
        listarEmpresasPedidoVenda(),
      ]);

      setContratosOptions(contratos);
      setEmpresasOptions(empresas);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar filtros.");
    }
  }, []);

  const carregarPedidos = useCallback(async () => {
    setLoading(true);

    try {
      const result = await listarPedidosVenda({
        page,
        limit,
        orderBy,
        orderDir,
        contrato_id: filtroContratoId ? Number(filtroContratoId) : undefined,
        empresa_contratada_id: filtroEmpresaId
          ? Number(filtroEmpresaId)
          : undefined,
        status: filtroStatus || undefined,
        data_inicio: filtroDataInicio || undefined,
        data_fim: filtroDataFim || undefined,
      });

      setRows(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar pedidos de venda.");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    orderBy,
    orderDir,
    filtroContratoId,
    filtroEmpresaId,
    filtroStatus,
    filtroDataInicio,
    filtroDataFim,
  ]);

  useEffect(() => {
    carregarCombos();
  }, [carregarCombos]);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarPedidos();
    }, 350);

    return () => clearTimeout(timer);
  }, [carregarPedidos]);

  function handleSort(coluna: OrderBy) {
    if (orderBy === coluna) {
      setOrderDir((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setOrderBy(coluna);
      setOrderDir("ASC");
    }
  }

  function limparFiltros() {
    setFiltroContratoId("");
    setFiltroEmpresaId("");
    setFiltroStatus("");
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setPage(1);
  }

  async function excluirPedido(id: number) {
    const ok = window.confirm(`Deseja realmente excluir o pedido #${id}?`);
    if (!ok) return;

    setDeletingId(id);

    try {
      await excluirPedidoVenda(id);
      toast.success("Pedido excluído com sucesso.");

      const willBeEmpty = rows.length === 1 && page > 1;
      if (willBeEmpty) setPage((p) => p - 1);
      else await carregarPedidos();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao excluir pedido.");
    } finally {
      setDeletingId(null);
    }
  }

  async function aprovarPedido(id: number) {
    const ok = window.confirm(`Processar aprovação do pedido #${id}?`);
    if (!ok) return;

    setActingId(id);

    try {
      await aprovarPedidoVenda(id);
      toast.success("Pedido processado com sucesso.");
      await carregarPedidos();
    } catch (error: any) {
      console.error(error);
      toast.error(
        getApiErrorMessage(error, "Erro ao aprovar/processar pedido."),
        { autoClose: 8000 }
      );
    } finally {
      setActingId(null);
    }
  }

  async function concluirPedido(id: number) {
    const ok = window.confirm(`Concluir o pedido #${id}?`);
    if (!ok) return;

    setActingId(id);

    try {
      await concluirPedidoVenda(id);
      toast.success("Pedido concluído.");
      await carregarPedidos();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao concluir pedido.");
    } finally {
      setActingId(null);
    }
  }

  async function cancelarPedido(id: number) {
    const motivo = (window.prompt("Motivo do cancelamento:") ?? "").trim();
    const ok = window.confirm(`Cancelar o pedido #${id}?`);
    if (!ok) return;

    setActingId(id);

    try {
      await cancelarPedidoVenda(id, motivo);
      toast.success("Pedido cancelado.");
      await carregarPedidos();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao cancelar pedido.");
    } finally {
      setActingId(null);
    }
  }

  async function devolverPedido(id: number) {
    const motivo = (window.prompt("Motivo da devolução:") ?? "").trim();
    const ok = window.confirm(`Registrar devolução do pedido #${id}?`);
    if (!ok) return;

    setActingId(id);

    try {
      await devolverPedidoVenda(id, motivo);
      toast.success("Devolução registrada.");
      await carregarPedidos();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao registrar devolução.");
    } finally {
      setActingId(null);
    }
  }

  async function emitirRelatorioPedido(id: number) {
    try {
      const blobData = await gerarRelatorioOperacionalPedidoVenda(id);
      const blob = new Blob([blobData], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório.");
    }
  }

  function getApiErrorMessage(error: any, fallback: string) {
    const data = error?.response?.data;

    if (Array.isArray(data?.details) && data.details.length > 0) {
      const detalhes = data.details
        .map((item: any) => {
          const produto =
            item.produto ||
            `Produto #${item.produto_id || item.item_id}`;

          const motivo = item.motivo || "Erro operacional";

          return `${produto}: ${motivo}`;
        })
        .join("\n");

      return `${data.error || fallback}\n${detalhes}`;
    }

    return data?.error || fallback;
  }

  return {
    rows,
    loading,
    total,
    page,
    setPage,
    limit,

    filtros: {
      filtroContratoId,
      setFiltroContratoId,
      filtroEmpresaId,
      setFiltroEmpresaId,
      filtroStatus,
      setFiltroStatus,
      filtroDataInicio,
      setFiltroDataInicio,
      filtroDataFim,
      setFiltroDataFim,
      hasFilters,
      limparFiltros,
    },

    ordenacao: {
      orderBy,
      orderDir,
      handleSort,
    },

    combos: {
      contratosOptions,
      empresasOptions,
      contratosMap,
    },

    actions: {
      deletingId,
      actingId,
      excluirPedido,
      aprovarPedido,
      concluirPedido,
      cancelarPedido,
      devolverPedido,
      emitirRelatorioPedido,
    },

    refetch: carregarPedidos,
  };
}