import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  listarAcoesDoGrupo,
  sincronizarAcoesDoGrupo,
} from "../../../../../services/controleacesso/grupoAcoesService";

export function usePermissoesGrupo(grupoUsuarioId: number) {
  const [acoesSelecionadas, setAcoesSelecionadas] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  async function carregar() {
    if (!grupoUsuarioId) return;

    setLoading(true);

    try {
      const result = await listarAcoesDoGrupo(grupoUsuarioId);

      const ids = Array.isArray(result)
        ? result.map((item) => Number(item.id))
        : [];

      setAcoesSelecionadas(ids);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      toast.error("Erro ao carregar permissões do grupo.");
    } finally {
      setLoading(false);
    }
  }

  async function salvar(ids: number[]) {
    if (!grupoUsuarioId) return;

    setLoading(true);

    try {
      await sincronizarAcoesDoGrupo(grupoUsuarioId, ids);
      setAcoesSelecionadas(ids);
      toast.success("Permissões atualizadas com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar permissões:", error);
      toast.error("Erro ao salvar permissões.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [grupoUsuarioId]);

  return {
    acoesSelecionadas,
    loading,
    salvar,
    refetch: carregar,
  };
}