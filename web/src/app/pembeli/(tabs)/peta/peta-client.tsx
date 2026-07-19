"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, Star, X } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { GradeBadge, cx } from "@/components/ui";
import { formatRupiah, haversineKm, num } from "@/lib/format";
import type { Listing } from "@/lib/types";

// Leaflet touches `window` at import time, so it must not run on the server.
const PetaMap = dynamic(() => import("@/components/peta-map"), {
  ssr: false,
  loading: () => (
    <div className="size-full animate-pulse bg-[#e8ece7]" aria-hidden="true" />
  ),
});

const CHIPS = ["Grade A", "Grade B", "≤ 25 km"];

export default function PetaClient({ listings }: { listings: Listing[] }) {
  const [query, setQuery] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>();
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // Fallback diam-diam, keep userLoc null
      );
    }
  }, []);

  const shown = useMemo(() => {
    let out = listings;
    
    // Replace jarak_km with dynamic value if location is available
    if (userLoc) {
      out = out.map((l) => ({
        ...l,
        jarak_km: l.lat && l.lng ? haversineKm(l.lat, l.lng, userLoc.lat, userLoc.lng) : l.jarak_km,
      }));
    }
    const q = query.trim().toLowerCase();
    if (q) out = out.filter((l) => l.nama.toLowerCase().includes(q) || l.komoditas.toLowerCase().includes(q));
    if (chips.includes("Grade A")) out = out.filter((l) => l.grade === "A");
    if (chips.includes("Grade B")) out = out.filter((l) => l.grade === "B");
    if (chips.includes("≤ 25 km")) out = out.filter((l) => l.jarak_km <= 25);
    return out;
  }, [listings, query, chips]);

  return (
    <>
      <BackBar title="Pencarian & Peta" href="/pembeli" />

      <main className="flex flex-1 flex-col px-4 pt-3 pb-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-label" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Cari komoditas"
            placeholder="Cari komoditas…"
            className="w-full rounded-lg border border-line bg-white py-3 pr-3 pl-9 text-sm text-ink placeholder:text-label focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-3">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setChips((p) => p.filter((x) => x !== c))}
              className="tap tap-press flex items-center gap-1.5 rounded-full bg-brand-deep px-3 py-1.5 text-xs font-bold text-white"
            >
              {c}
              <X className="size-3" />
            </button>
          ))}
          {chips.length < CHIPS.length && (
            <button
              onClick={() => setChips(CHIPS)}
              className="tap tap-press rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-muted hover:border-placeholder"
            >
              + Filter
            </button>
          )}
        </div>

        <div className="mt-3 h-52 overflow-hidden rounded-card border border-line">
          <PetaMap listings={shown} selectedId={selected} onSelect={setSelected} />
        </div>

        <ul className="flex flex-col gap-3 pt-4">
          {shown.map((l) => (
            <li key={l.id}>
              <Link
                href={`/pembeli/produk/${l.id}`}
                onMouseEnter={() => setSelected(l.id)}
                className={cx(
                  "tap tap-press flex items-start justify-between gap-3 rounded-card border bg-white p-4",
                  selected === l.id
                    ? "border-brand"
                    : "border-line hover:border-placeholder",
                )}
              >
                <span>
                  <span className="block text-base font-bold text-ink">
                    {l.nama} · {l.berat_kg} kg
                  </span>
                  <span className="block pt-1 text-xs text-muted">
                    {formatRupiah(l.harga_per_kg)}/kg · {num(l.jarak_km)} km ·{" "}
                    {l.petani}
                  </span>
                  <span className="flex items-center gap-1 pt-1.5 text-xs font-bold text-ink">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    {num(l.rating)}
                  </span>
                </span>
                <GradeBadge grade={l.grade} />
              </Link>
            </li>
          ))}
          {shown.length === 0 && (
            <li className="py-10 text-center text-sm text-muted">
              Tidak ada hasil di area ini.
            </li>
          )}
        </ul>
      </main>
    </>
  );
}
