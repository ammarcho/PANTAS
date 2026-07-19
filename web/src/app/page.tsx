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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 6;

export default function LoginPage() {
  const router = useRouter();
  const store = useStore();
  const [role, setRole] = useState<Role>("petani");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const valid = EMAIL_RE.test(email.trim()) && password.length >= MIN_PASSWORD;

  async function submit() {
    if (!valid || sending) return;
    setSending(true);
    setError(null);
    // Tanpa verifikasi email: akun dibuat otomatis pada percobaan pertama,
    // sesi langsung terbentuk (trigger handle_new_user mengisi public.profiles).
    const { sesi, error: gagal } = await store.masuk(role, email, password);
    if (!sesi) {
      setError(gagal ?? "Gagal masuk. Coba lagi.");
      setSending(false);
      return;
    }
    router.replace(sesi.role === "petani" ? "/petani" : "/pembeli");
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
          <label htmlFor="email">Email</label>
        </SectionLabel>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          className={cx(
            "w-full rounded-lg border border-line bg-white px-4 py-[18px] text-base text-ink",
            "placeholder:text-placeholder",
            "focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none",
          )}
        />
      </section>

      <section className="flex flex-col gap-2 pt-4">
        <SectionLabel>
          <label htmlFor="password">Password</label>
        </SectionLabel>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder={`Minimal ${MIN_PASSWORD} karakter`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          className={cx(
            "w-full rounded-lg border border-line bg-white px-4 py-[18px] text-base text-ink",
            "placeholder:text-placeholder",
            "focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none",
          )}
        />
        <p className="text-xs leading-4 text-muted">
          Belum punya akun? Akun dibuat otomatis saat pertama kali masuk.
        </p>
      </section>

      {error && (
        <p
          role="alert"
          className="pt-4 text-xs leading-4 font-bold text-grade-reject"
        >
          {error}
        </p>
      )}

      <div className="pt-6">
        <Button onClick={() => void submit()} disabled={!valid || sending}>
          {sending ? "Memproses…" : "Masuk"}
        </Button>
      </div>
    </main>
  );
}
