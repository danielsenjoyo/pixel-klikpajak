const numberFormat = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 1234567 → "1.234.567,00" */
export function formatNumber(value: number | null | undefined): string {
  return numberFormat.format(value ?? 0)
}

/** 1234567 → "Rp1.234.567,00", -5 → "-Rp5,00" (Figma total cells). */
export function formatRp(value: number | null | undefined): string {
  const v = value ?? 0
  return `${v < 0 ? '-' : ''}Rp${formatNumber(Math.abs(v))}`
}

/** Treat empty inputs as zero in calculations. */
export function n(value: number | null | undefined): number {
  return value ?? 0
}

const countFormat = new Intl.NumberFormat('id-ID')

/** 6000 → "6.000". Whole counts (quota, documents) — never the 2-decimal money format. */
export function formatCount(value: number | null | undefined): string {
  return countFormat.format(value ?? 0)
}
