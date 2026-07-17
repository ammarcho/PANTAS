"use client";

/* eslint-disable @next/next/no-img-element -- scan captures are data URLs */

import { ScanLine } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { ButtonLink, Card, GradeBadge } from "@/components/ui";
import { useStore } from "@/lib/store";

function fmtWaktu(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}, ${d
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(":", ".")}`;
}

export default function RiwayatPage() {
  const store = useStore();

  return (
    <>
      <BackBar title="Riwayat Pindai" href="/petani" />

      <main className="flex-1 px-4 pt-4 pb-6">
        {store.scans.length === 0 ? (
          <div className="flex flex-col items-center pt-20 text-center">
            <ScanLine className="size-10 text-label" />
            <p className="pt-4 text-sm font-bold text-ink">Belum ada pindaian</p>
            <p className="pt-1 text-xs text-muted">
              Hasil AI grading Anda akan tersimpan di sini.
            </p>
            <div className="w-full max-w-60 pt-6">
              <ButtonLink href="/petani/pindai">Mulai Pindai</ButtonLink>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {store.scans.map((s) => (
              <li key={s.id}>
                <Card className="flex items-center gap-3 p-3">
                  <img
                    src={s.gambar}
                    alt={s.komoditas_label}
                    className="size-16 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">
                      {s.komoditas_label}
                    </p>
                    <p className="pt-0.5 text-[11px] text-muted">
                      {s.objek} objek • {fmtWaktu(s.tanggal)}
                    </p>
                    <div className="pt-1.5">
                      <GradeBadge grade={s.grade_dominan} size="sm" />
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
