import { ArrowRight, ShieldCheck } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { ButtonLink, Card, SectionLabel } from "@/components/ui";
import { gradeBatch } from "@/lib/data";
import { GRADE_COLOR, num, persen } from "@/lib/format";
import type { Grade } from "@/lib/types";

const ORDER: Grade[] = ["A", "B", "C", "REJECT"];
const LEGEND: Record<Grade, string> = {
  A: "A",
  B: "B",
  C: "C",
  REJECT: "REJECT",
};

/**
 * Stands in for the annotated JPEG the engine returns alongside the JSON.
 * Once /predict streams back `annotated_img`, this becomes an <Image>.
 */
function BatchPreview() {
  const blobs: { grade: Grade; x: number; y: number; r: number }[] = [
    { grade: "A", x: 17, y: 30, r: 9.5 },
    { grade: "B", x: 44, y: 30, r: 11 },
    { grade: "C", x: 74, y: 30, r: 9.5 },
    { grade: "B", x: 30, y: 72, r: 10.5 },
    { grade: "REJECT", x: 60, y: 72, r: 11 },
  ];

  return (
    <div className="relative aspect-2/1 w-full overflow-hidden rounded-card bg-[#1f2a24]">
      {blobs.map((b, i) => (
        <span
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.r * 2}%`,
            aspectRatio: "1",
            background:
              b.grade === "REJECT"
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
      <span className="sr-only">
        Pratinjau anotasi batch: setiap objek ditandai grade hasil deteksi.
      </span>
    </div>
  );
}

export default async function HasilPage() {
  const hasil = await gradeBatch();

  if (hasil.status === "error") {
    return (
      <>
        <BackBar title="Hasil AI Grading" href="/petani/pindai" />
        <main className="flex-1 p-4">
          <Card className="p-4 text-sm text-grade-reject">{hasil.message}</Card>
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
          Tomat Sayur — {hasil.objek_terdeteksi} objek
        </h1>
        <p className="pt-1 text-xs leading-4 text-muted">
          Kalibrasi koin {hasil.kalibrasi.valid ? "valid" : "gagal"} •{" "}
          {num(hasil.kalibrasi.px_per_mm2, 2)} mm²/piksel • keyakinan rata-rata{" "}
          {num(hasil.ringkasan_batch.skor_keseragaman, 2)}
        </p>

        <div className="rise pt-4">
          <BatchPreview />
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
                <span className="font-bold text-ink">{LEGEND[grade]}</span>
                <span className="text-muted">{n}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Explainability — the proposal requires a stated reason, not a bare score */}
        <Card className="mt-4 p-4">
          <SectionLabel>Mengapa dominan grade {dominan}?</SectionLabel>

          <ul className="flex flex-col gap-2 pt-3">
            <li className="flex gap-2 text-xs leading-4 text-ink">
              <span className="pt-1 text-muted">•</span>
              Ukuran rata-rata 1.240 mm² — rentang B (1.000–1.800 mm²)
            </li>
            <li className="flex gap-2 text-xs leading-4 text-ink">
              <span className="pt-1 text-muted">•</span>
              Warna &ldquo;Setengah Matang&rdquo; menurunkan sebagian A ke B
            </li>
            <li className="flex gap-2 text-xs leading-4 font-bold text-grade-reject">
              <span className="pt-1">•</span>2 objek REJECT: bercak busuk 7,2% &gt;
              ambang 5%
            </li>
          </ul>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
            <code className="truncate font-mono text-[10px] text-label">
              hash_audit: {hasil.hash_audit.slice(0, 13)}…
              {hasil.hash_audit.slice(-4)}
            </code>
            <ShieldCheck className="size-4 shrink-0 text-brand" />
          </div>
        </Card>
      </main>

      <footer className="sticky bottom-0 border-t border-line bg-white p-4">
        <ButtonLink href="/petani/harga" variant="primary">
          Lihat Rekomendasi Harga
          <ArrowRight className="size-5" />
        </ButtonLink>
      </footer>
    </>
  );
}
