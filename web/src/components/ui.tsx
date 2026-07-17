import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Grade } from "@/lib/types";
import { GRADE_COLOR } from "@/lib/format";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ---------------------------------------------------------------- Card */

export function Card({
  className,
  children,
  ...rest
}: ComponentProps<"div">) {
  return (
    <div
      className={cx(
        "rounded-card border border-line bg-white",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------- Button */

type ButtonVariant = "primary" | "dark" | "outline" | "ghost";

const BUTTON_STYLE: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-deep",
  dark: "bg-brand-dark text-white hover:bg-brand-deep",
  outline: "border border-brand bg-white text-brand hover:bg-brand-tint",
  ghost: "bg-white text-ink border border-line hover:bg-canvas",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cx(
        "tap tap-press flex w-full items-center justify-center gap-2 rounded-lg py-4 text-base font-bold",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        "disabled:pointer-events-none disabled:opacity-50",
        BUTTON_STYLE[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  className,
  children,
  ...rest
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link
      className={cx(
        "tap tap-press flex w-full items-center justify-center gap-2 rounded-lg py-4 text-base font-bold",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        BUTTON_STYLE[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}

/* --------------------------------------------------------- GradeBadge */

export function GradeBadge({
  grade,
  size = "md",
}: {
  grade: Grade;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center rounded font-bold tracking-wide text-white uppercase",
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]",
      )}
      style={{ backgroundColor: GRADE_COLOR[grade] }}
    >
      {grade === "REJECT" ? "Reject" : `Grade ${grade}`}
    </span>
  );
}

/** The small colored dot used in list group headers. */
export function GradeDot({ grade }: { grade: Grade }) {
  return (
    <span
      className="inline-block size-2 shrink-0 rounded-full"
      style={{ backgroundColor: GRADE_COLOR[grade] }}
    />
  );
}

/* -------------------------------------------------------------- Labels */

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cx(
        "text-xs font-bold tracking-[1.2px] text-label uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}
