import { BackBar } from "@/components/chrome";
import { Card } from "@/components/ui";
import { KOMODITAS_DEFAULT, getRekomendasiHarga } from "@/lib/data";
import { formatRupiah, num } from "@/lib/format";
import type { Grade } from "@/lib/types";
import HargaForm from "./harga-form";

export default async function HargaPage({
  searchParams,
}: {
  searchParams: Promise<{ komoditas?: string; grade?: string; skor?: string }>;
}) {
  // Layar hasil meneruskan konteks batch lewat query string; tanpa itu
  // (buka langsung) rekomendasi memakai batch demo.
  const p = await searchParams;
  const skor = Number(p.skor);
  const rec = await getRekomendasiHarga({
    komoditas: p.komoditas,
    grade: ["A", "B", "C", "REJECT"].includes(p.grade ?? "")
      ? (p.grade as Grade)
      : undefined,
    skor: Number.isFinite(skor) ? skor : undefined,
  });

  const baris = [
    { k: `Harga acuan pasar (${rec.harga_acuan_sumber})`, v: formatRupiah(rec.harga_acuan) },
    { k: "Grade dominan batch", v: rec.grade_dominan_label },
    { k: "Skor kualitas batch", v: num(rec.skor_kualitas, 2) },
    { k: "Pengali harga", v: `× ${num(rec.pengali, 3)}` },
  ];

  return (
    <>
      <BackBar title="Rekomendasi Harga Wajar" href="/petani/hasil" />

      <main className="flex-1 px-4 pt-4 pb-4">
        <h1 className="text-xl font-extrabold text-ink">
          {rec.komoditas_label} • Grade {rec.grade_dominan}
        </h1>

        {/* How the number was derived — the proposal calls for a transparent price */}
        <HargaForm rec={rec} komoditas={p.komoditas ?? KOMODITAS_DEFAULT}>
          <Card className="mt-4 divide-y divide-line px-4">
            {baris.map(({ k, v }) => (
              <div key={k} className="flex items-center justify-between gap-3 py-3">
                <span className="text-xs text-muted">{k}</span>
                <span className="text-xs font-bold text-ink">{v}</span>
              </div>
            ))}
          </Card>
        </HargaForm>
      </main>
    </>
  );
}
