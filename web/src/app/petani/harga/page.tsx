import { BackBar } from "@/components/chrome";
import { Card, SectionLabel } from "@/components/ui";
import { getRekomendasiHarga } from "@/lib/data";
import { formatAngka, formatRupiah, num } from "@/lib/format";
import HargaForm from "./harga-form";

export default async function HargaPage() {
  const rec = await getRekomendasiHarga();

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

        <Card className="rise mt-4 p-5">
          <p className="text-center text-[28px] leading-9 font-extrabold tracking-tight text-ink">
            {formatRupiah(rec.min)} – {formatAngka(rec.max)}
          </p>
          <p className="pt-1 text-center text-xs text-muted">per kilogram</p>

          <div className="pt-5">
            <div className="relative h-2 rounded-full bg-brand-tint-strong">
              <span className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-brand" />
              <span className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand shadow" />
            </div>
            <div className="flex justify-between pt-2 text-[11px] text-muted">
              <span>{formatAngka(rec.min)}</span>
              <span>{formatAngka(rec.max)}</span>
            </div>
          </div>
        </Card>

        {/* How the number was derived — the proposal calls for a transparent price */}
        <Card className="mt-4 divide-y divide-line px-4">
          {baris.map(({ k, v }) => (
            <div key={k} className="flex items-center justify-between gap-3 py-3">
              <span className="text-xs text-muted">{k}</span>
              <span className="text-xs font-bold text-ink">{v}</span>
            </div>
          ))}
        </Card>

        <div className="pt-6">
          <SectionLabel>Harga jual Anda</SectionLabel>
          <HargaForm min={rec.min} max={rec.max} />
        </div>
      </main>
    </>
  );
}
