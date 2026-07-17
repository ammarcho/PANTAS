"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Home, Map, ShoppingCart, TrendingUp, User } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "./ui";

/** The PANTAS sprout mark, exported from the Figma source file at 4x. */
export function Logo({ className = "size-6" }: { className?: string }) {
  return (
    <Image
      src="/img/logo.png"
      alt=""
      width={96}
      height={96}
      priority
      className={className}
    />
  );
}

export function BrandBar({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur-sm">
      <span className="flex items-center gap-2 text-brand">
        <Logo />
        <span className="text-lg font-extrabold tracking-tight">PANTAS</span>
      </span>
      {right}
    </header>
  );
}

export function BackBar({
  title,
  href,
  right,
}: {
  title: string;
  href: string;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 grid h-14 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-line bg-white/90 px-4 backdrop-blur-sm">
      <Link
        href={href}
        aria-label="Kembali"
        className="tap -ml-1 rounded p-1 text-brand hover:bg-brand-tint"
      >
        <ArrowLeft className="size-5" />
      </Link>
      <h1 className="truncate text-center text-xs font-bold tracking-[1.2px] text-muted uppercase">
        {title}
      </h1>
      <span className="min-w-5">{right}</span>
    </header>
  );
}

/* ---------------------------------------------------------- Bottom nav */

const NAV_PETANI = [
  { href: "/petani", label: "Beranda", icon: Home },
  { href: "/petani/pesanan", label: "Pesanan", icon: ShoppingCart },
  { href: "/petani/dampak", label: "Dampak", icon: TrendingUp },
  { href: "/petani/akun", label: "Akun", icon: User },
];

const NAV_PEMBELI = [
  { href: "/pembeli", label: "Home", icon: Home },
  { href: "/pembeli/pesanan", label: "Orders", icon: ShoppingCart },
  { href: "/pembeli/peta", label: "Map", icon: Map },
  { href: "/pembeli/akun", label: "Account", icon: User },
];

export function BottomNav({ role }: { role: "petani" | "pembeli" }) {
  const pathname = usePathname();
  const items = role === "petani" ? NAV_PETANI : NAV_PEMBELI;

  return (
    <nav className="sticky bottom-0 z-20 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex h-[72px] max-w-[430px] items-stretch">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "tap flex h-full flex-col items-center justify-center gap-1",
                  active ? "text-brand" : "text-muted",
                )}
              >
                <span
                  className={cx(
                    "tap flex h-7 w-12 items-center justify-center rounded-full",
                    active && "bg-brand-tint",
                  )}
                >
                  <Icon className="size-[18px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span
                  className={cx("text-[11px]", active ? "font-bold" : "font-medium")}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
