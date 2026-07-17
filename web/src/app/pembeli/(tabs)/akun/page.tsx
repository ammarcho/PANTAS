"use client";

import { BrandBar } from "@/components/chrome";
import AkunView from "@/components/akun-view";
import { useStore } from "@/lib/store";

export default function AkunPembeliPage() {
  const store = useStore();

  return (
    <>
      <BrandBar />
      <AkunView
        peranLabel="Pembeli Industri • Bandung Raya"
        baris={[
          { k: "Pesanan", v: String(store.orders.length) },
          { k: "Inquiry aktif", v: String(Object.keys(store.inquiry).length) },
        ]}
      />
    </>
  );
}
