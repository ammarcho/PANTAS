"use client";

import { BrandBar } from "@/components/chrome";
import AkunView from "@/components/akun-view";
import { num } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function AkunPetaniPage() {
  const store = useStore();
  const selesai = store.orders.filter((o) => o.status === "selesai").length;

  return (
    <>
      <BrandBar />
      <AkunView
        peranLabel="Petani • Lembang, Bandung Barat"
        baris={[
          { k: "Listing aktif", v: String(store.myListings.length) },
          { k: "Pindaian tersimpan", v: String(store.scans.length) },
          { k: "Rating", v: `${num(4.8)} (${selesai + 93} transaksi)` },
        ]}
      />
    </>
  );
}
