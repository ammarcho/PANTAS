"use client";

import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { BrandBar } from "@/components/chrome";
import { STATUS_LABEL } from "@/components/order-bits";
import { Card, GradeBadge, SectionLabel } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function PesananPetaniPage() {
  const store = useStore();
  const orders = store.orders;

  return (
    <>
      <BrandBar />
      <main className="flex-1 px-4 pt-4 pb-6">
        <h1 className="text-xl font-extrabold text-ink">Pesanan Masuk</h1>
        <SectionLabel className="pt-1">{orders.length} pesanan</SectionLabel>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center pt-20 text-center">
            <Inbox className="size-10 text-label" />
            <p className="pt-4 text-sm font-bold text-ink">Belum ada pesanan masuk</p>
            <p className="pt-1 text-xs text-muted">
              Pesanan dari pembeli industri muncul di sini.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3 pt-4">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/petani/pesanan/${o.id}`} className="tap tap-press block">
                  <Card className="p-4 hover:border-placeholder">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink">{o.nama}</p>
                        <p className="pt-0.5 text-[11px] text-muted">{o.pembeli}</p>
                      </div>
                      <GradeBadge grade={o.grade} size="sm" />
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
                      <div>
                        <p className="text-[11px] text-muted">
                          #{o.id} • {o.berat_kg} kg
                        </p>
                        <p
                          className={`pt-0.5 text-[11px] font-bold ${o.status === "selesai" ? "text-brand" : "text-grade-b"}`}
                        >
                          {STATUS_LABEL[o.status]}
                        </p>
                      </div>
                      <p className="flex items-center gap-1 text-base font-extrabold text-ink">
                        {formatRupiah(o.total)}
                        <ChevronRight className="size-4 text-label" />
                      </p>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
