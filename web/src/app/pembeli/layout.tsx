import RequireRole from "@/components/require-role";

export default function PembeliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireRole role="pembeli">{children}</RequireRole>;
}
