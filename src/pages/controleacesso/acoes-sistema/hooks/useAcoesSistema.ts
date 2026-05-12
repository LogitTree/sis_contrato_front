import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type {
  AcaoSistema,
  AcaoSistemaPayload
} from "../../../../services/controleacesso/acaoSistemaService";
import {
  atualizarAcaoSistema,
  criarAcaoSistema,
  listarAcoesSistema,
  removerAcaoSistema,
} from "../../../../services/controleacesso/acaoSistemaService";


export function useAcoesSistema() {
  const [data, setData] = useState<AcaoSistema[]>([]);
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);

    try {
      const result = await listarAcoesSistema();
      setData(Array.isArray(result) ? result : []);
    } catch {
      toast.error("Erro ao carregar ações do sistema.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  async function criar(payload: AcaoSistemaPayload) {
    setLoading(true);

    try {
      await criarAcaoSistema(payload);
      toast.success("Ação cadastrada com sucesso.");
      await carregar();
    } catch {
      toast.error("Erro ao cadastrar ação.");
    } finally {
      setLoading(false);
    }
  }

  async function atualizar(id: number, payload: AcaoSistemaPayload) {
    setLoading(true);

    try {
      await atualizarAcaoSistema(id, payload);
      toast.success("Ação atualizada com sucesso.");
      await carregar();
    } catch {
      toast.error("Erro ao atualizar ação.");
    } finally {
      setLoading(false);
    }
  }

  async function remover(id: number) {
    setLoading(true);

    try {
      await removerAcaoSistema(id);
      toast.success("Ação inativada com sucesso.");
      await carregar();
    } catch {
      toast.error("Erro ao inativar ação.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    return {
      total: data.length,
      ativas: data.filter((item) => item.status === "ATIVO").length,
      inativas: data.filter((item) => item.status === "INATIVO").length,
      modulos: new Set(data.map((item) => item.modulo)).size,
    };
  }, [data]);

  return {
    data,
    loading,
    resumo,
    carregar,
    criar,
    atualizar,
    remover,
  };
}