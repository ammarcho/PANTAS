"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import QRCode from "qrcode";
import type { StatusPesanan } from "@/lib/types";

export const STEPS: { id: StatusPesanan; label: string }[] = [
  { id: "dipesan", label: "Dipesan" },
  { id: "dikonfirmasi", label: "Dikonfirmasi" },
  { id: "serah_terima", label: "Serah Terima" },
  { id: "selesai", label: "Selesai" },
];

export const STATUS_LABEL: Record<StatusPesanan, string> = {
  dipesan: "Menunggu Konfirmasi",
  dikonfirmasi: "Dikonfirmasi Penjual",
  serah_terima: "Menunggu Serah Terima",
  selesai: "Pesanan Selesai",
};

export function StatusStepper({ status }: { status: StatusPesanan }) {
  const current = STEPS.findIndex((s) => s.id === status);

  return (
    <ol className="flex items-start">
      {STEPS.map((s, i) => {
        const done = i < current || status === "selesai";
        const active = i === current && status !== "selesai";
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
  );
}

/**
 * Client-rendered because orders now live in localStorage — the server never
 * sees them. Same real, scannable code as before.
 */
export function QrKode({ value }: { value: string }) {
  const [svg, setSvg] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 0,
      color: { dark: "#111827", light: "#ffffff00" },
    }).then((s) => {
      if (!cancelled) setSvg(s);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!svg) return <div className="size-44 animate-pulse rounded-lg bg-canvas" />;

  return (
    <div
      className="size-44 rounded-lg bg-canvas p-3 [&>svg]:size-full"
      role="img"
      aria-label={`Kode QR transaksi ${value}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
