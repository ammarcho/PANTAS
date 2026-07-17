"use client";

/* eslint-disable @next/next/no-img-element -- published photos can be data URLs */

import { BackBar } from "@/components/chrome";
import { Card, GradeBadge, SectionLabel } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function ListingSayaPage() {
  const store = useStore();

  return (
    <>
      <BackBar title="Listing Saya" href="/petani" />

      <main className="flex-1 px-4 pt-4 pb-6">
        <SectionLabel>{store.myListings.length} listing aktif</SectionLabel>

        <ul className="flex flex-col gap-3 pt-3">
          {store.myListings.map((l) => (
            <li key={l.id}>
              <Card className="flex items-center gap-3 p-3">
                <img
                  src={l.gambar}
                  alt={l.nama}
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{l.nama}</p>
                  <p className="pt-0.5 text-[11px] text-muted">
                    {l.berat_kg} kg • ID {l.id}
                  </p>
                  <p className="pt-1 text-sm font-bold text-brand">
                    {formatRupiah(l.harga_per_kg)}
                    <span className="text-[10px] font-medium text-muted">/kg</span>
                  </p>
                </div>
                <GradeBadge grade={l.grade} size="sm" />
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
