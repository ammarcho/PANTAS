"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Card, SectionLabel, cx } from "@/components/ui";
import { formatAngka, formatRupiah } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { RekomendasiHarga } from "@/lib/types";

/**
 * Interactive pricing. The petani may price outside the AI range — PANTAS
 * advises, it does not enforce. The badge just tells them where they stand.
 */
export default function HargaForm({
  rec,
  children,
}: {
  rec: RekomendasiHarga;
  children: ReactNode; // the server-rendered breakdown card
}) {
  const router = useRouter();
  const store = useStore();
  const [harga, setHarga] = useState(10000);
  const [berat, setBerat] = useState(120);
  const [publishing, setPublishing] = useState(false);

  const { min, max } = rec;
  const status =
    harga < min ? "rendah" : harga > max ? "tinggi" : ("wajar" as const);

  const badge = {
    wajar: { text: "Dalam rentang wajar", cls: "bg-brand-tint text-brand" },
    rendah: { text: "Di bawah rentang", cls: "bg-amber-50 text-grade-b" },
    tinggi: { text: "Di atas rentang", cls: "bg-red-50 text-grade-reject" },
  }[status];

  // The slider spans slightly beyond the fair range so "outside" is reachable.
  const sliderMin = Math.round(min * 0.8);
  const sliderMax = Math.round(max * 1.3);

  function publish() {
    if (publishing || berat <= 0 || harga <= 0) return;
    setPublishing(true);
    store.publishListing({
      nama: rec.komoditas_label,
      grade: rec.grade_dominan,
      berat_kg: berat,
      harga_per_kg: harga,
      gambar: store.lastCapture ?? "/img/tomat-rumahkaca.jpg",
    });
    router.push("/petani/listing-tayang");
  }

  return (
    <>
      <Card className="rise mt-4 p-5">
        <p className="text-center text-[28px] leading-9 font-extrabold tracking-tight text-ink">
          {formatRupiah(min)} – {formatAngka(max)}
        </p>
        <p className="pt-1 text-center text-xs text-muted">per kilogram</p>

        <div className="pt-5">
          <input
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={100}
            value={harga}
            onChange={(e) => setHarga(Number(e.target.value))}
            aria-label="Geser untuk mengatur harga jual"
            className="pantas-slider w-full"
            style={
              {
                "--fill": `${((harga - sliderMin) / (sliderMax - sliderMin)) * 100}%`,
              } as React.CSSProperties
            }
          />
          <div className="flex justify-between pt-1 text-[11px] text-muted">
            <span>{formatAngka(min)}</span>
            <span>{formatAngka(max)}</span>
          </div>
        </div>
      </Card>

      {children}

      <div className="pt-6">
        <SectionLabel>Harga jual Anda</SectionLabel>
        <Card className="mt-2 flex items-center justify-between gap-3 p-4">
          <label
            htmlFor="harga"
            className="flex items-baseline gap-1 text-lg font-extrabold text-ink"
          >
            Rp
            <input
              id="harga"
              type="text"
              inputMode="numeric"
              value={formatAngka(harga)}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, "").slice(0, 8));
                setHarga(Number.isNaN(n) ? 0 : n);
              }}
              className="w-24 bg-transparent text-lg font-extrabold text-ink focus:outline-none"
            />
          </label>

          <span
            className={cx(
              "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
              badge.cls,
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {badge.text}
          </span>
        </Card>
      </div>

      <div className="pt-4">
        <SectionLabel>
          <label htmlFor="berat">Berat batch (kg)</label>
        </SectionLabel>
        <Card className="mt-2 flex items-center gap-3 p-4">
          <input
            id="berat"
            type="text"
            inputMode="numeric"
            value={berat === 0 ? "" : formatAngka(berat)}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/\D/g, "").slice(0, 6));
              setBerat(Number.isNaN(n) ? 0 : n);
            }}
            className="w-full bg-transparent text-lg font-extrabold text-ink focus:outline-none"
            placeholder="120"
          />
          <span className="shrink-0 text-sm font-bold text-muted">kg</span>
        </Card>
      </div>

      {/* spacer so content clears the fixed footer */}
      <div className="h-24" />

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[430px] border-t border-line bg-white p-4">
        <button
          onClick={publish}
          disabled={publishing || berat <= 0 || harga <= 0}
          className="tap tap-press flex w-full items-center justify-center rounded-lg bg-brand py-4 text-base font-bold text-white hover:bg-brand-deep disabled:opacity-50"
        >
          {publishing ? "Menerbitkan…" : "Terbitkan Listing"}
        </button>
      </div>
    </>
  );
}
