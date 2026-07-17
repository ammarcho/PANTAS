"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, MapPin, Mic, Plus, Search } from "lucide-react";
import { GradeBadge, cx } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import type { Listing } from "@/lib/types";

type Filter = "grade_a" | "terdekat" | "termurah";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "grade_a", label: "Grade A" },
  { id: "terdekat", label: "Terdekat" },
  { id: "termurah", label: "Harga Terendah" },
];

export default function Katalog({ listings }: { listings: Listing[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Filter[]>(["grade_a"]);
  const [inquiry, setInquiry] = useState<string[]>([]);

  const shown = useMemo(() => {
    let out = listings;

    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (l) =>
          l.nama.toLowerCase().includes(q) ||
          l.lokasi.toLowerCase().includes(q) ||
          l.petani.toLowerCase().includes(q),
      );
    }
    if (active.includes("grade_a")) out = out.filter((l) => l.grade === "A");
    if (active.includes("terdekat"))
      out = [...out].sort((a, b) => a.jarak_km - b.jarak_km);
    if (active.includes("termurah"))
      out = [...out].sort((a, b) => a.harga_per_kg - b.harga_per_kg);

    return out;
  }, [listings, query, active]);

  function toggle(id: Filter) {
    setActive((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }

  return (
    <main className="flex-1 px-4 pt-4 pb-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-label" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari komoditas berkualitas…"
          aria-label="Cari komoditas"
          className="w-full rounded-lg border border-line bg-white py-3 pr-10 pl-9 text-sm text-ink placeholder:text-label focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
        />
        <button
          aria-label="Cari dengan suara"
          className="tap absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-brand hover:bg-brand-tint"
        >
          <Mic className="size-4" />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pt-3 pb-1">
        {FILTERS.map(({ id, label }) => {
          const on = active.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              aria-pressed={on}
              className={cx(
                "tap tap-press flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
                on
                  ? "bg-brand-deep text-white"
                  : "border border-line bg-white text-muted hover:border-placeholder",
              )}
            >
              {on && <Check className="size-3" />}
              {label}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          Tidak ada komoditas yang cocok. Coba longgarkan filter.
        </p>
      ) : (
        <ul className="flex flex-col gap-4 pt-4">
          {shown.map((l) => {
            const added = inquiry.includes(l.id);
            return (
              <li
                key={l.id}
                className="rise overflow-hidden rounded-card border border-line bg-white"
              >
                <Link href={`/pembeli/produk/${l.id}`} className="tap block">
                  <div className="relative aspect-16/9">
                    <Image
                      src={l.gambar}
                      alt={l.nama}
                      fill
                      sizes="430px"
                      className="object-cover"
                    />
                    <span className="absolute top-2 left-2">
                      <GradeBadge grade={l.grade} />
                    </span>
                  </div>

                  <div className="p-3">
                    <p className="text-sm font-bold text-ink">{l.nama}</p>
                    <p className="flex items-center gap-1 pt-1 text-[11px] text-muted">
                      <MapPin className="size-3 shrink-0" />
                      {l.petani}, {l.lokasi}
                    </p>
                    <p className="pt-1.5 text-base font-extrabold text-brand">
                      {formatRupiah(l.harga_per_kg)}
                      <span className="text-[11px] font-medium text-muted">
                        {" "}
                        / {l.satuan ?? "kg"}
                      </span>
                    </p>
                  </div>
                </Link>

                <div className="px-3 pb-3">
                  <button
                    onClick={() =>
                      setInquiry((p) =>
                        added ? p.filter((i) => i !== l.id) : [...p, l.id],
                      )
                    }
                    className={cx(
                      "tap tap-press flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold",
                      added
                        ? "bg-brand-tint text-brand-deep"
                        : "bg-brand text-white hover:bg-brand-deep",
                    )}
                  >
                    {added ? (
                      <>
                        <Check className="size-4" />
                        Ditambahkan
                      </>
                    ) : (
                      <>
                        <Plus className="size-4" />
                        Add to Inquiry
                      </>
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
