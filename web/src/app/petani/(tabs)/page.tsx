"use client";

/* eslint-disable @next/next/no-img-element -- scans/listings can be data URLs */

import Link from "next/link";
import { Bell, ScanLine } from "lucide-react";
import { BrandBar } from "@/components/chrome";
import { Card, GradeBadge, GradeDot, SectionLabel } from "@/components/ui";
import { GRADE_LABEL, formatRupiah, persen } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Grade, Listing } from "@/lib/types";

const GRADE_ORDER: Grade[] = ["A", "B", "C", "REJECT"];

function groupByGrade(listings: Listing[]) {
  return GRADE_ORDER.map((grade) => ({
    grade,
    items: listings.filter((l) => l.grade === grade),
  })).filter((g) => g.items.length > 0);
}

export default function DashboardPetani() {
  const store = useStore();
  const groups = groupByGrade(store.myListings);
  const lastScan = store.scans[0];
  const pesananMasuk = store.orders.filter((o) => o.status !== "selesai").length;

  return (
    <>
      <BrandBar
        right={
          <Link
            href="/petani/pesanan"
            aria-label={`Notifikasi — ${pesananMasuk} pesanan aktif`}
            className="tap relative rounded p-1 text-muted hover:bg-canvas"
          >
            <Bell className="size-5" />
            {pesananMasuk > 0 && (
              <span className="absolute top-1 right-1 size-2 rounded-full bg-grade-b ring-2 ring-white" />
            )}
          </Link>
        }
      />

      <main className="flex-1 px-4 pt-4 pb-28">
        {/* Hasil deteksi terakhir */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Hasil Deteksi Terakhir</h2>
          <Link
            href="/petani/riwayat"
            className="text-xs font-bold text-brand hover:underline"
          >
            Lihat Riwayat
          </Link>
        </div>

        {lastScan ? (
          <Card className="rise mt-3 overflow-hidden p-3">
            <div className="relative aspect-16/10 overflow-hidden rounded-lg">
              <img
                src={lastScan.gambar}
                alt={`${lastScan.komoditas_label} hasil pindai terakhir`}
                className="absolute inset-0 size-full object-cover"
              />
              <span className="absolute top-2 left-2">
                <GradeBadge grade={lastScan.grade_dominan} />
              </span>
            </div>

            <div className="flex items-end justify-between pt-3">
              <div>
                <p className="text-base font-bold text-ink">
                  {lastScan.komoditas_label}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl leading-7 font-extrabold text-brand">
                  {persen(0.98)}
                </p>
                <SectionLabel className="text-[10px]">Quality Score</SectionLabel>
              </div>
            </div>
            <p className="pt-1 text-xs leading-4 text-muted">
              {lastScan.objek} objek terdeteksi • grade dominan{" "}
              {lastScan.grade_dominan}
            </p>
          </Card>
        ) : (
          <Card className="mt-3 flex flex-col items-center p-8 text-center">
            <ScanLine className="size-8 text-label" />
            <p className="pt-3 text-sm font-bold text-ink">Belum ada pindaian</p>
            <p className="pt-1 text-xs text-muted">
              Mulai pindai untuk melihat mutu panen Anda.
            </p>
          </Card>
        )}

        {/* Ringkasan */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <Link href="/petani/listing" className="tap tap-press block">
            <Card className="flex flex-col items-center py-4 hover:border-placeholder">
              <p className="text-2xl font-extrabold text-brand">
                {store.myListings.length}
              </p>
              <SectionLabel className="pt-1 text-[10px]">Listing Aktif</SectionLabel>
            </Card>
          </Link>
          <Link href="/petani/pesanan" className="tap tap-press block">
            <Card className="flex flex-col items-center py-4 hover:border-placeholder">
              <p className="text-2xl font-extrabold text-brand">{pesananMasuk}</p>
              <SectionLabel className="pt-1 text-[10px]">Pesanan Masuk</SectionLabel>
            </Card>
          </Link>
        </div>

        {/* Listing produk saya */}
        <div className="flex items-center justify-between pt-6">
          <h2 className="text-base font-bold text-ink">Listing Produk Saya</h2>
          <Link
            href="/petani/listing"
            className="text-xs font-bold text-brand hover:underline"
          >
            Lihat Semua
          </Link>
        </div>

        {groups.map(({ grade, items }) => (
          <section key={grade} className="pt-4">
            <h3 className="flex items-center gap-2 text-xs font-bold text-ink">
              <GradeDot grade={grade} />
              {GRADE_LABEL[grade]}
            </h3>

            <ul className="grid grid-cols-2 gap-3 pt-2">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/petani/listing"
                    className="tap tap-press block h-full overflow-hidden rounded-card border border-line bg-white hover:border-placeholder"
                  >
                    <div className="relative aspect-4/3">
                      <img
                        src={item.gambar}
                        alt={item.nama}
                        className="absolute inset-0 size-full object-cover"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-xs font-bold text-ink">
                        {item.nama}
                      </p>
                      <p className="pt-0.5 text-[10px] text-muted">
                        {item.berat_kg} kg
                      </p>
                      <p className="pt-1 text-sm font-bold text-brand">
                        {formatRupiah(item.harga_per_kg)}
                        <span className="text-[10px] font-medium text-muted">/kg</span>
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      {/* FAB — anchored to the frame, not the viewport */}
      <div className="pointer-events-none sticky bottom-0 z-10 mx-auto flex w-full max-w-[430px] justify-end px-4 pb-4">
        <Link
          href="/petani/pindai"
          className="tap tap-press pointer-events-auto flex items-center gap-2 rounded-full bg-brand-dark py-4 pr-6 pl-5 text-sm font-bold text-white shadow-lg shadow-brand-dark/25 hover:bg-brand-deep"
        >
          <ScanLine className="size-5" />
          Mulai Pindai Baru
        </Link>
      </div>
    </>
  );
}
