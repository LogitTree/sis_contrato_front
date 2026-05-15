// src/pages/ContasPagar/hooks/useContasPagarDetail.ts

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  buscarContaPagar,
  cancelarContaPagar,
  excluirPagamentoContaPagar,
  listarFormasPagamentoContaPagar,
  registrarPagamentoContaPagar,
  type ContaPagarDetail,
  type FormaPagamentoOption,
  type PagamentoContaPagar,
} from "../../../services/contasPagar/contaPagarService";

import { contasPagarListUtils } from "./useContasPagarList";

export function useContasPagarDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const contaId = Number(id);

  const [loading, setLoading] = useState(true);
  const [conta, setConta] = useState<ContaPagarDetail | null>(null);

  const [pagamentoForm, setPagamentoForm] = useState({
    data_pagamento: new Date().toISOString().slice(0, 10),
    valor_pago: "",
    forma_pagamento: "",
    observacao: "",
  });

  const [savingPagamento, setSavingPagamento] = useState(false);
  const [cancelandoConta, setCancelandoConta] = useState(false);
  const [excluindoPagamentoId, setExcluindoPagamentoId] = useState<
    number | null
  >(null);

  const [formasPagamento, setFormasPagamento] = useState<
    FormaPagamentoOption[]
  >([]);

  const podePagar = useMemo(() => {
    const status = String(conta?.status || "").toUpperCase();
    return ["ABERTO", "PARCIAL", "VENCIDO"].includes(status);
  }, [conta]);

  const podeCancelar = useMemo(() => {
    const status = String(conta?.status || "").toUpperCase();
    return ["ABERTO", "VENCIDO"].includes(status);
  }, [conta]);

  async function carregarFormasPagamento() {
    try {
      const rows = await listarFormasPagamentoContaPagar();
      setFormasPagamento(rows);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar formas de pagamento.");
    }
  }

  async function carregar() {
    if (!contaId) return;

    setLoading(true);

    try {
      const data = await buscarContaPagar(contaId);

      setConta(data);

      setPagamentoForm((old) => ({
        ...old,
        valor_pago: contasPagarListUtils.formatMoneyBR(data?.saldo),
        forma_pagamento: data?.forma_pagamento || "",
      }));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao carregar conta.");
      navigate("/contas-pagar");
    } finally {
      setLoading(false);
    }
  }

  async function registrarPagamento(e: FormEvent) {
    e.preventDefault();

    if (!contaId || !conta) return false;

    const valorPago = contasPagarListUtils.parseDecimalApi(
      pagamentoForm.valor_pago
    );

    if (valorPago <= 0) {
      toast.warning("Informe um valor válido para pagamento.");
      return false;
    }

    if (!pagamentoForm.data_pagamento) {
      toast.warning("Informe a data do pagamento.");
      return false;
    }

    if (!pagamentoForm.forma_pagamento) {
      toast.warning("Selecione a forma de pagamento.");
      return false;
    }

    setSavingPagamento(true);

    try {
      await registrarPagamentoContaPagar(contaId, {
        data_pagamento: pagamentoForm.data_pagamento,
        valor_pago: valorPago,
        forma_pagamento: pagamentoForm.forma_pagamento,
        observacao: pagamentoForm.observacao || undefined,
      });

      toast.success("Pagamento registrado com sucesso.");

      setPagamentoForm((old) => ({
        ...old,
        observacao: "",
      }));

      await carregar();

      return true;
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao registrar pagamento.");
      return false;
    } finally {
      setSavingPagamento(false);
    }
  }

  async function cancelarConta() {
    if (!contaId || !conta) return;

    const ok = window.confirm(`Cancelar a conta #${conta.id}?`);

    if (!ok) return;

    setCancelandoConta(true);

    try {
      await cancelarContaPagar(contaId);
      toast.success("Conta cancelada com sucesso.");
      await carregar();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao cancelar conta.");
    } finally {
      setCancelandoConta(false);
    }
  }

  async function excluirPagamento(pagamento: PagamentoContaPagar) {
    const ok = window.confirm(
      `Excluir o pagamento #${pagamento.id} no valor de ${contasPagarListUtils.formatMoneyBR(
        pagamento.valor_pago
      )}?`
    );

    if (!ok) return;

    setExcluindoPagamentoId(pagamento.id);

    try {
      await excluirPagamentoContaPagar(pagamento.id);
      toast.success("Pagamento excluído com sucesso.");
      await carregar();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao excluir pagamento.");
    } finally {
      setExcluindoPagamentoId(null);
    }
  }

  useEffect(() => {
    carregar();
    carregarFormasPagamento();
  }, [contaId]);

  return {
    navigate,
    contaId,

    loading,
    conta,

    pagamentoForm,
    setPagamentoForm,

    savingPagamento,
    cancelandoConta,
    excluindoPagamentoId,

    formasPagamento,

    podePagar,
    podeCancelar,

    registrarPagamento,
    cancelarConta,
    excluirPagamento,
  };
}