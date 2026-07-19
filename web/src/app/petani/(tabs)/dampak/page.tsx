"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Bell, User } from "lucide-react";
import { Card, SectionLabel } from "@/components/ui";
import { formatAngka, formatRupiahRingkas, num } from "@/lib/format";
import { useStore } from "@/lib/store";

/** Area sparkline for kg saved per week. Plain SVG — no chart library needed. */
function TrenMingguan({ data }: { data: { minggu: string; kg: number }[] }) {
  const W = 320;
  const H = 90;
  const max = Math.max(...data.map((d) => d.kg)) * 1.15;
  const step = W / (data.length - 1);

  const pts = data.map((d, i) => [i * step, H - (d.kg / max) * H] as const);
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${line} ${W},${H} 0,${H}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-24 w-full overflow-visible"
      role="img"
      aria-label={`Tren kg terselamatkan per minggu, dari ${data[0].kg} kg ke ${data.at(-1)!.kg} kg`}
    >
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1="0"
          x2={W}
          y1={H * f}
          y2={H * f}
          stroke="var(--color-line)"
          strokeWidth="1"
        />
      ))}
      <polygon points={area} fill="var(--color-brand)" opacity="0.1" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--color-brand-deep)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts.at(-1)![0]}
        cy={pts.at(-1)![1]}
        r="3.5"
        fill="var(--color-brand-deep)"
      />
    </svg>
  );
}

export default function DampakPage() {
  const store = useStore();

  // Hanya gunakan data nyata dari pesanan yang benar-benar selesai
  const selesai = store.orders.filter((o) => o.status === "selesai");
  const kgSelesai = selesai.reduce((s, o) => s + o.berat_kg, 0);
  const rpSelesai = selesai.reduce((s, o) => s + o.total, 0);

  const stats = useMemo(() => {
    const kg = kgSelesai;
    return {
      kg,
      co2: parseFloat(((kg / 1000) * 1.7).toFixed(2)), // ~1.7 t CO₂e per ton food loss avoided
      rp: rpSelesai,
      transaksi: selesai.length,
    };
  }, [kgSelesai, rpSelesai, selesai.length]);

  // Grafik tren: bentuk naik berdasarkan scan yang tersimpan (per minggu)
  const mingguan = useMemo(() => {
    if (store.scans.length === 0) return null;
    // Kelompokkan scan ke dalam 8 slot terakhir (tiap slot = 7 hari)
    const now = Date.now();
    const slots = Array.from({ length: 8 }, (_, i) => ({
      minggu: `M${i + 1}`,
      kg: 0,
    }));
    store.scans.forEach((s) => {
      const daysAgo = (now - new Date(s.tanggal).getTime()) / 86400000;
      const slotIdx = Math.min(7, Math.floor(daysAgo / 7));
      const slot = slots[7 - slotIdx];
      if (slot) slot.kg += s.objek * 0.3; // estimasi 0.3 kg/objek
    });
    const hasData = slots.some((s) => s.kg > 0);
    return hasData ? slots : null;
  }, [store.scans]);

  const tiles = [
    { v: `${formatAngka(stats.kg)} kg`, k: "panen terselamatkan dari food loss (akun Anda)" },
    { v: `${num(stats.co2)} ton`, k: "emisi CO₂e dicegah (estimasi)" },
    { v: formatRupiahRingkas(stats.rp), k: "pendapatan dari transaksi selesai" },
    { v: String(stats.transaksi), k: "transaksi selesai" },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 grid h-14 grid-cols-[auto_1fr_auto] items-center border-b border-line bg-white/90 px-4 backdrop-blur-sm">
        <Link
          href="/petani/akun"
          aria-label="Akun"
          className="tap -ml-1 rounded p-1 text-ink hover:bg-canvas"
        >
          <User className="size-5" />
        </Link>
        <h1 className="text-center text-xs font-bold tracking-[1.2px] text-muted uppercase">
          Dampak PANTAS
        </h1>
        <Link
          href="/petani/pesanan"
          aria-label="Notifikasi"
          className="tap -mr-1 rounded p-1 text-ink hover:bg-canvas"
        >
          <Bell className="size-5" />
        </Link>
      </header>

      <main className="flex-1 px-4 pt-4 pb-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="max-w-[200px] text-xl leading-7 font-extrabold text-ink">
            Dampak transaksi Anda
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4">
          {tiles.map(({ v, k }) => (
            <Card key={k} className="rise p-4">
              <p className="text-xl font-extrabold text-brand-deep">{v}</p>
              <p className="pt-1 text-[11px] leading-4 text-muted">{k}</p>
            </Card>
          ))}
        </div>

        {mingguan ? (
          <Card className="mt-4 p-4">
            <div className="flex items-start justify-between">
              <SectionLabel>Estimasi kg terselamatkan / minggu</SectionLabel>
              <span className="rounded bg-canvas px-2 py-0.5 text-[11px] font-bold text-ink">
                {mingguan.at(-1)!.kg.toFixed(0)} kg
              </span>
            </div>
            <div className="pt-4">
              <TrenMingguan data={mingguan} />
            </div>
          </Card>
        ) : (
          <Card className="mt-4 p-4 text-center">
            <p className="text-sm font-bold text-ink">Belum ada data pindaian</p>
            <p className="pt-1 text-xs text-muted">
              Mulai pindai panen untuk melihat grafik dampak Anda.
            </p>
          </Card>
        )}

        {stats.transaksi === 0 && (
          <Card className="mt-4 p-4 text-center">
            <p className="text-sm font-bold text-ink">Belum ada transaksi selesai</p>
            <p className="pt-1 text-xs text-muted">
              Dampak dihitung dari pesanan yang sudah selesai serah terima.
            </p>
          </Card>
        )}
      </main>
    </>
  );
}
