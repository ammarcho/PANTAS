"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Card } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function AkunView({
  peranLabel,
  baris,
}: {
  peranLabel: string;
  baris: { k: string; v: string }[];
}) {
  const store = useStore();
  const router = useRouter();
  const sesi = store.sesi;
  if (!sesi) return null;

  const inisial = sesi.nama
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="flex-1 px-4 pt-4 pb-6">
      <Card className="flex items-center gap-4 p-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-deep text-lg font-bold text-white">
          {inisial}
        </span>
        <span>
          <span className="block text-base font-bold text-ink">{sesi.nama}</span>
          <span className="block text-xs text-muted">{peranLabel}</span>
        </span>
      </Card>

      <Card className="mt-4 divide-y divide-line px-4">
        <div className="flex items-center justify-between gap-3 py-3">
          <span className="text-xs text-muted">Email</span>
          <span className="text-xs font-bold break-all text-ink">
            {sesi.email}
          </span>
        </div>
        {baris.map(({ k, v }) => (
          <div key={k} className="flex items-center justify-between gap-3 py-3">
            <span className="text-xs text-muted">{k}</span>
            <span className="text-xs font-bold text-ink">{v}</span>
          </div>
        ))}
      </Card>

      <button
        onClick={() => {
          store.logout();
          router.replace("/");
        }}
        className="tap tap-press mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-white py-3.5 text-sm font-bold text-grade-reject hover:bg-canvas"
      >
        <LogOut className="size-4" />
        Keluar
      </button>
    </main>
  );
}
