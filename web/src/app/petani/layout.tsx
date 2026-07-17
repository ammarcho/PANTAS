import RequireRole from "@/components/require-role";

export default function PetaniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireRole role="petani">{children}</RequireRole>;
}
