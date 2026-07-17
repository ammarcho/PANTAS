"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Listing } from "@/lib/types";

/** Footer actions + the quantity sheet that actually creates the order. */
export default function OrderActions({ listing }: { listing: Listing }) {
  const router = useRouter();
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(Math.min(listing.berat_kg, 50));
  const maxQty = listing.stok_kg ?? listing.berat_kg;

  const wa = `https://wa.me/?text=${encodeURIComponent(
    `Halo ${listing.petani}, saya tertarik dengan ${listing.nama} (Grade ${listing.grade}) di PANTAS. Apakah masih tersedia?`,
  )}`;

  function konfirmasi() {
    const order = store.createOrder(listing, qty);
    router.push(`/pembeli/pesanan/${order.id}`);
  }

  return (
    <>
      <footer className="sticky bottom-0 z-10 flex gap-3 border-t border-line bg-white p-4">
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="tap tap-press flex shrink-0 items-center justify-center gap-2 rounded-lg border border-brand px-4 py-3.5 text-xs font-bold text-brand hover:bg-brand-tint"
        >
          <MessageCircle className="size-4 shrink-0" />
          Hubungi Petani
        </a>
        <button
          onClick={() => setOpen(true)}
          className="tap tap-press flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-deep py-3.5 text-sm font-bold text-white hover:bg-brand-dark"
        >
          <ShoppingCart className="size-4" />
          Buat Pesanan
        </button>
      </footer>

      {/* Quantity sheet */}
      {open && (
        <div
          className="fixed inset-0 z-30 mx-auto flex w-full max-w-[430px] flex-col justify-end bg-black/40"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Atur jumlah pesanan"
        >
          <div className="rise rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-bold text-ink">{listing.nama}</p>
                <p className="pt-0.5 text-xs text-muted">
                  {formatRupiah(listing.harga_per_kg)}/kg • stok {maxQty} kg
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="tap rounded p-1.5 text-muted hover:bg-canvas"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-6">
              <button
                onClick={() => setQty((q) => Math.max(10, q - 10))}
                aria-label="Kurangi 10 kg"
                className="tap tap-press rounded-xl border border-line p-3 text-muted hover:bg-canvas"
              >
                <Minus className="size-5" />
              </button>
              <div className="min-w-28 text-center">
                <p className="text-3xl font-extrabold text-ink">{qty}</p>
                <p className="text-xs text-muted">kilogram</p>
              </div>
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 10))}
                aria-label="Tambah 10 kg"
                className="tap tap-press rounded-xl border border-line p-3 text-muted hover:bg-canvas"
              >
                <Plus className="size-5" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-lg bg-canvas p-3">
              <span className="text-sm text-muted">Estimasi total</span>
              <span className="text-lg font-extrabold text-brand">
                {formatRupiah(qty * listing.harga_per_kg)}
              </span>
            </div>

            <button
              onClick={konfirmasi}
              className="tap tap-press mt-4 flex w-full items-center justify-center rounded-lg bg-brand py-4 text-base font-bold text-white hover:bg-brand-deep"
            >
              Konfirmasi Pesanan
            </button>
            <p className="pt-3 text-center text-[11px] text-muted">
              Pembayaran tunai/transfer saat serah terima.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
