// src/pages/controle-acesso/usuarios/useUsuarios.ts
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  removerUsuario,
  type UsuarioSistema,
  type UsuarioPayload,
} from "../../../../services/controleacesso/usuarioService";

export function useUsuarios() {
  const [data, setData] = useState<UsuarioSistema[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function carregar() {
    setIsLoading(true);

    try {
      const result = await listarUsuarios();
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários.");
    } finally {
      setIsLoading(false);
    }
  }

  async function mutateCreate(values: UsuarioPayload) {
    await criarUsuario(values);
    toast.success("Usuário cadastrado com sucesso.");
    await carregar();
  }

  async function mutateUpdate(id: number, values: UsuarioPayload) {
    await atualizarUsuario(id, values);
    toast.success("Usuário atualizado com sucesso.");
    await carregar();
  }

  async function mutateRemove(id: number) {
    await removerUsuario(id);
    toast.success("Usuário inativado com sucesso.");
    await carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  return {
    data,
    isLoading,
    refetch: carregar,
    mutateCreate,
    mutateUpdate,
    mutateRemove,
  };
}