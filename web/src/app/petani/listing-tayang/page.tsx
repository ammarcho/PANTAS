"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Check } from "lucide-react";
import { ButtonLink, Card, GradeBadge } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { useStore } from "@/lib/store";

function fmtTanggal(d: Date) {
  return `${d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} • ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".")}`;
}

export default function ListingTayangPage() {
  const store = useStore();
  const router = useRouter();
  const listing = store.myListings.find((l) => l.id === store.lastPublishedId);

  // Deep link without a fresh publish — nothing to confirm, go home.
  useEffect(() => {
    if (store.ready && !listing) router.replace("/petani");
  }, [store.ready, listing, router]);

  if (!listing) return null;

  const wa = `https://wa.me/?text=${encodeURIComponent(
    `Panen saya tayang di PANTAS: ${listing.nama} ${listing.berat_kg} kg, Grade ${listing.grade}, ${formatRupiah(listing.harga_per_kg)}/kg. ID ${listing.id}`,
  )}`;

  const detail = [
    { k: "ID Listing", v: listing.id },
    { k: "Tayang", v: fmtTanggal(new Date()) },
    { k: "Dinilai AI", v: "42 objek • komposisi terlampir" },
  ];

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
              <p className="text-base font-bold text-ink">{listing.nama}</p>
              <p className="pt-0.5 text-xs text-muted">
                {listing.berat_kg} kg • {formatRupiah(listing.harga_per_kg)}/kg
              </p>
            </div>
            <GradeBadge grade={listing.grade} />
          </div>

          <div className="mt-4 divide-y divide-line border-t border-line">
            {detail.map(({ k, v }) => (
              <div key={k} className="flex items-center justify-between gap-3 py-3">
                <span className="text-xs text-muted">{k}</span>
                <span className="text-right text-xs font-bold text-ink">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </main>

      <footer className="sticky bottom-0 flex flex-col gap-3 bg-canvas p-4">
        <ButtonLink href={wa} target="_blank" rel="noopener noreferrer" variant="outline">
          Bagikan ke WhatsApp
        </ButtonLink>
        <ButtonLink href="/petani/listing" variant="dark">
          Lihat Listing Saya
        </ButtonLink>
      </footer>
    </>
  );
}
