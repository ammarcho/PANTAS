import { BottomNav } from "@/components/chrome";

/**
 * Only the tab destinations carry the bottom nav. The scan → grade → price →
 * listing flow is a focused task with its own footer actions, matching Figma.
 */
export default function PetaniTabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomNav role="petani" />
    </>
  );
}
