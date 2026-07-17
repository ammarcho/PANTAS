import { BrandBar } from "@/components/chrome";
import { getListings } from "@/lib/data";
import Katalog from "./katalog";

// Katalog membaca Supabase — segarkan tiap menit agar listing baru muncul
// tanpa rebuild.
export const revalidate = 60;

export default async function KatalogPage() {
  const listings = await getListings();

  return (
    <>
      <BrandBar />
      <Katalog listings={listings} />
    </>
  );
}
