"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera, ImageIcon, Ruler } from "lucide-react";
import { BrandBar } from "@/components/chrome";
import { cx } from "@/components/ui";

export default function PindaiPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);

  function capture() {
    setScanning(true);
    // Real capture posts the frame to the FastAPI /predict endpoint that wraps
    // PantasModel; the result screen reads the same shape either way.
    setTimeout(() => router.push("/petani/hasil"), 1600);
  }

  return (
    <>
      <BrandBar />

      <main className="relative flex-1 overflow-hidden bg-black">
        {/* Stand-in for the live camera feed */}
        <Image
          src="/img/tomat-rumahkaca.jpg"
          alt="Pratinjau kamera"
          fill
          sizes="430px"
          className="object-cover"
          priority
        />

        {/* Jarak indicator */}
        <div className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-medium whitespace-nowrap text-white backdrop-blur-sm">
          <Ruler className="size-4 shrink-0" />
          Jarak: 30 cm
          <span className="flex items-center gap-1 font-bold text-[#74c69d]">
            <span className="size-1.5 rounded-full bg-[#74c69d]" />
            OPTIMAL
          </span>
        </div>

        {/* Reticle */}
        <div className="absolute top-1/2 left-1/2 size-60 -translate-x-1/2 -translate-y-1/2">
          <div className="relative size-full rounded-lg bg-white/5">
            {(
              [
                "top-0 left-0 border-t-4 border-l-4 rounded-tl-lg",
                "top-0 right-0 border-t-4 border-r-4 rounded-tr-lg",
                "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg",
                "bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg",
              ] as const
            ).map((pos) => (
              <span
                key={pos}
                className={cx("absolute size-8 border-[#74c69d]", pos)}
              />
            ))}

            {scanning && (
              <span
                className="absolute inset-x-0 top-0 h-14 bg-linear-to-b from-transparent via-[#74c69d]/40 to-transparent"
                style={{ animation: "pantas-sweep 1.1s ease-in-out infinite" }}
              />
            )}

            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-grade-a px-2 py-1 text-[10px] font-bold text-white">
              GRADE A
            </span>
          </div>
        </div>

        <span className="absolute top-[58%] right-8 rounded bg-grade-b px-2 py-1 text-[10px] font-bold text-white">
          GRADE B
        </span>

        {/* Status toast */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/70 px-4 py-2 text-sm font-medium whitespace-nowrap text-white backdrop-blur-sm">
          {scanning ? "Menghitung Estimasi Grade…" : "Arahkan ke tumpukan panen"}
        </div>

        {/* Coin ROI — calibration.py looks for a Rp500 coin to derive px/mm² */}
        <div className="absolute bottom-6 left-6 flex size-20 flex-col items-center justify-center rounded-full border-2 border-dashed border-white/70 bg-black/40 text-center text-[9px] leading-tight font-bold text-white backdrop-blur-sm">
          KOIN
          <br />
          Rp500
          <br />
          DI SINI
        </div>
      </main>

      <footer className="flex items-center gap-3 border-t border-line bg-white p-4">
        <button
          onClick={capture}
          disabled={scanning}
          className="tap tap-press flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-dark py-4 text-base font-bold text-white disabled:opacity-60"
        >
          <Camera className="size-5" />
          {scanning ? "Memindai…" : "Ambil Foto"}
        </button>
        <button
          aria-label="Pilih dari galeri"
          className="tap tap-press rounded-lg border border-line p-4 text-muted hover:bg-canvas"
        >
          <ImageIcon className="size-5" />
        </button>
      </footer>
    </>
  );
}
