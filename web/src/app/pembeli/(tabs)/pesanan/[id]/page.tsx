"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Info, PartyPopper } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { QrKode, STATUS_LABEL, StatusStepper } from "@/components/order-bits";
import { ButtonLink, Card, GradeBadge, SectionLabel } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function PesananDetailPage() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const router = useRouter();
  const order = store.orders.find((o) => o.id === id);

  useEffect(() => {
    if (store.ready && !order) router.replace("/pembeli/pesanan");
  }, [store.ready, order, router]);

  if (!order) return null;

  const wa = `https://wa.me/?text=${encodeURIComponent(
    `Halo ${order.petani}, saya pembeli pesanan ${order.nama} #${order.id} di PANTAS.`,
  )}`;

  return (
    <>
      <BackBar title={`Pesanan #${order.id}`} href="/pembeli/pesanan" />

      <main className="flex-1 px-4 pt-4 pb-6">
        <h1 className="text-xl font-extrabold text-ink">
          {STATUS_LABEL[order.status]}
        </h1>

        <div className="pt-6">
          <StatusStepper status={order.status} />
        </div>

        {order.status === "selesai" ? (
          <Card className="mt-6 flex flex-col items-center p-6 text-center">
            <PartyPopper className="size-8 text-brand" />
            <p className="pt-3 text-sm font-bold text-ink">
              Serah terima terverifikasi
            </p>
            <p className="pt-1 text-xs text-muted">
              Transaksi selesai. Terima kasih telah menyelamatkan panen lokal.
            </p>
          </Card>
        ) : (
          <Card className="mt-6 p-5">
            <SectionLabel className="text-center">Kode Transaksi</SectionLabel>
            <div className="flex justify-center pt-4">
              <QrKode value={order.kode} />
            </div>
            <p className="pt-4 text-center font-mono text-lg font-bold tracking-[0.2em] text-ink">
              {order.kode}
            </p>
            <p className="pt-2 text-center text-[11px] leading-4 text-muted">
              Tunjukkan kode ini kepada penjual saat serah terima untuk verifikasi.
            </p>
          </Card>
        )}

        {/* Order summary */}
        <Card className="mt-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-bold text-ink">{order.nama}</p>
              <div className="flex items-center gap-2 pt-1.5">
                <GradeBadge grade={order.grade} size="sm" />
                <span className="text-xs text-muted">• {order.berat_kg} kg</span>
              </div>
            </div>
            <div className="text-right">
              <SectionLabel className="text-[10px]">Harga</SectionLabel>
              <p className="pt-0.5 text-sm font-bold text-ink">
                {formatRupiah(order.harga_per_kg)}/kg
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-base font-bold text-ink">Total</span>
            <span className="text-xl font-extrabold text-brand">
              {formatRupiah(order.total)}
            </span>
          </div>

          {order.status !== "selesai" && (
            <p className="mt-3 flex gap-2 rounded-lg bg-canvas p-3 text-[11px] leading-4 text-muted">
              <Info className="size-4 shrink-0" />
              Pembayaran tunai/transfer saat serah terima (v1 tanpa payment gateway)
            </p>
          )}
        </Card>
      </main>

      <footer className="sticky bottom-0 border-t border-line bg-white p-4">
        <ButtonLink href={wa} target="_blank" rel="noopener noreferrer" variant="outline">
          Hubungi Penjual via WhatsApp
        </ButtonLink>
      </footer>
    </>
  );
}
