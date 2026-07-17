import { Check } from "lucide-react";
import { ButtonLink, Card, GradeBadge } from "@/components/ui";

const DETAIL = [
  { k: "ID Listing", v: "PNT-L-0219" },
  { k: "Tayang", v: "15 Jul 2026 • 09.43" },
  { k: "Dinilai AI", v: "42 objek • komposisi terlampir" },
];

export default function ListingTayangPage() {
  return (
    <>
      <main className="flex-1 px-4 pt-12 pb-4">
        <div className="rise flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-full border-2 border-brand">
            <Check className="size-8 text-brand" strokeWidth={2.5} />
          </span>
          <h1 className="pt-5 text-2xl font-extrabold text-ink">Listing Tayang</h1>
          <p className="max-w-[280px] pt-2 text-sm leading-5 text-muted">
            Pembeli industri di sekitar Lembang kini bisa menemukan panen Anda.
          </p>
        </div>

        <Card className="mt-8 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-bold text-ink">Tomat Sayur</p>
              <p className="pt-0.5 text-xs text-muted">120 kg • Rp 10.000/kg</p>
            </div>
            <GradeBadge grade="B" />
          </div>

          <div className="mt-4 divide-y divide-line border-t border-line">
            {DETAIL.map(({ k, v }) => (
              <div key={k} className="flex items-center justify-between gap-3 py-3">
                <span className="text-xs text-muted">{k}</span>
                <span className="text-right text-xs font-bold text-ink">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </main>

      <footer className="sticky bottom-0 flex flex-col gap-3 bg-canvas p-4">
        <ButtonLink
          href="https://wa.me/?text=Panen%20saya%20sudah%20tayang%20di%20PANTAS"
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
        >
          Bagikan ke WhatsApp
        </ButtonLink>
        <ButtonLink href="/petani" variant="dark">
          Lihat Listing Saya
        </ButtonLink>
      </footer>
    </>
  );
}
