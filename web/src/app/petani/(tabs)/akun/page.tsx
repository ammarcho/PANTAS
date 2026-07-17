import { BrandBar } from "@/components/chrome";
import AkunView from "@/components/akun-view";

export default function AkunPetaniPage() {
  return (
    <>
      <BrandBar />
      <AkunView
        nama="Pak Warsono"
        peran="Petani • Lembang, Bandung Barat"
        inisial="W"
        baris={[
          { k: "Nomor HP", v: "0812-3456-7890" },
          { k: "Listing aktif", v: "12" },
          { k: "Rating", v: "4,8 (96 transaksi)" },
        ]}
      />
    </>
  );
}
