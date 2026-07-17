"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { STATUS_LABEL, StatusStepper } from "@/components/order-bits";
import { Button, ButtonLink, Card, GradeBadge, SectionLabel, cx } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function PesananPetaniDetail() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const router = useRouter();
  const order = store.orders.find((o) => o.id === id);

  const [kode, setKode] = useState("");
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    if (store.ready && !order) router.replace("/petani/pesanan");
  }, [store.ready, order, router]);

  if (!order) return null;

  function verifikasi() {
    if (!order) return;
    const ok = store.verifikasiSerahTerima(order.id, kode);
    setGagal(!ok);
    if (ok) setKode("");
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(
    `Halo ${order.pembeli}, pesanan ${order.nama} #${order.id} siap diserahterimakan.`,
  )}`;

  return (
    <>
      <BackBar title={`Pesanan #${order.id}`} href="/petani/pesanan" />

      <main className="flex-1 px-4 pt-4 pb-6">
        <h1 className="text-xl font-extrabold text-ink">
          {STATUS_LABEL[order.status]}
        </h1>
        <p className="pt-1 text-xs text-muted">Pembeli: {order.pembeli}</p>

        <div className="pt-6">
          <StatusStepper status={order.status} />
        </div>

        {order.status === "selesai" ? (
          <Card className="mt-6 flex flex-col items-center p-6 text-center">
            <CheckCircle2 className="size-8 text-brand" />
            <p className="pt-3 text-sm font-bold text-ink">Transaksi selesai</p>
            <p className="pt-1 text-xs text-muted">
              Serah terima terverifikasi dengan kode pembeli.
            </p>
          </Card>
        ) : (
          <Card className="mt-6 p-5">
            <SectionLabel>Verifikasi serah terima</SectionLabel>
            <p className="pt-2 text-xs leading-4 text-muted">
              Minta pembeli menunjukkan kode transaksi mereka, lalu masukkan di
              sini untuk menyelesaikan pesanan.
            </p>

            <div className="flex items-center gap-2 pt-4">
              <div className="relative flex-1">
                <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-label" />
                <input
                  value={kode}
                  onChange={(e) => {
                    setKode(e.target.value.toUpperCase());
                    setGagal(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && verifikasi()}
                  placeholder="PNT-XXXX-XX"
                  aria-label="Kode transaksi pembeli"
                  className={cx(
                    "w-full rounded-lg border bg-white py-3 pr-3 pl-9 font-mono text-sm font-bold tracking-wider text-ink placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-placeholder",
                    "focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none",
                    gagal ? "border-grade-reject" : "border-line",
                  )}
                />
              </div>
            </div>

            {gagal && (
              <p className="pt-2 text-xs font-bold text-grade-reject">
                Kode tidak cocok dengan pesanan ini.
              </p>
            )}

            <div className="pt-4">
              <Button onClick={verifikasi} disabled={kode.replace(/[\s-]/g, "").length < 6}>
                Verifikasi & Selesaikan
              </Button>
            </div>
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
        </Card>
      </main>

      <footer className="sticky bottom-0 border-t border-line bg-white p-4">
        <ButtonLink href={wa} target="_blank" rel="noopener noreferrer" variant="outline">
          Hubungi Pembeli via WhatsApp
        </ButtonLink>
      </footer>
    </>
  );
}
