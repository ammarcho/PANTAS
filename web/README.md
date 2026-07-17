# PANTAS — Web

Antarmuka PANTAS: petani memindai panen, AI menilai mutu, harga wajar muncul,
pembeli industri menemukannya.

## Jalankan

```bash
npm install
npm run dev     # http://localhost:3000
```

## Stack

| Bagian    | Teknologi                  |
| --------- | -------------------------- |
| Framework | Next.js 16 (App Router)    |
| Styling   | Tailwind CSS 4             |
| Peta      | Leaflet + OpenStreetMap    |
| Ikon      | lucide-react               |
| Backend   | Supabase (belum disambung) |

## Alur layar

**Petani** — `/` login → `/otp` → `/petani` beranda → `/petani/pindai`
(kamera asli, fallback demo) → `/petani/hasil` → `/petani/harga` (slider +
berat) → `/petani/listing-tayang` → `/petani/listing`.
Tab: beranda, pesanan (verifikasi serah terima per pesanan), dampak, akun.
Lainnya: `/petani/riwayat` (riwayat pindai).

**Pembeli** — `/pembeli` katalog (pencarian suara, filter, inquiry) →
`/pembeli/produk/[id]` → sheet jumlah → `/pembeli/pesanan/[id]` (QR asli).
Tab: home, orders, `/pembeli/peta`, account. Lainnya: `/pembeli/inquiry`.

## Data & state

Dua seam ke backend:

- `src/lib/data.ts` — data baca (katalog, grading, rekomendasi harga).
  Bentuknya mengunci ke output `PantasModel.predict` di `ai_engine/model.py`.
- `src/lib/store.tsx` — state tulis (sesi, pesanan, listing terbit, riwayat
  pindai, inquiry) di localStorage; app jalan penuh offline. Action-nya
  (`createOrder`, `publishListing`, `verifikasiSerahTerima`, …) nanti diganti
  panggilan Supabase tanpa menyentuh layar.

Rencana lengkap: [`../docs/BACKEND.md`](../docs/BACKEND.md).

## Catatan

- Desain 390px (Figma). Di desktop, bingkai yang sama ditengahkan — bukan
  direntangkan ke layout yang tidak pernah dirancang.
- Login OTP berjalan dalam mode demo: semua kode 6 digit diterima.
- Kamera pindai memakai `getUserMedia`; tanpa izin/kamera jatuh ke mode demo
  dengan foto contoh. Unggah galeri tetap tersedia.
- Serah terima: pembeli menunjukkan QR/kode, petani memasukkan kode itu di
  detail pesanan untuk menyelesaikan transaksi — dua sisi kode yang sama.
- Token warna (termasuk warna grade A/B/C/REJECT yang harus cocok dengan
  keluaran engine) ada di `src/app/globals.css`.
