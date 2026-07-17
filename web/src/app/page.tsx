"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Factory, Sprout } from "lucide-react";
import { Logo } from "@/components/chrome";
import { Button, SectionLabel, cx } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

const ROLES = [
  {
    id: "petani" as const,
    icon: Sprout,
    title: "Petani",
    desc: "Jual hasil panen, dapat harga wajar",
  },
  {
    id: "pembeli" as const,
    icon: Factory,
    title: "Pembeli Industri",
    desc: "Cari bahan baku layak olah",
  },
];

/** 081234567890 -> 0812-3456-7890 */
function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 13);
  return d.replace(/(\d{4})(\d{1,4})?(\d{1,5})?/, (_, a, b, c) =>
    [a, b, c].filter(Boolean).join("-"),
  );
}

export default function LoginPage() {
  const router = useRouter();
  const store = useStore();
  const [role, setRole] = useState<Role>("petani");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  const digits = phone.replace(/\D/g, "");
  const valid = digits.length >= 10 && digits.startsWith("0");

  function submit() {
    if (!valid) return;
    setSending(true);
    // Real SMS delivery is Supabase Auth (docs/BACKEND.md fase 1); the OTP
    // screen runs in demo mode until then.
    store.mulaiLogin(role, phone);
    router.push("/otp");
  }

  return (
    <main className="flex flex-1 flex-col bg-white px-8 pt-12 pb-8">
      <section className="rise flex flex-col items-center pb-12">
        <Logo className="size-24" />
        <h1 className="pt-2 text-[30px] leading-9 font-extrabold tracking-[-1.5px] text-ink">
          PANTAS
        </h1>
        <p className="pt-1 text-sm font-medium text-muted">
          Setiap Panen Pantas Dihargai
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionLabel>Masuk sebagai</SectionLabel>

        <div
          role="radiogroup"
          aria-label="Masuk sebagai"
          className="flex flex-col gap-4"
        >
          {ROLES.map(({ id, icon: Icon, title, desc }) => {
            const selected = role === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setRole(id)}
                className={cx(
                  "tap tap-press flex items-start gap-4 rounded-lg bg-white text-left",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  selected
                    ? "border-2 border-brand p-4"
                    : "border border-line p-[17px] hover:border-placeholder",
                )}
              >
                <Icon
                  className={cx(
                    "mt-1 size-6 shrink-0",
                    selected ? "text-brand" : "text-muted",
                  )}
                  strokeWidth={2}
                />
                <span className="flex-1">
                  <span className="block text-base leading-6 font-bold text-ink">
                    {title}
                  </span>
                  <span className="block text-xs leading-4 text-muted">{desc}</span>
                </span>
                {selected && <Check className="mt-1 size-4 shrink-0 text-brand" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2 pt-8">
        <SectionLabel>
          <label htmlFor="phone">Nomor HP</label>
        </SectionLabel>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="08xx-xxxx-xxxx"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className={cx(
            "w-full rounded-lg border border-line bg-white px-4 py-[18px] text-base text-ink",
            "placeholder:text-placeholder",
            "focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none",
          )}
        />
      </section>

      <div className="pt-6">
        <Button onClick={submit} disabled={!valid || sending}>
          {sending ? "Mengirim…" : "Kirim Kode OTP"}
        </Button>
      </div>
    </main>
  );
}
