"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, ChevronDown, User } from "lucide-react";
import { Card, SectionLabel, cx } from "@/components/ui";
import { formatAngka, formatRupiahRingkas, num } from "@/lib/format";
import { useStore } from "@/lib/store";

const MINGGUAN_SEED = [
  { minggu: "M1", kg: 96 },
  { minggu: "M2", kg: 108 },
  { minggu: "M3", kg: 124 },
  { minggu: "M4", kg: 118 },
  { minggu: "M5", kg: 152 },
  { minggu: "M6", kg: 168 },
  { minggu: "M7", kg: 202 },
  { minggu: "M8", kg: 240 },
];

const PER_KOMODITAS_SEED = [
  { nama: "Tomat", kg: 520 },
  { nama: "Cabai", kg: 390 },
  { nama: "Timun", kg: 210 },
  { nama: "Wortel", kg: 120 },
];

/** Share of activity per region — v1 uses fixed shares over the mock totals. */
const WILAYAH: { id: string; label: string; faktor: number }[] = [
  { id: "semua", label: "Semua wilayah", faktor: 1 },
  { id: "bbr", label: "Bandung Barat", faktor: 0.58 },
  { id: "skb", label: "Sukabumi", faktor: 0.27 },
  { id: "lainnya", label: "Wilayah lain", faktor: 0.15 },
];

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
  const [wilayah, setWilayah] = useState("semua");
  const [openWilayah, setOpenWilayah] = useState(false);

  const f = WILAYAH.find((w) => w.id === wilayah)?.faktor ?? 1;

  // Live component: completed orders in the store count toward impact.
  const selesai = store.orders.filter((o) => o.status === "selesai");
  const kgSelesai = selesai.reduce((s, o) => s + o.berat_kg, 0);
  const rpSelesai = selesai.reduce((s, o) => s + o.total, 0);

  const stats = useMemo(() => {
    const kg = Math.round((940 + kgSelesai) * f);
    return {
      kg,
      co2: (kg / 1000) * 1.7, // ~1.7 t CO₂e per ton food loss avoided (est.)
      rp: Math.round((6_600_000 + rpSelesai) * f),
      transaksi: Math.round((34 + selesai.length) * f),
    };
  }, [f, kgSelesai, rpSelesai, selesai.length]);

  const mingguan = useMemo(
    () => MINGGUAN_SEED.map((m) => ({ ...m, kg: Math.round(m.kg * f) })),
    [f],
  );
  const perKomoditas = useMemo(
    () => PER_KOMODITAS_SEED.map((k) => ({ ...k, kg: Math.round(k.kg * f) })),
    [f],
  );
  const maxKomoditas = Math.max(...perKomoditas.map((k) => k.kg));

  const tiles = [
    { v: `${formatAngka(stats.kg)} kg`, k: "panen terselamatkan dari food loss" },
    { v: `${num(stats.co2)} ton`, k: "emisi CO₂e dicegah (estimasi)" },
    { v: formatRupiahRingkas(stats.rp), k: "tambahan pendapatan petani" },
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
          <h2 className="max-w-[160px] text-xl leading-7 font-extrabold text-ink">
            8 minggu terakhir
          </h2>

          <div className="relative">
            <button
              onClick={() => setOpenWilayah((o) => !o)}
              aria-expanded={openWilayah}
              aria-haspopup="listbox"
              className="tap flex shrink-0 items-center gap-1 rounded-full bg-brand-tint px-3 py-1.5 text-xs font-medium text-brand-deep"
            >
              {WILAYAH.find((w) => w.id === wilayah)?.label}
              <ChevronDown
                className={cx("size-3.5 transition-transform", openWilayah && "rotate-180")}
              />
            </button>

            {openWilayah && (
              <ul
                role="listbox"
                className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-white shadow-lg"
              >
                {WILAYAH.map((w) => (
                  <li key={w.id}>
                    <button
                      role="option"
                      aria-selected={w.id === wilayah}
                      onClick={() => {
                        setWilayah(w.id);
                        setOpenWilayah(false);
                      }}
                      className={cx(
                        "tap w-full px-3 py-2.5 text-left text-xs hover:bg-canvas",
                        w.id === wilayah
                          ? "font-bold text-brand-deep"
                          : "text-ink",
                      )}
                    >
                      {w.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4">
          {tiles.map(({ v, k }) => (
            <Card key={k} className="rise p-4">
              <p className="text-xl font-extrabold text-brand-deep">{v}</p>
              <p className="pt-1 text-[11px] leading-4 text-muted">{k}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-4 p-4">
          <div className="flex items-start justify-between">
            <SectionLabel>Kg terselamatkan / minggu</SectionLabel>
            <span className="rounded bg-canvas px-2 py-0.5 text-[11px] font-bold text-ink">
              {mingguan.at(-1)!.kg} kg
            </span>
          </div>
          <div className="pt-4">
            <TrenMingguan data={mingguan} />
          </div>
        </Card>

        <Card className="mt-4 p-4">
          <SectionLabel>Per komoditas (kg)</SectionLabel>
          <ul className="flex flex-col gap-3 pt-4">
            {perKomoditas.map(({ nama, kg }) => (
              <li key={nama} className="grid grid-cols-[64px_1fr_40px] items-center gap-2">
                <span className="text-xs font-bold text-ink">{nama}</span>
                <span className="h-4 overflow-hidden rounded-sm bg-canvas">
                  <span
                    className="block h-full origin-left rounded-sm bg-brand-deep"
                    style={{
                      width: `${(kg / maxKomoditas) * 100}%`,
                      animation: "pantas-grow 0.6s ease-out both",
                    }}
                  />
                </span>
                <span className="text-right text-xs text-muted">{kg}</span>
              </li>
            ))}
          </ul>
        </Card>
      </main>
    </>
  );
}
