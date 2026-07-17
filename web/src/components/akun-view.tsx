import Link from "next/link";
import { LogOut } from "lucide-react";
import { Card } from "@/components/ui";

export default function AkunView({
  nama,
  peran,
  inisial,
  baris,
}: {
  nama: string;
  peran: string;
  inisial: string;
  baris: { k: string; v: string }[];
}) {
  return (
    <main className="flex-1 px-4 pt-4 pb-6">
      <Card className="flex items-center gap-4 p-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-deep text-lg font-bold text-white">
          {inisial}
        </span>
        <span>
          <span className="block text-base font-bold text-ink">{nama}</span>
          <span className="block text-xs text-muted">{peran}</span>
        </span>
      </Card>

      <Card className="mt-4 divide-y divide-line px-4">
        {baris.map(({ k, v }) => (
          <div key={k} className="flex items-center justify-between gap-3 py-3">
            <span className="text-xs text-muted">{k}</span>
            <span className="text-xs font-bold text-ink">{v}</span>
          </div>
        ))}
      </Card>

      <Link
        href="/"
        className="tap tap-press mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-white py-3.5 text-sm font-bold text-grade-reject hover:bg-canvas"
      >
        <LogOut className="size-4" />
        Keluar
      </Link>
    </main>
  );
}
