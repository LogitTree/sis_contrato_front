export const formatBrMoney = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

// pega só dígitos e converte pra centavos
export const parseMoneyToCents = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

export function formatBrMoneyFromCents(cents: number) {
  return (Number(cents || 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatMoneyBRFromString(raw: string) {
  if (!raw) return "";

  // converte "1.234,56" / "1234.56" / "1234,56" -> number
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);

  if (Number.isNaN(n)) return raw; // se ainda for inválido, mostra o que digitou

  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}