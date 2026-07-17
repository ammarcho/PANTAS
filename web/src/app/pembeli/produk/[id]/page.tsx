import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  MapPin,
  MessageCircle,
  Share2,
  ShoppingCart,
  Sparkles,
  Star,
} from "lucide-react";
import { Card, SectionLabel } from "@/components/ui";
import { LISTINGS, getListing } from "@/lib/data";
import { GRADE_COLOR, formatAngka, formatRupiah, num, persen } from "@/lib/format";
import type { Grade } from "@/lib/types";

const ORDER: Grade[] = ["A", "B", "C", "REJECT"];

export function generateStaticParams() {
  return LISTINGS.map((l) => ({ id: l.id }));
}

export default async function ProdukPage({ params }: PageProps<"/pembeli/produk/[id]">) {
  // Next 16: params is async-only.
  const { id } = await params;
  const l = await getListing(id);
  if (!l) notFound();

  const komposisi = l.komposisi ?? {};

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur-sm">
        <Link
          href="/pembeli"
          aria-label="Kembali"
          className="tap -ml-1 flex items-center gap-2 rounded p-1 text-brand hover:bg-brand-tint"
        >
          <ArrowLeft className="size-5" />
          <span className="text-base font-extrabold tracking-tight">PANTAS</span>
        </Link>
        <span className="flex items-center gap-1">
          <button aria-label="Bagikan" className="tap rounded p-2 text-ink hover:bg-canvas">
            <Share2 className="size-4" />
          </button>
          <button aria-label="Simpan" className="tap rounded p-2 text-ink hover:bg-canvas">
            <Heart className="size-4" />
          </button>
        </span>
      </header>

      <main className="flex-1 pb-4">
        <div className="relative aspect-4/3">
          <Image
            src={l.gambar}
            alt={l.nama}
            fill
            sizes="430px"
            className="object-cover"
            priority
          />
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-brand-deep px-2.5 py-1 text-[11px] font-bold text-white">
            <Sparkles className="size-3" />
            Grade {l.grade}
          </span>
        </div>

        <div className="px-4 pt-4">
          <h1 className="text-xl leading-7 font-extrabold text-ink">{l.nama}</h1>
          <p className="flex items-center gap-1 pt-1 text-xs text-muted">
            <MapPin className="size-3.5" />
            {l.lokasi}
          </p>
          <p className="pt-2 text-2xl font-extrabold text-brand">
            {formatRupiah(l.harga_per_kg)}
            <span className="text-xs font-medium text-muted"> / {l.satuan ?? "kg"}</span>
          </p>
        </div>

        {/* AI quality analysis — the differentiator vs a plain marketplace */}
        <div className="px-4 pt-4">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-tint">
                  <Sparkles className="size-4 text-brand-deep" />
                </span>
                <span className="text-sm font-bold text-ink">AI Quality Analysis</span>
              </span>
              <span className="flex items-center gap-1.5 rounded bg-brand-dark px-2 py-1 text-[9px] font-bold tracking-wide text-white uppercase">
                <span className="size-1.5 animate-pulse rounded-full bg-[#74c69d]" />
                Live Scan
              </span>
            </div>

            <div className="pt-4">
              <SectionLabel className="text-[10px]">
                Komposisi mutu terverifikasi
              </SectionLabel>
              <div className="mt-2 flex h-2.5 overflow-hidden rounded-full">
                {ORDER.map((g) => {
                  const frac = komposisi[g] ?? 0;
                  if (!frac) return null;
                  return (
                    <span
                      key={g}
                      style={{
                        width: `${frac * 100}%`,
                        backgroundColor: GRADE_COLOR[g],
                      }}
                    />
                  );
                })}
              </div>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 pt-2.5">
                {ORDER.filter((g) => komposisi[g]).map((g) => (
                  <li key={g} className="flex items-center gap-1 text-[10px]">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: GRADE_COLOR[g] }}
                    />
                    <span className="font-bold text-ink">{g}</span>
                    <span className="text-muted">{persen(komposisi[g]!)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {l.catatan_ai && (
              <blockquote className="mt-4 border-l-2 border-brand-tint-strong pl-3 text-xs leading-5 text-ink italic">
                &ldquo;{l.catatan_ai}&rdquo;
              </blockquote>
            )}
          </Card>
        </div>

        {/* Harga & stok */}
        <div className="px-4 pt-4">
          <Card className="p-4">
            <p className="text-sm font-bold text-ink">Informasi Harga & Stok</p>
            <div className="mt-3 rounded-lg bg-brand-tint p-3">
              <SectionLabel className="text-[10px]">Harga satuan</SectionLabel>
              <p className="pt-1 text-xl font-extrabold text-brand-deep">
                {formatRupiah(l.harga_per_kg)}
                <span className="text-[11px] font-medium text-muted">
                  {" "}
                  / {l.satuan ?? "kg"}
                </span>
              </p>
              <p className="pt-1 text-[11px] text-muted">
                Stok tersedia: {formatAngka(l.stok_kg ?? l.berat_kg)} kg
              </p>
            </div>
          </Card>
        </div>

        {/* Petani */}
        <div className="px-4 pt-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-deep text-sm font-bold text-white">
                {l.petani.split(" ").at(-1)?.[0] ?? "P"}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-ink">{l.petani}</span>
                <span className="block text-[11px] text-muted">
                  Mitra Terverifikasi PANTAS
                </span>
                <span className="flex items-center gap-1 pt-0.5 text-[11px] font-bold text-ink">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  {num(l.rating)}
                  <span className="font-normal text-muted">
                    ({l.transaksi} transaksi)
                  </span>
                </span>
              </span>
            </div>

            <div className="mt-3 divide-y divide-line border-t border-line">
              <div className="flex justify-between gap-3 py-2.5">
                <span className="text-xs text-muted">Waktu panen terakhir</span>
                <span className="text-xs font-bold text-ink">{l.panen_terakhir}</span>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <span className="text-xs text-muted">Stok tersedia</span>
                <span className="text-xs font-bold text-ink">
                  {formatAngka(l.stok_kg ?? l.berat_kg)} kg
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Lokasi */}
        <div className="px-4 pt-4">
          <Card className="overflow-hidden">
            <div className="relative h-32 bg-brand-dark">
              <Image
                src="/img/kebun.jpg"
                alt=""
                fill
                sizes="430px"
                className="object-cover opacity-45"
              />
              <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                <MapPin className="size-3" />
                {num(l.jarak_km)} km dari lokasi Anda
              </span>
            </div>
            <div className="p-4">
              <p className="text-xs leading-4 text-muted">{l.alamat}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tap tap-press mt-3 flex w-full items-center justify-center rounded-lg border border-brand py-2.5 text-xs font-bold text-brand hover:bg-brand-tint"
              >
                Buka di Google Maps
              </a>
            </div>
          </Card>
        </div>
      </main>

      <footer className="sticky bottom-0 z-10 flex gap-3 border-t border-line bg-white p-4">
        <button className="tap tap-press flex shrink-0 items-center justify-center gap-2 rounded-lg border border-brand px-4 py-3.5 text-xs font-bold text-brand hover:bg-brand-tint">
          <MessageCircle className="size-4 shrink-0" />
          Hubungi Petani
        </button>
        <Link
          href="/pembeli/pesanan"
          className="tap tap-press flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-deep py-3.5 text-sm font-bold text-white hover:bg-brand-dark"
        >
          <ShoppingCart className="size-4" />
          Buat Pesanan
        </Link>
      </footer>
    </>
  );
}
