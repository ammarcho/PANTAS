import type {
  DampakStats,
  GradingResult,
  Listing,
  Pesanan,
  RekomendasiHarga,
} from "./types";

/**
 * Single seam between the UI and the backend.
 *
 * Every function here is async and returns the same shape the real backend
 * will return, so wiring up Supabase (listings, auth, storage) and the FastAPI
 * grading endpoint means replacing these bodies — not touching the screens.
 * See docs/BACKEND.md for the migration order.
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

/** Listings the logged-in petani owns, as shown on Dashboard Petani. */
export const LISTING_SAYA: Listing[] = [
  {
    ...LISTINGS[0],
    id: "PNT-L-0301",
    nama: "Bawang Merah",
    grade: "A",
    berat_kg: 120,
    harga_per_kg: 35000,
    gambar: "/img/bawang-merah.jpg",
  },
  {
    ...LISTINGS[0],
    id: "PNT-L-0302",
    nama: "Bayam Hijau",
    grade: "A",
    berat_kg: 45,
    harga_per_kg: 12000,
    gambar: "/img/bayam.jpg",
  },
  {
    ...LISTINGS[0],
    id: "PNT-L-0303",
    nama: "Kubis Hijau",
    grade: "B",
    berat_kg: 300,
    harga_per_kg: 6000,
    gambar: "/img/kubis.jpg",
  },
  {
    ...LISTINGS[0],
    id: "PNT-L-0304",
    nama: "Kentang Dieng",
    grade: "B",
    berat_kg: 300,
    harga_per_kg: 14500,
    gambar: "/img/kentang.jpg",
  },
  {
    ...LISTINGS[0],
    id: "PNT-L-0305",
    nama: "Tomat Ceri",
    grade: "C",
    berat_kg: 32,
    harga_per_kg: 4000,
    gambar: "/img/tomat.jpg",
  },
];

/**
 * Stand-in for POST /predict on the FastAPI service that wraps PantasModel.
 * Field names and nesting match ai_engine/model.py `dict_results`.
 *
 * Returns GradingResult, not GradingSuccess: the engine rejects blurry frames
 * (blur_score < 50) with a status:"error" payload, so callers must handle it.
 */
export async function gradeBatch(): Promise<GradingResult> {
  await delay(2200);
  return {
    status: "success",
    komoditas: "tomato_sayur",
    objek_terdeteksi: 42,
    kalibrasi: { referensi: "koin_500", px_per_mm2: 0.52, valid: true },
    ringkasan_batch: {
      komposisi: { A: 0.14, B: 0.6, C: 0.21, REJECT: 0.05 },
      skor_keseragaman: 0.91,
    },
    objek: [],
    hash_audit: "sha256:9f31a0c4e7b28d15f6a3c9e0b7d4128fa6e5c3b90d2f7a41c7e2",
  };
}

export async function getRekomendasiHarga(): Promise<RekomendasiHarga> {
  await delay(300);
  return {
    komoditas_label: "Tomat Sayur",
    grade_dominan: "B",
    grade_dominan_label: "B (Standar)",
    harga_acuan: 12000,
    harga_acuan_sumber: "PIHPS, 14 Jul",
    skor_kualitas: 0.62,
    pengali: 0.843,
    min: 9400,
    max: 10900,
  };
}

export async function getListings(): Promise<Listing[]> {
  await delay(200);
  return LISTINGS;
}

export async function getListing(id: string): Promise<Listing | undefined> {
  await delay(150);
  return LISTINGS.find((l) => l.id === id);
}

export async function getListingSaya(): Promise<Listing[]> {
  await delay(200);
  return LISTING_SAYA;
}

export async function getDampak(): Promise<DampakStats> {
  await delay(250);
  return {
    periode: "8 minggu terakhir",
    kg_terselamatkan: 1240,
    co2e_ton: 2.1,
    pendapatan_tambahan: 8_400_000,
    transaksi_selesai: 37,
    mingguan: [
      { minggu: "M1", kg: 96 },
      { minggu: "M2", kg: 108 },
      { minggu: "M3", kg: 124 },
      { minggu: "M4", kg: 118 },
      { minggu: "M5", kg: 152 },
      { minggu: "M6", kg: 168 },
      { minggu: "M7", kg: 202 },
      { minggu: "M8", kg: 240 },
    ],
    per_komoditas: [
      { nama: "Tomat", kg: 520 },
      { nama: "Cabai", kg: 390 },
      { nama: "Timun", kg: 210 },
      { nama: "Wortel", kg: 120 },
    ],
  };
}

export async function getPesanan(): Promise<Pesanan> {
  await delay(200);
  return {
    id: "PNT-0092",
    kode: "PNT-7F3K-92",
    status: "serah_terima",
    nama: "Tomat Sayur",
    grade: "B",
    berat_kg: 120,
    harga_per_kg: 10000,
    total: 1_200_000,
  };
}
