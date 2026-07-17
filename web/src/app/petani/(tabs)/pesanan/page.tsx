import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BrandBar } from "@/components/chrome";
import { Card, GradeBadge, SectionLabel } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import type { Grade } from "@/lib/types";

const MASUK: {
  id: string;
  pembeli: string;
  nama: string;
  grade: Grade;
  berat_kg: number;
  total: number;
  status: string;
}[] = [
  {
    id: "PNT-0092",
    pembeli: "PT Olahan Segar",
    nama: "Tomat Sayur",
    grade: "B",
    berat_kg: 120,
    total: 1_200_000,
    status: "Menunggu serah terima",
  },
  {
    id: "PNT-0091",
    pembeli: "CV Saus Nusantara",
    nama: "Cabai Rawit Merah",
    grade: "A",
    berat_kg: 40,
    total: 1_800_000,
    status: "Dikonfirmasi",
  },
  {
    id: "PNT-0090",
    pembeli: "Dapur Katering Bandung",
    nama: "Kubis Hijau",
    grade: "B",
    berat_kg: 300,
    total: 1_800_000,
    status: "Selesai",
  },
];

export default function PesananPetaniPage() {
  return (
    <>
      <BrandBar />
      <main className="flex-1 px-4 pt-4 pb-6">
        <h1 className="text-xl font-extrabold text-ink">Pesanan Masuk</h1>
        <SectionLabel className="pt-1">{MASUK.length} pesanan</SectionLabel>

        <ul className="flex flex-col gap-3 pt-4">
          {MASUK.map((o) => (
            <li key={o.id}>
              <Card className="tap tap-press p-4 hover:border-placeholder">
                <Link href="/pembeli/pesanan" className="block">
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
                      <p className="pt-0.5 text-[11px] font-bold text-brand">
                        {o.status}
                      </p>
                    </div>
                    <p className="flex items-center gap-1 text-base font-extrabold text-ink">
                      {formatRupiah(o.total)}
                      <ChevronRight className="size-4 text-label" />
                    </p>
                  </div>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
