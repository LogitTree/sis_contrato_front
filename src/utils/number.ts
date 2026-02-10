export function parseDecimalBR(value: string) {
  if (!value) return 0;
  return Number(value.replace('.', '').replace(',', '.'));
}
