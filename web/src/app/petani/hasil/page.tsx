"use client";

/* eslint-disable @next/next/no-img-element -- captures are runtime data URLs */

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { ButtonLink, Card, SectionLabel } from "@/components/ui";
import { gradeBatch, labelKomoditas, skorKualitas } from "@/lib/data";
import { GRADE_COLOR, num, persen } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Grade, GradingResult } from "@/lib/types";

const ORDER: Grade[] = ["A", "B", "C", "REJECT"];

/**
 * Annotated-preview stand-in. With a live capture we overlay grade chips on
 * the actual photo; once /predict returns `annotated_img`, that replaces this.
 */
function BatchPreview({
  capture,
  annotated,
}: {
  capture: string | null;
  annotated?: string;
}) {
  // annotated_img dari FastAPI /predict sudah berisi bounding box + grade
  // hasil engine — tampilkan apa adanya, tanpa overlay tiruan.
  if (annotated) {
    return (
      <div className="relative aspect-2/1 w-full overflow-hidden rounded-card bg-[#1f2a24]">
        <img
          src={annotated}
          alt="Foto batch beranotasi grade dari AI"
          className="absolute inset-0 size-full object-cover"
        />
      </div>
    );
  }

  const blobs: { grade: Grade; x: number; y: number; r: number }[] = [
    { grade: "A", x: 17, y: 30, r: 9.5 },
    { grade: "B", x: 44, y: 30, r: 11 },
    { grade: "C", x: 74, y: 30, r: 9.5 },
    { grade: "B", x: 30, y: 72, r: 10.5 },
    { grade: "REJECT", x: 60, y: 72, r: 11 },
  ];

  return (
    <div className="relative aspect-2/1 w-full overflow-hidden rounded-card bg-[#1f2a24]">
      {capture && (
        <img
          src={capture}
          alt="Foto batch yang dianalisis"
          className="absolute inset-0 size-full object-cover opacity-90"
        />
      )}
      {blobs.map((b, i) => (
        <span
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.r * 2}%`,
            aspectRatio: "1",
            background: capture
              ? "transparent"
              : b.grade === "REJECT"
                ? "#8f2a24"
                : b.grade === "C"
                  ? "#4ade80"
                  : "#e05a4e",
            outline: `3px solid ${GRADE_COLOR[b.grade]}`,
            outlineOffset: "2px",
          }}
        >
          <span
            className="absolute -top-1 -left-1 rounded px-1 text-[9px] font-bold text-white"
            style={{ backgroundColor: GRADE_COLOR[b.grade] }}
          >
            {b.grade === "REJECT" ? "X" : b.grade}
          </span>
        </span>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4 pt-4" aria-label="Menganalisis foto…">
      <div className="aspect-2/1 animate-pulse rounded-card bg-line" />
      <div className="h-28 animate-pulse rounded-card bg-line" />
      <div className="h-40 animate-pulse rounded-card bg-line" />
    </div>
  );
}

export default function HasilPage() {
  const store = useStore();
  const [hasil, setHasil] = useState<GradingResult | null>(null);
  const recorded = useRef(false);
  // Komoditas dipilih petani di layar pindai; menentukan config ambang batas
  // yang dipakai engine, jadi label di sini harus ikut pilihan itu.
  const komoditas = store.lastKomoditas;
  const komoditasLabel = labelKomoditas(komoditas);

  useEffect(() => {
    let cancelled = false;
    // Kirim capture asli ke FastAPI /predict bila NEXT_PUBLIC_PREDICT_URL
    // terisi; tanpa itu gradeBatch mengembalikan payload demo.
    gradeBatch({ imageDataUrl: store.lastCapture, commodity: komoditas }).then(
      (r) => {
        if (!cancelled) setHasil(r);
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sekali per kunjungan; capture sudah final saat layar ini terbuka
  }, []);

  // Record this scan once the result lands (once — StrictMode double-runs effects).
  useEffect(() => {
    if (!hasil || hasil.status !== "success" || recorded.current) return;
    recorded.current = true;
    const komposisi = hasil.ringkasan_batch.komposisi;
    const dominan = ORDER.reduce((a, b) =>
      (komposisi[b] ?? 0) > (komposisi[a] ?? 0) ? b : a,
    );
    store.addScan({
      komoditas_label: komoditasLabel,
      grade_dominan: dominan,
      objek: hasil.objek_terdeteksi,
      gambar: store.lastCapture ?? "/img/tomat-rumahkaca.jpg",
      hasil, // dipersistenkan ke tabel gradings (hash_audit ikut tersimpan)
    });
  }, [hasil, store, komoditasLabel]);

  if (!hasil) {
    return (
      <>
        <BackBar title="Hasil AI Grading" href="/petani/pindai" />
        <main className="flex-1 px-4 pb-4">
          <Skeleton />
        </main>
      </>
    );
  }

  if (hasil.status === "error") {
    return (
      <>
        <BackBar title="Hasil AI Grading" href="/petani/pindai" />
        <main className="flex-1 p-4">
          <Card className="p-4 text-sm text-grade-reject">{hasil.message}</Card>
          <div className="pt-4">
            <ButtonLink href="/petani/pindai" variant="outline">
              Foto Ulang
            </ButtonLink>
          </div>
        </main>
      </>
    );
  }

  const { komposisi } = hasil.ringkasan_batch;
  const dominan = ORDER.reduce((a, b) =>
    (komposisi[b] ?? 0) > (komposisi[a] ?? 0) ? b : a,
  );
  const counts = ORDER.map((g) => ({
    grade: g,
    n: Math.round((komposisi[g] ?? 0) * hasil.objek_terdeteksi),
  }));

  return (
    <>
      <BackBar title="Hasil AI Grading" href="/petani/pindai" />

      <main className="flex-1 px-4 pt-4 pb-4">
        <h1 className="text-xl font-extrabold text-ink">
          {komoditasLabel} — {hasil.objek_terdeteksi} objek
        </h1>
        <p className="pt-1 text-xs leading-4 text-muted">
          Kalibrasi koin {hasil.kalibrasi.valid ? "valid" : "gagal"} •{" "}
          {num(hasil.kalibrasi.px_per_mm2, 2)} mm²/piksel • keyakinan rata-rata{" "}
          {num(hasil.ringkasan_batch.skor_keseragaman, 2)}
        </p>

        <div className="rise pt-4">
          <BatchPreview capture={store.lastCapture} annotated={hasil.annotated_img} />
        </div>

        {/* Komposisi batch */}
        <Card className="mt-4 p-4">
          <SectionLabel>Komposisi Batch</SectionLabel>

          <div className="mt-3 flex h-6 overflow-hidden rounded-lg">
            {ORDER.map((g) => {
              const frac = komposisi[g] ?? 0;
              if (frac === 0) return null;
              return (
                <div
                  key={g}
                  className="flex origin-left items-center justify-center"
                  style={{
                    width: `${frac * 100}%`,
                    backgroundColor: GRADE_COLOR[g],
                    animation: "pantas-grow 0.5s ease-out both",
                  }}
                >
                  {g === dominan && (
                    <span className="text-[10px] font-bold text-white">
                      {g} - {persen(frac)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-3">
            {counts.map(({ grade, n }) => (
              <li key={grade} className="flex items-center gap-1.5 text-xs">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: GRADE_COLOR[grade] }}
                />
                <span className="font-bold text-ink">{grade}</span>
                <span className="text-muted">{n}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Explainability — alasan dari engine, bukan teks palsu */}
        {hasil.objek.length > 0 && (
          <Card className="mt-4 p-4">
            <SectionLabel>Mengapa dominan grade {dominan}?</SectionLabel>

            <ul className="flex flex-col gap-2 pt-3">
              {/* Kumpulkan semua alasan unik dari seluruh objek */}
              {[...new Set(
                hasil.objek.flatMap((o) => o.alasan_grade ?? [])
              )].slice(0, 4).map((alasan, i) => (
                <li key={i} className="flex gap-2 text-xs leading-4 text-ink">
                  <span className="pt-1 text-muted">•</span>
                  {alasan}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
              <code className="truncate font-mono text-[10px] text-label">
                hash_audit: {hasil.hash_audit.slice(0, 13)}…
                {hasil.hash_audit.slice(-4)}
              </code>
              <ShieldCheck className="size-4 shrink-0 text-brand" />
            </div>
          </Card>
        )}
      </main>

      <footer className="sticky bottom-0 border-t border-line bg-white p-4">
        <ButtonLink
          href={`/petani/harga?komoditas=${encodeURIComponent(hasil.komoditas)}&grade=${dominan}&skor=${skorKualitas(komposisi)}`}
          variant="primary"
        >
          Lihat Rekomendasi Harga
          <ArrowRight className="size-5" />
        </ButtonLink>
      </footer>
    </>
  );
}
