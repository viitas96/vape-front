export function formatMdl(cents: number): string {
  return `${(cents / 100).toFixed(2)} MDL`;
}

export function toCents(mdl: number): number {
  return Math.round(mdl * 100);
}

export function toMdl(cents: number): number {
  return cents / 100;
}
