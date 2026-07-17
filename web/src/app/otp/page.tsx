"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/chrome";
import { Button, SectionLabel, cx } from "@/components/ui";
import { useStore } from "@/lib/store";

const LEN = 6;

export default function OtpPage() {
  const router = useRouter();
  const store = useStore();
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const [error, setError] = useState(false);
  const [timer, setTimer] = useState(30);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Single source of truth for where this screen sends you: a session routes
  // to its role home (also covers post-verify), no pending login routes back.
  useEffect(() => {
    if (!store.ready) return;
    if (store.pendingPhone) return; // mid-login: stay here until verified
    if (store.sesi) {
      router.replace(store.sesi.role === "petani" ? "/petani" : "/pembeli");
    } else {
      router.replace("/");
    }
  }, [store.ready, store.sesi, store.pendingPhone, router]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const code = digits.join("");

  function setAt(i: number, v: string) {
    setError(false);
    const clean = v.replace(/\D/g, "");
    setDigits((d) => {
      const next = [...d];
      // Support paste of the full code into any box.
      if (clean.length > 1) {
        for (let j = 0; j < LEN - i; j++) next[i + j] = clean[j] ?? next[i + j];
      } else {
        next[i] = clean;
      }
      return next;
    });
    if (clean) refs.current[Math.min(i + clean.length, LEN - 1)]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function verify() {
    if (code.length < LEN) {
      setError(true);
      return;
    }
    // Demo mode: any 6-digit code passes. Supabase's verifyOtp replaces this.
    // The effect above routes to the role home once the session lands.
    store.selesaiLogin();
  }

  return (
    <main className="flex flex-1 flex-col bg-white px-8 pt-6 pb-8">
      <Link
        href="/"
        aria-label="Kembali"
        className="tap -ml-2 self-start rounded p-2 text-brand hover:bg-brand-tint"
      >
        <ArrowLeft className="size-5" />
      </Link>

      <div className="rise flex flex-col items-center pt-6 text-center">
        <Logo className="size-16" />
        <h1 className="pt-4 text-xl font-extrabold text-ink">Masukkan Kode OTP</h1>
        <p className="max-w-[260px] pt-2 text-sm leading-5 text-muted">
          Kode 6 digit dikirim via SMS ke{" "}
          <span className="font-bold text-ink">{store.pendingPhone ?? "—"}</span>
        </p>
      </div>

      <div className="flex justify-center gap-2 pt-8" role="group" aria-label="Kode OTP">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            onChange={(e) => setAt(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1}`}
            className={cx(
              "size-12 rounded-lg border bg-white text-center text-xl font-bold text-ink",
              "focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none",
              error ? "border-grade-reject" : "border-line",
            )}
          />
        ))}
      </div>

      {error && (
        <p className="pt-3 text-center text-xs font-bold text-grade-reject">
          Kode belum lengkap — isi 6 digit.
        </p>
      )}

      <p className="pt-6 text-center text-xs text-muted">
        {timer > 0 ? (
          <>
            Kirim ulang dalam <span className="font-bold text-ink">{timer}s</span>
          </>
        ) : (
          <button
            onClick={() => setTimer(30)}
            className="tap font-bold text-brand hover:underline"
          >
            Kirim ulang kode
          </button>
        )}
      </p>

      <div className="pt-8">
        <Button onClick={verify} disabled={code.length < LEN}>
          Verifikasi & Masuk
        </Button>
      </div>

      <SectionLabel className="pt-6 text-center text-[10px]">
        Mode demo — semua kode 6 digit diterima
      </SectionLabel>
    </main>
  );
}
