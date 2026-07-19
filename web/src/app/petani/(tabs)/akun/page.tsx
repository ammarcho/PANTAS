"use client";

import { BrandBar } from "@/components/chrome";
import AkunView from "@/components/akun-view";
import { useStore } from "@/lib/store";

export default function AkunPetaniPage() {
  const store = useStore();
  const selesai = store.orders.filter((o) => o.status === "selesai").length;
  const aktif = store.orders.filter((o) => o.status !== "selesai").length;

  // Label peran: gunakan lokasi dari profil jika tersedia, jika tidak cukup "Petani"
  const peranLabel = store.sesi?.lokasi
    ? `Petani • ${store.sesi.lokasi}`
    : "Petani";

  return (
    <>
      <BrandBar />
      <AkunView
        peranLabel={peranLabel}
        baris={[
          { k: "Listing aktif", v: String(store.myListings.length) },
          { k: "Pindaian tersimpan", v: String(store.scans.length) },
          { k: "Pesanan selesai", v: String(selesai) },
          { k: "Pesanan aktif", v: String(aktif) },
        ]}
      />
    </>
  );
}
