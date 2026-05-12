import { useEffect, useState } from "react";
import {
  listarGruposUsuarios,
  criarGrupoUsuario,
  atualizarGrupoUsuario,
  removerGrupoUsuario,
  type GrupoUsuario,
  type GrupoUsuarioPayload,
} from "../../../../services/controleacesso/grupoUsuarioService";

export function useGruposUsuarios() {
  const [data, setData] = useState<GrupoUsuario[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchData() {
    try {
      setIsLoading(true);
      const response = await listarGruposUsuarios();
      setData(response || []);
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function mutateCreate(values: GrupoUsuarioPayload) {
    await criarGrupoUsuario(values);
    await fetchData();
  }

  async function mutateUpdate(id: number, values: GrupoUsuarioPayload) {
    await atualizarGrupoUsuario(id, values);
    await fetchData();
  }

  async function mutateRemove(id: number) {
    await removerGrupoUsuario(id);
    await fetchData();
  }

  return {
    data,
    isLoading,
    refetch: fetchData,
    mutateCreate,
    mutateUpdate,
    mutateRemove,
  };
}