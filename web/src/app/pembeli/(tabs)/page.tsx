import { BrandBar } from "@/components/chrome";
import { getListings } from "@/lib/data";
import Katalog from "./katalog";

export default async function KatalogPage() {
  const listings = await getListings();

  return (
    <>
      <BrandBar />
      <Katalog listings={listings} />
    </>
  );
}
