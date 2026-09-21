const MOLDOVA_COUNTRY_CODE = '373';

export function normalizePhone(value: string | null): string {
  if (!value) {
    return '';
  }

  const digits = value.replace(/\D/g, '');
  if (digits.startsWith(MOLDOVA_COUNTRY_CODE)) {
    return `0${digits.slice(MOLDOVA_COUNTRY_CODE.length)}`;
  }

  return digits;
}
