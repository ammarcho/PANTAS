"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

/**
 * Client-side session gate. Real protection arrives with Supabase RLS —
 * this only keeps the demo honest (no petani screens without logging in).
 */
export default function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const store = useStore();
  const router = useRouter();
  const ok = store.sesi?.role === role;

  useEffect(() => {
    if (store.ready && !ok) router.replace("/");
  }, [store.ready, ok, router]);

  // Until localStorage has hydrated we don't know the answer; render nothing
  // rather than flash a screen the user may not be allowed to see.
  if (!store.ready || !ok) return null;
  return <>{children}</>;
}
