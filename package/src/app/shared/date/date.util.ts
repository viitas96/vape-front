export function toIsoDate(date: Date | null): string {
  if (!date) {
    return '';
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromIsoDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function minimumBirthDate(minimumAge: number): Date {
  const today = new Date();
  return new Date(today.getFullYear() - minimumAge, today.getMonth(), today.getDate());
}
