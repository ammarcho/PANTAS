"use client";

import Image from "next/image";
import Link from "next/link";
import { ClipboardList, Minus, Plus, Trash2 } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { ButtonLink, Card, GradeBadge, SectionLabel } from "@/components/ui";
import { LISTINGS } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function InquiryPage() {
  const store = useStore();

  const items = Object.entries(store.inquiry)
    .map(([id, qty]) => ({ listing: LISTINGS.find((l) => l.id === id), qty }))
    .filter((x): x is { listing: (typeof LISTINGS)[number]; qty: number } =>
      Boolean(x.listing),
    );

  const total = items.reduce((s, x) => s + x.qty * x.listing.harga_per_kg, 0);

  const wa = `https://wa.me/?text=${encodeURIComponent(
    `Halo, saya ingin inquiry via PANTAS:\n${items
      .map(
        (x) =>
          `• ${x.listing.nama} (Grade ${x.listing.grade}) — ${x.qty} kg @ ${formatRupiah(x.listing.harga_per_kg)}/kg dari ${x.listing.petani}`,
      )
      .join("\n")}\nEstimasi total: ${formatRupiah(total)}`,
  )}`;

  return (
    <>
      <BackBar title="Inquiry Saya" href="/pembeli" />

      <main className="flex-1 px-4 pt-4 pb-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center pt-20 text-center">
            <ClipboardList className="size-10 text-label" />
            <p className="pt-4 text-sm font-bold text-ink">Inquiry kosong</p>
            <p className="pt-1 text-xs text-muted">
              Tambahkan komoditas dari katalog untuk mulai menawar.
            </p>
            <div className="w-full max-w-60 pt-6">
              <ButtonLink href="/pembeli">Lihat Katalog</ButtonLink>
            </div>
          </div>
        ) : (
          <>
            <SectionLabel>{items.length} komoditas</SectionLabel>

            <ul className="flex flex-col gap-3 pt-3">
              {items.map(({ listing, qty }) => (
                <li key={listing.id}>
                  <Card className="p-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/pembeli/produk/${listing.id}`}
                        className="tap relative size-16 shrink-0 overflow-hidden rounded-lg"
                      >
                        <Image
                          src={listing.gambar}
                          alt={listing.nama}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">
                          {listing.nama}
                        </p>
                        <p className="pt-0.5 text-[11px] text-muted">
                          {formatRupiah(listing.harga_per_kg)}/kg • {listing.petani}
                        </p>
                        <div className="pt-1">
                          <GradeBadge grade={listing.grade} size="sm" />
                        </div>
                      </div>
                      <button
                        onClick={() => store.setInquiryQty(listing.id, 0)}
                        aria-label={`Hapus ${listing.nama} dari inquiry`}
                        className="tap rounded p-2 text-label hover:bg-canvas hover:text-grade-reject"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => store.setInquiryQty(listing.id, qty - 10)}
                          aria-label="Kurangi 10 kg"
                          className="tap tap-press rounded-lg border border-line p-1.5 text-muted hover:bg-canvas"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="min-w-16 text-center text-sm font-bold text-ink">
                          {qty} kg
                        </span>
                        <button
                          onClick={() =>
                            store.setInquiryQty(
                              listing.id,
                              Math.min(listing.stok_kg ?? listing.berat_kg, qty + 10),
                            )
                          }
                          aria-label="Tambah 10 kg"
                          className="tap tap-press rounded-lg border border-line p-1.5 text-muted hover:bg-canvas"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <p className="text-sm font-extrabold text-ink">
                        {formatRupiah(qty * listing.harga_per_kg)}
                      </p>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>

            <Card className="mt-4 flex items-center justify-between p-4">
              <span className="text-sm font-bold text-ink">Estimasi total</span>
              <span className="text-xl font-extrabold text-brand">
                {formatRupiah(total)}
              </span>
            </Card>
          </>
        )}
      </main>

      {items.length > 0 && (
        <footer className="sticky bottom-0 border-t border-line bg-white p-4">
          <ButtonLink href={wa} target="_blank" rel="noopener noreferrer" variant="primary">
            Kirim Inquiry via WhatsApp
          </ButtonLink>
        </footer>
      )}
    </>
  );
}
