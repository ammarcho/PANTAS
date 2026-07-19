"use client";

import { BrandBar } from "@/components/chrome";
import AkunView from "@/components/akun-view";
import { useStore } from "@/lib/store";

export default function AkunPembeliPage() {
  const store = useStore();

  const selesai = store.orders.filter((o) => o.status === "selesai").length;
  const peranLabel = store.sesi?.lokasi
    ? `Pembeli Industri \u2022 ${store.sesi.lokasi}`
    : "Pembeli Industri";

  return (
    <>
      <BrandBar />
      <AkunView
        peranLabel={peranLabel}
        baris={[
          { k: "Pesanan", v: String(store.orders.length) },
          { k: "Pesanan selesai", v: String(selesai) },
          { k: "Inquiry aktif", v: String(Object.keys(store.inquiry).length) },
        ]}
      />
    </>
  );
}
