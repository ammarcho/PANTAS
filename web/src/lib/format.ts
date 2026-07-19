import type { Grade } from "./types";

const rupiah = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

/** "10000" -> "Rp 10.000" */
export function formatRupiah(n: number): string {
  return `Rp ${rupiah.format(n)}`;
}

/** Compact rupiah for stat tiles: 8_400_000 -> "Rp 8,4 jt" */
export function formatRupiahRingkas(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${num(n / 1_000_000_000)} M`;
  if (n >= 1_000_000) return `Rp ${num(n / 1_000_000)} jt`;
  if (n >= 1_000) return `Rp ${num(n / 1_000)} rb`;
  return formatRupiah(n);
}

/** Indonesian decimal comma, one place, trailing ",0" dropped. */
export function num(n: number, digits = 1): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: digits,
  }).format(n);
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)) * 10) / 10;
}

export function formatAngka(n: number): string {
  return rupiah.format(n);
}

export function persen(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

export const GRADE_LABEL: Record<Grade, string> = {
  A: "Grade A (Premium)",
  B: "Grade B (Standar)",
  C: "Grade C (Industrial Use)",
  REJECT: "Reject",
};

export const GRADE_COLOR: Record<Grade, string> = {
  A: "var(--color-grade-a)",
  B: "var(--color-grade-b)",
  C: "var(--color-grade-c)",
  REJECT: "var(--color-grade-reject)",
};

/** ai_engine emits grades like "A", "B - Standar", "REJECT (bercak)". */
export function toGrade(raw: string): Grade {
  const s = raw.toUpperCase();
  if (s.includes("REJECT")) return "REJECT";
  if (s.startsWith("A")) return "A";
  if (s.startsWith("B")) return "B";
  return "C";
}
