import { BrandBar } from "@/components/chrome";
import AkunView from "@/components/akun-view";

export default function AkunPembeliPage() {
  return (
    <>
      <BrandBar />
      <AkunView
        nama="PT Olahan Segar"
        peran="Pembeli Industri"
        inisial="OS"
        baris={[
          { k: "Nomor HP", v: "0812-3456-7890" },
          { k: "Wilayah", v: "Bandung Raya" },
          { k: "Inquiry aktif", v: "3" },
        ]}
      />
    </>
  );
}
