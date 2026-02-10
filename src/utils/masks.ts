/* ======================
   DOCUMENTOS / TEXTO
====================== */
export function maskCNPJ(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
}

export function maskCEP(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
}

export function maskTelefone(value: string) {
  const cleaned = value.replace(/\D/g, '');

  if (cleaned.length <= 10) {
    return cleaned
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14);
  }

  return cleaned
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
}

/* ======================
   MOEDA / VALORES
====================== */

/**
 * 🔹 Máscara para INPUT de moeda (R$)
 * Ex: "123456" → "1.234,56"
 */
export function maskMoedaBRInput(value: string) {
  const numeric = value.replace(/\D/g, '');

  if (!numeric) return '';

  const number = Number(numeric) / 100;

  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * 🔹 Formata número para exibição (tabela, label)
 * Aceita number | string
 */
export function formatMoedaBR(valor?: number | string | null) {
  if (valor === null || valor === undefined || valor === '') return '—';

  const numero =
    typeof valor === 'string'
      ? Number(valor.replace(/\./g, '').replace(',', '.'))
      : valor;

  if (isNaN(numero)) return '—';

  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * 🔹 Converte string mascarada para number (API)
 * Ex: "1.234,56" → 1234.56
 */
export function parseMoedaBR(valor?: string | null) {
  if (!valor) return 0;

  const numero = Number(valor.replace(/\./g, '').replace(',', '.'));

  return isNaN(numero) ? 0 : numero;
}

/**
 * 🔹 Alias de compatibilidade (seu código atual)
 */
export function moedaBR(valor: number) {
  return formatMoedaBR(valor);
}

/* ======================
   DATAS
====================== */
export function formatarDataBR(data?: string | null) {
  if (!data) return '—';

  return new Date(data).toLocaleDateString('pt-BR');
}
