import { Bell, ChevronDown, Menu } from "lucide-react";
import { Card, SectionLabel } from "@/components/ui";
import { getDampak } from "@/lib/data";
import { formatAngka, formatRupiahRingkas, num } from "@/lib/format";

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
      aria-label={`Tren kg terselamatkan per minggu, naik dari ${data[0].kg} kg ke ${data.at(-1)!.kg} kg`}
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

export default async function DampakPage() {
  const d = await getDampak();
  const maxKomoditas = Math.max(...d.per_komoditas.map((k) => k.kg));

  const tiles = [
    { v: `${formatAngka(d.kg_terselamatkan)} kg`, k: "panen terselamatkan dari food loss" },
    { v: `${num(d.co2e_ton)} ton`, k: "emisi CO₂e dicegah (estimasi)" },
    { v: formatRupiahRingkas(d.pendapatan_tambahan), k: "tambahan pendapatan petani" },
    { v: String(d.transaksi_selesai), k: "transaksi selesai" },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 grid h-14 grid-cols-[auto_1fr_auto] items-center border-b border-line bg-white/90 px-4 backdrop-blur-sm">
        <button aria-label="Menu" className="tap -ml-1 rounded p-1 text-ink hover:bg-canvas">
          <Menu className="size-5" />
        </button>
        <h1 className="text-center text-xs font-bold tracking-[1.2px] text-muted uppercase">
          Dampak PANTAS
        </h1>
        <button aria-label="Notifikasi" className="tap -mr-1 rounded p-1 text-ink hover:bg-canvas">
          <Bell className="size-5" />
        </button>
      </header>

      <main className="flex-1 px-4 pt-4 pb-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="max-w-[160px] text-xl leading-7 font-extrabold text-ink">
            8 minggu terakhir
          </h2>
          <button className="tap flex shrink-0 items-center gap-1 rounded-full bg-brand-tint px-3 py-1.5 text-xs font-medium text-brand-deep">
            Semua wilayah
            <ChevronDown className="size-3.5" />
          </button>
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
              {d.mingguan.at(-1)!.kg} kg
            </span>
          </div>
          <div className="pt-4">
            <TrenMingguan data={d.mingguan} />
          </div>
        </Card>

        <Card className="mt-4 p-4">
          <SectionLabel>Per komoditas (kg)</SectionLabel>
          <ul className="flex flex-col gap-3 pt-4">
            {d.per_komoditas.map(({ nama, kg }) => (
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
