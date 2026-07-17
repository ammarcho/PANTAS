import { BottomNav } from "@/components/chrome";

export default function PembeliTabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomNav role="pembeli" />
    </>
  );
}
