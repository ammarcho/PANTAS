import { supabase } from "./supabase";
import type {
  Grade,
  GradingResult,
  Listing,
  RekomendasiHarga,
} from "./types";
import type { Database } from "./database.types";

/**
 * Single seam between the UI and the backend.
 *
 * Every function tries Supabase / the FastAPI grading service first and falls
 * back to the demo data below when the backend is not configured or a call
 * fails — the app stays fully usable offline (docs/BACKEND.md).
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ----------------------------------------------------------------------- */
/* Listings                                                                  */
/* ----------------------------------------------------------------------- */

type ListingRow = Database["public"]["Views"]["listings_view"]["Row"];

/** Posisi pengguna saat ini — diperbarui via setUserPosition() dari browser. */
let userPosition = { lat: -6.9147, lng: 107.6098 }; // default: Bandung kota

/** Dipanggil sekali setelah geolocation berhasil (dari komponen peta/katalog). */
export function setUserPosition(lat: number, lng: number) {
  userPosition = { lat, lng };
}

function haversineKm(lat: number, lng: number): number {
  const R = 6371;
  const dLat = ((lat - userPosition.lat) * Math.PI) / 180;
  const dLng = ((lng - userPosition.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userPosition.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)) * 10) / 10;
}

export function rowToListing(r: ListingRow): Listing {
  return {
    id: r.id ?? "",
    nama: r.nama ?? "",
    komoditas: r.komoditas ?? "",
    grade: (r.grade ?? "B") as Grade,
    berat_kg: Number(r.berat_kg ?? 0),
    harga_per_kg: r.harga_per_kg ?? 0,
    gambar: r.gambar ?? "/img/tomat.jpg",
    petani: r.petani ?? "Petani PANTAS",
    petani_id: r.petani_id ?? undefined,
    lokasi: r.lokasi ?? "—",
    jarak_km: r.lat != null && r.lng != null ? haversineKm(r.lat, r.lng) : 0,
    rating: Number(r.rating ?? 5),
    transaksi: r.transaksi ?? 0,
    lat: r.lat ?? userPosition.lat,
    lng: r.lng ?? userPosition.lng,
    satuan: r.satuan ?? undefined,
    stok_kg: r.stok_kg != null ? Number(r.stok_kg) : undefined,
    panen_terakhir: r.panen_terakhir ?? undefined,
    komposisi: (r.komposisi as Listing["komposisi"]) ?? undefined,
    catatan_ai: r.catatan_ai ?? undefined,
    alamat: r.alamat ?? undefined,
  };
}

export async function getListings(): Promise<Listing[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("listings_view")
      .select("*")
      .eq("status", "tayang")
      .order("id");
    if (!error && data && data.length > 0) return data.map(rowToListing);
    if (error) console.warn("[pantas] getListings fallback demo:", error.message);
  }
  await delay(200);
  return LISTINGS;
}

export async function getListing(id: string): Promise<Listing | undefined> {
  if (supabase) {
    const { data, error } = await supabase
      .from("listings_view")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) return rowToListing(data);
    if (error) console.warn("[pantas] getListing fallback demo:", error.message);
  }
  await delay(150);
  return LISTINGS.find((l) => l.id === id);
}

/* ----------------------------------------------------------------------- */
/* Grading — POST /predict on the FastAPI service (ai_engine/api.py)         */
/* ----------------------------------------------------------------------- */

const PREDICT_URL = process.env.NEXT_PUBLIC_PREDICT_URL;

/**
 * Komoditas yang dipahami engine — satu entri per file di
 * ai_engine/grading_configs/. Nilai `id` inilah yang dikirim ke /predict
 * sebagai `commodity`; bobot modelnya dipilih dari kata dasar
 * ("tomato_ceri" -> export_models/tomato_seg.pt), jadi id baru hanya valid
 * bila config JSON-nya ada. Di-generate oleh scripts/gen-komoditas.mjs
 * (jalan otomatis tiap `dev`/`build`) supaya tidak pernah out of sync
 * sama isi folder config — edit label/kelompok di script itu, bukan di sini.
 */
export { KOMODITAS } from "./komoditas.generated";
import { KOMODITAS } from "./komoditas.generated";

export const KOMODITAS_DEFAULT = "tomato_sayur";

export function labelKomoditas(id: string): string {
  return KOMODITAS.find((k) => k.id === id)?.label ?? "Komoditas";
}

export async function gradeBatch(opts?: {
  /** Camera capture as data URL (store.lastCapture). */
  imageDataUrl?: string | null;
  /** Komoditas spesifik yang dipahami engine, mis. "tomato_sayur". */
  commodity?: string;
  /**
   * Kotak [x, y, w, h] tempat koin Rp500 diperkirakan berada (store.lastCoinRoi).
   * Tanpa ini calibration.py menyapu seluruh foto dan bisa memakai tomat bulat
   * sebagai referensi 27 mm.
   */
  coinRoi?: [number, number, number, number] | null;
}): Promise<GradingResult> {
  if (PREDICT_URL && opts?.imageDataUrl) {
    try {
      const blob = await (await fetch(opts.imageDataUrl)).blob();
      const form = new FormData();
      form.append("image", blob, "batch.jpg");
      form.append("commodity", opts.commodity ?? KOMODITAS_DEFAULT);
      if (opts.coinRoi) form.append("roi", JSON.stringify(opts.coinRoi));
      const res = await fetch(`${PREDICT_URL.replace(/\/$/, "")}/predict`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as GradingResult;
      if (json.status === "success" || json.status === "error") return json;
      throw new Error("bentuk respons tidak dikenal");
    } catch (e) {
      return {
        status: "error",
        message: `Gagal menghubungi layanan grading (${e instanceof Error ? e.message : e}). Coba lagi.`,
      };
    }
  }

  // Demo mode — same payload shape as ai_engine/model.py `dict_results`.
  await delay(1800);
  return {
    status: "success",
    komoditas: opts?.commodity ?? KOMODITAS_DEFAULT,
    objek_terdeteksi: 0,
    kalibrasi: { referensi: "koin_500", px_per_mm2: 0, valid: false },
    ringkasan_batch: {
      komposisi: {},
      skor_keseragaman: 0,
    },
    objek: [],
    hash_audit: "sha256:demo-mode-no-camera",
  };
}

/* ----------------------------------------------------------------------- */
/* Rekomendasi harga — harga_acuan (DB) × pengali kualitas                   */
/* ----------------------------------------------------------------------- */

const GRADE_LABEL: Record<Grade, string> = {
  A: "A (Premium)",
  B: "B (Standar)",
  C: "C (Ekonomis)",
  REJECT: "REJECT (Tidak layak jual)",
};

/** Bobot dasar per grade untuk pengali harga. */
const GRADE_BASE: Record<Grade, number> = { A: 1.0, B: 0.85, C: 0.65, REJECT: 0.35 };

/** Skor kualitas batch [0..1] dari komposisi grade. */
export function skorKualitas(komposisi: Partial<Record<Grade, number>>): number {
  const s =
    (komposisi.A ?? 0) * 1 + (komposisi.B ?? 0) * 0.7 + (komposisi.C ?? 0) * 0.4;
  return Math.round(s * 100) / 100;
}

const DEMO_ACUAN: Record<string, { label: string; harga: number }> = {
  tomato_sayur: { label: "Tomat Sayur", harga: 12000 },
  tomato_beef: { label: "Tomat Beef", harga: 11500 },
  tomato_ceri: { label: "Tomat Ceri", harga: 26000 },
  chili_rawit: { label: "Cabai Rawit Merah", harga: 52000 },
  // Kata dasar sebagai cadangan untuk varian yang belum punya harga sendiri.
  tomato: { label: "Tomat", harga: 12000 },
  chili: { label: "Cabai", harga: 45000 },
  carrot: { label: "Wortel", harga: 11000 },
  cucumber: { label: "Timun", harga: 9000 },
};

export async function getRekomendasiHarga(opts?: {
  komoditas?: string;
  grade?: Grade;
  skor?: number;
}): Promise<RekomendasiHarga> {
  const komoditas = opts?.komoditas ?? KOMODITAS_DEFAULT;
  const grade = opts?.grade ?? "B";
  const skor = opts?.skor ?? 0.62;

  // Komoditas spesifik dulu, lalu kata dasar ("carrot_lokal" -> "carrot").
  const base = komoditas.split("_")[0];
  const demo = DEMO_ACUAN[komoditas] ?? DEMO_ACUAN[base];
  let label = demo?.label ?? labelKomoditas(komoditas);
  let acuan = demo?.harga ?? 12000;
  let sumber = "PIHPS, demo";

  if (supabase) {
    const { data, error } = await supabase
      .from("harga_acuan")
      .select("*")
      .in("komoditas", [komoditas, base]);
    const row =
      data?.find((r) => r.komoditas === komoditas) ??
      data?.find((r) => r.komoditas === base);
    if (!error && row) {
      label = row.label;
      acuan = row.harga;
      const tgl = new Date(row.updated_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      sumber = `${row.sumber}, ${tgl}`;
    }
  } else {
    await delay(300);
  }

  // Rumus transparan (tampil apa adanya di layar harga):
  // pengali = bobot_grade × (0,9 + 0,16 × skor); rentang wajar ±7% / +8%.
  const pengali = Math.round(GRADE_BASE[grade] * (0.9 + 0.16 * skor) * 1000) / 1000;
  const tengah = acuan * pengali;
  const round100 = (n: number) => Math.round(n / 100) * 100;

  return {
    komoditas_label: label,
    grade_dominan: grade,
    grade_dominan_label: GRADE_LABEL[grade],
    harga_acuan: acuan,
    harga_acuan_sumber: sumber,
    skor_kualitas: skor,
    pengali,
    min: round100(tengah * 0.93),
    max: round100(tengah * 1.08),
  };
}

/* ----------------------------------------------------------------------- */
/* Demo fallback data (mode offline tanpa backend)                           */
/* ----------------------------------------------------------------------- */

export const LISTINGS: Listing[] = [
  {
    id: "PNT-L-0219",
    nama: "Tomat Sayur",
    komoditas: "tomato_sayur",
    grade: "B",
    berat_kg: 120,
    harga_per_kg: 10000,
    gambar: "/img/tomat.jpg",
    petani: "Pak Warsono",
    lokasi: "Lembang, Bandung Barat",
    jarak_km: 4.2,
    rating: 4.8,
    transaksi: 96,
    lat: -6.8118,
    lng: 107.6175,
    stok_kg: 120,
    panen_terakhir: "Hari ini, 06.00 WIB",
    komposisi: { A: 0.14, B: 0.6, C: 0.21, REJECT: 0.05 },
    catatan_ai:
      "Batch ini memiliki tingkat kematangan optimal untuk pengiriman jarak jauh (3-5 hari). Kadar air rendah dengan kulit yang tebal meningkatkan daya simpan.",
    alamat: "Kebun Sayur Berkah Utama, Jl. Raya Maribaya No. 12, Lembang",
  },
  {
    id: "PNT-L-0220",
    nama: "Tomat Beef",
    komoditas: "tomato_beef",
    grade: "B",
    berat_kg: 80,
    harga_per_kg: 9600,
    gambar: "/img/tomat-rumahkaca.jpg",
    petani: "Bu Karsih",
    lokasi: "Cisarua, Bandung Barat",
    jarak_km: 9.8,
    rating: 4.6,
    transaksi: 61,
    lat: -6.7742,
    lng: 107.5896,
    stok_kg: 80,
    panen_terakhir: "Kemarin, 15.30 WIB",
    komposisi: { A: 0.2, B: 0.55, C: 0.2, REJECT: 0.05 },
    catatan_ai:
      "Ukuran seragam dengan solidity tinggi. Cocok untuk olahan pasta dan saus industri.",
    alamat: "Greenhouse Karsih Tani, Jl. Kolonel Masturi, Cisarua",
  },
  {
    id: "PNT-L-0221",
    nama: "Tomat Cherry Organik",
    komoditas: "tomato_ceri",
    grade: "A",
    berat_kg: 1250,
    harga_per_kg: 24500,
    gambar: "/img/tomat-cherry.jpg",
    petani: "Pak Rahman",
    lokasi: "Lembang, Bandung Barat",
    jarak_km: 12.4,
    rating: 4.9,
    transaksi: 120,
    lat: -6.8323,
    lng: 107.6421,
    stok_kg: 1250,
    panen_terakhir: "Hari ini, 06.00 WIB",
    komposisi: { A: 0.15, B: 0.6, C: 0.2, REJECT: 0.05 },
    catatan_ai:
      "Batch ini memiliki tingkat kematangan optimal untuk pengiriman jarak jauh (3-5 hari). Kadar air rendah dan kulit yang tebal meningkatkan daya simpan.",
    alamat: "Kebun Organik Berkah Utama, Jl. Raya Maribaya No. 12, Lembang",
  },
  {
    id: "PNT-L-0222",
    nama: "Cabai Rawit Merah",
    komoditas: "chili_rawit",
    grade: "A",
    berat_kg: 240,
    harga_per_kg: 45000,
    gambar: "/img/cabai-pasar.jpg",
    petani: "Pelani Budi",
    lokasi: "Sukabumi",
    jarak_km: 18.1,
    rating: 4.7,
    transaksi: 88,
    lat: -6.9277,
    lng: 106.9299,
    stok_kg: 240,
    panen_terakhir: "Hari ini, 05.30 WIB",
    komposisi: { A: 0.62, B: 0.28, C: 0.08, REJECT: 0.02 },
    catatan_ai:
      "Warna merata dan tingkat kepedasan konsisten. Cacat kosmetik di bawah ambang batas.",
    alamat: "Kelompok Tani Budi Makmur, Sukabumi",
  },
  {
    id: "PNT-L-0223",
    nama: "Pakcoy Hidroponik",
    komoditas: "pakcoy",
    grade: "B",
    berat_kg: 60,
    harga_per_kg: 12000,
    gambar: "/img/pakcoy.jpg",
    petani: "Farm Modern",
    lokasi: "Bandung",
    jarak_km: 6.5,
    rating: 4.5,
    transaksi: 43,
    lat: -6.9175,
    lng: 107.6191,
    stok_kg: 60,
    panen_terakhir: "Hari ini, 07.00 WIB",
    komposisi: { A: 0.18, B: 0.64, C: 0.15, REJECT: 0.03 },
    catatan_ai: "Daun utuh, tidak ada tanda layu. Rantai dingin disarankan.",
    alamat: "Farm Modern Hidroponik, Bandung",
  },
  {
    id: "PNT-L-0224",
    nama: "Kentang Dieng",
    komoditas: "kentang",
    grade: "B",
    berat_kg: 1000,
    harga_per_kg: 18500,
    gambar: "/img/kentang-industri.jpg",
    petani: "Kelompok Tani",
    lokasi: "Dieng",
    jarak_km: 22.3,
    rating: 4.4,
    transaksi: 55,
    lat: -7.2,
    lng: 109.9075,
    satuan: "ton",
    stok_kg: 1000,
    panen_terakhir: "2 hari lalu",
    komposisi: { A: 0.1, B: 0.66, C: 0.2, REJECT: 0.04 },
    catatan_ai: "Ukuran menengah dominan. Cocok untuk industri keripik.",
    alamat: "Kelompok Tani Dieng Sejahtera, Wonosobo",
  },
];

