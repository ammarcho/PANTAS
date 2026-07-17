"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, cx } from "@/components/ui";
import { formatAngka } from "@/lib/format";

/**
 * The petani may price outside the AI range — PANTAS advises, it does not
 * enforce. The badge just tells them where they stand.
 */
export default function HargaForm({ min, max }: { min: number; max: number }) {
  const [harga, setHarga] = useState(10000);

  const status =
    harga < min ? "rendah" : harga > max ? "tinggi" : ("wajar" as const);

  const badge = {
    wajar: { text: "Dalam rentang wajar", cls: "bg-brand-tint text-brand" },
    rendah: { text: "Di bawah rentang", cls: "bg-amber-50 text-grade-b" },
    tinggi: { text: "Di atas rentang", cls: "bg-red-50 text-grade-reject" },
  }[status];

  return (
    <>
      <Card className="mt-2 flex items-center justify-between gap-3 p-4">
        <label htmlFor="harga" className="flex items-baseline gap-1 text-lg font-extrabold text-ink">
          Rp
          <input
            id="harga"
            type="text"
            inputMode="numeric"
            value={formatAngka(harga)}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/\D/g, "").slice(0, 8));
              setHarga(Number.isNaN(n) ? 0 : n);
            }}
            className="w-24 bg-transparent text-lg font-extrabold text-ink focus:outline-none"
          />
        </label>

        <span
          className={cx(
            "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
            badge.cls,
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {badge.text}
        </span>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[430px] border-t border-line bg-white p-4">
        <Link
          href="/petani/listing-tayang"
          className="tap tap-press flex w-full items-center justify-center rounded-lg bg-brand py-4 text-base font-bold text-white hover:bg-brand-deep"
        >
          Terbitkan Listing
        </Link>
      </div>
    </>
  );
}
