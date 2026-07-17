"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Camera, ImageIcon, Ruler } from "lucide-react";
import { BrandBar } from "@/components/chrome";
import { cx } from "@/components/ui";
import { useStore } from "@/lib/store";

type Mode = "loading" | "camera" | "demo";

/** Downscale to keep data URLs inside the localStorage budget. */
function frameToDataUrl(source: HTMLVideoElement | HTMLImageElement): string {
  const w = "videoWidth" in source ? source.videoWidth : source.naturalWidth;
  const h = "videoHeight" in source ? source.videoHeight : source.naturalHeight;
  const scale = Math.min(1, 900 / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function PindaiPage() {
  const router = useRouter();
  const store = useStore();
  const [mode, setMode] = useState<Mode>("loading");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setMode("camera");
      } catch {
        // No camera / permission denied — demo mode with a sample photo.
        if (!cancelled) setMode("demo");
      }
    }

    boot();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function finish(dataUrl: string | null) {
    store.setLastCapture(dataUrl);
    setScanning(true);
    setTimeout(() => router.push("/petani/hasil"), 1400);
  }

  function capture() {
    if (scanning) return;
    if (mode === "camera" && videoRef.current) {
      finish(frameToDataUrl(videoRef.current));
    } else {
      finish(null); // demo mode: hasil falls back to the sample photo
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      finish(frameToDataUrl(img));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  return (
    <>
      <BrandBar />

      <main className="relative flex-1 overflow-hidden bg-black">
        {/* Live camera when available, sample photo otherwise */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={cx(
            "absolute inset-0 size-full object-cover",
            mode !== "camera" && "hidden",
          )}
        />
        {mode !== "camera" && (
          <Image
            src="/img/tomat-rumahkaca.jpg"
            alt="Pratinjau kamera (mode demo)"
            fill
            sizes="430px"
            className="object-cover"
            priority
          />
        )}

        {mode === "demo" && (
          <span className="absolute top-4 left-4 rounded bg-black/60 px-2 py-1 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
            Mode demo — kamera tidak tersedia
          </span>
        )}

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
          disabled={scanning || mode === "loading"}
          className="tap tap-press flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-dark py-4 text-base font-bold text-white disabled:opacity-60"
        >
          <Camera className="size-5" />
          {scanning ? "Memindai…" : "Ambil Foto"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPickFile}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          aria-label="Pilih dari galeri"
          className="tap tap-press rounded-lg border border-line p-4 text-muted hover:bg-canvas disabled:opacity-60"
        >
          <ImageIcon className="size-5" />
        </button>
      </footer>
    </>
  );
}
