export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** 12345678901 -> 123.456.789-01 (progressively, while typing). */
export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 9);
  const e = d.slice(9, 11);
  return [a, b && `.${b}`, c && `.${c}`, e && `-${e}`].join("");
}

/** Validates length and both check digits. */
export function isValidCpf(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d.charAt(i)) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digit(9) === Number(d.charAt(9)) && digit(10) === Number(d.charAt(10));
}

/** 12345678901 -> 123.***.***-01 */
export function maskCpf(value: string): string {
  const d = onlyDigits(value);
  return `${d.slice(0, 3)}.***.***-${d.slice(9, 11)}`;
}
