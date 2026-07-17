import { Bell, Check, Info, MessageCircle } from "lucide-react";
import { BrandBar } from "@/components/chrome";
import { Card, GradeBadge, SectionLabel } from "@/components/ui";
import { getPesanan } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import type { StatusPesanan } from "@/lib/types";
import QrKode from "./qr-kode";

const STEPS: { id: StatusPesanan; label: string }[] = [
  { id: "dipesan", label: "Dipesan" },
  { id: "dikonfirmasi", label: "Dikonfirmasi" },
  { id: "serah_terima", label: "Serah Terima" },
  { id: "selesai", label: "Selesai" },
];

export default async function PesananPage() {
  const p = await getPesanan();
  const current = STEPS.findIndex((s) => s.id === p.status);

  return (
    <>
      <BrandBar
        right={
          <button aria-label="Notifikasi" className="tap rounded p-1 text-ink hover:bg-canvas">
            <Bell className="size-5" />
          </button>
        }
      />

      <main className="flex-1 px-4 pt-4 pb-6">
        <SectionLabel>Pesanan #{p.id}</SectionLabel>
        <h1 className="pt-1 text-xl font-extrabold text-ink">Menunggu Serah Terima</h1>

        {/* Progress */}
        <ol className="flex items-start pt-6">
          {STEPS.map((s, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={s.id} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  <span
                    className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : done || active ? "bg-brand" : "bg-line"}`}
                  />
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      done
                        ? "border-brand bg-brand text-white"
                        : active
                          ? "border-grade-b bg-white"
                          : "border-line bg-white"
                    }`}
                  >
                    {done ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : active ? (
                      <span className="size-2 rounded-full bg-grade-b" />
                    ) : null}
                  </span>
                  <span
                    className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? "bg-transparent" : done ? "bg-brand" : "bg-line"}`}
                  />
                </div>
                <span
                  className={`pt-2 text-center text-[10px] leading-tight ${
                    active
                      ? "font-bold text-grade-b"
                      : done
                        ? "font-bold text-brand"
                        : "text-label"
                  }`}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Handover code */}
        <Card className="mt-6 p-5">
          <SectionLabel className="text-center">Kode Transaksi</SectionLabel>
          <div className="flex justify-center pt-4">
            <QrKode value={p.kode} />
          </div>
          <p className="pt-4 text-center font-mono text-lg font-bold tracking-[0.2em] text-ink">
            {p.kode}
          </p>
          <p className="pt-2 text-center text-[11px] leading-4 text-muted">
            Tunjukkan kode ini kepada penjual saat serah terima untuk verifikasi.
          </p>
        </Card>

        {/* Order summary */}
        <Card className="mt-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-bold text-ink">{p.nama}</p>
              <div className="flex items-center gap-2 pt-1.5">
                <GradeBadge grade={p.grade} size="sm" />
                <span className="text-xs text-muted">• {p.berat_kg} kg</span>
              </div>
            </div>
            <div className="text-right">
              <SectionLabel className="text-[10px]">Harga</SectionLabel>
              <p className="pt-0.5 text-sm font-bold text-ink">
                {formatRupiah(p.harga_per_kg)}/kg
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-base font-bold text-ink">Total</span>
            <span className="text-xl font-extrabold text-brand">
              {formatRupiah(p.total)}
            </span>
          </div>

          <p className="mt-3 flex gap-2 rounded-lg bg-canvas p-3 text-[11px] leading-4 text-muted">
            <Info className="size-4 shrink-0" />
            Pembayaran tunai/transfer saat serah terima (v1 tanpa payment gateway)
          </p>
        </Card>
      </main>

      <footer className="sticky bottom-0 border-t border-line bg-white p-4">
        <button className="tap tap-press flex w-full items-center justify-center gap-2 rounded-lg border border-brand py-3.5 text-sm font-bold text-brand hover:bg-brand-tint">
          <MessageCircle className="size-4" />
          Hubungi Penjual
        </button>
      </footer>
    </>
  );
}
