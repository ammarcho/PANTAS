import { getListings } from "@/lib/data";
import PetaClient from "./peta-client";

export const revalidate = 60;

export default async function PetaPage() {
  const listings = await getListings();
  return <PetaClient listings={listings} />;
}
