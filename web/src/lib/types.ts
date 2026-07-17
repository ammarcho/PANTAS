/**
 * Shapes mirror the payload returned by `PantasModel.predict` in
 * ai_engine/model.py. Keep the Indonesian field names — they are the wire
 * format the Python engine already emits, and renaming here would just add a
 * translation layer at the boundary.
 */

export type Grade = "A" | "B" | "C" | "REJECT";

export type Role = "petani" | "pembeli";

export interface Kalibrasi {
  referensi: string;
  px_per_mm2: number;
  valid: boolean;
}

export interface ObjekGrading {
  id: number;
  grade: string;
  ukuran_mm2: number | null;
  solidity: number;
  cacat: string[];
  alasan_grade: string[];
  /** YOLO 2 pathology verdict per object (e.g. "busuk" triggers a REJECT veto). */
  yolo2_kondisi: string;
  yolo2_conf: number;
  bbox: [number, number, number, number];
}

export interface RingkasanBatch {
  komposisi: Partial<Record<Grade, number>>;
  skor_keseragaman: number;
}

export interface GradingSuccess {
  status: "success";
  komoditas: string;
  objek_terdeteksi: number;
  kalibrasi: Kalibrasi;
  ringkasan_batch: RingkasanBatch;
  objek: ObjekGrading[];
  hash_audit: string;
}

export interface GradingError {
  status: "error";
  message: string;
}

export type GradingResult = GradingSuccess | GradingError;

/** Price recommendation, derived from batch grade + market reference. */
export interface RekomendasiHarga {
  komoditas_label: string;
  grade_dominan: Grade;
  grade_dominan_label: string;
  harga_acuan: number;
  harga_acuan_sumber: string;
  skor_kualitas: number;
  pengali: number;
  min: number;
  max: number;
}

export interface Listing {
  id: string;
  nama: string;
  komoditas: string;
  grade: Grade;
  berat_kg: number;
  harga_per_kg: number;
  gambar: string;
  petani: string;
  lokasi: string;
  jarak_km: number;
  rating: number;
  transaksi: number;
  lat: number;
  lng: number;
  satuan?: string;
  stok_kg?: number;
  panen_terakhir?: string;
  komposisi?: Partial<Record<Grade, number>>;
  catatan_ai?: string;
  alamat?: string;
}

export interface DampakStats {
  periode: string;
  kg_terselamatkan: number;
  co2e_ton: number;
  pendapatan_tambahan: number;
  transaksi_selesai: number;
  mingguan: { minggu: string; kg: number }[];
  per_komoditas: { nama: string; kg: number }[];
}

export type StatusPesanan = "dipesan" | "dikonfirmasi" | "serah_terima" | "selesai";

export interface Pesanan {
  id: string;
  kode: string;
  status: StatusPesanan;
  nama: string;
  grade: Grade;
  berat_kg: number;
  harga_per_kg: number;
  total: number;
}
