# Rencana Backend PANTAS

Frontend sudah jalan penuh sebagai aplikasi offline-first. Ada dua seam ke
backend:

1. [`web/src/lib/data.ts`](../web/src/lib/data.ts) — data baca (katalog,
   grading, rekomendasi harga). Fungsi `async`, bentuk balikan sama dengan
   backend nanti.
2. [`web/src/lib/store.tsx`](../web/src/lib/store.tsx) — state tulis (sesi,
   pesanan, listing terbit, riwayat pindai, inquiry), sekarang di
   localStorage. Setiap action (`selesaiLogin`, `publishListing`,
   `createOrder`, `verifikasiSerahTerima`, …) nanti jadi panggilan
   Supabase/API; komponen yang memakai `useStore()` tidak berubah.

Migrasi = ganti isi fungsi/action, bukan ubah layar.

Kontrak tipe ada di [`web/src/lib/types.ts`](../web/src/lib/types.ts) dan sengaja
memakai nama field Indonesia karena itu format yang **sudah** dikeluarkan
`PantasModel.predict` di `ai_engine/model.py`.

## Kenapa frontend dulu

AI engine sudah matang (4 model YOLOv11-seg, mAP50 87–97%). Yang belum ada
adalah cara orang memakainya. Membangun UI lebih dulu dengan kontrak yang
mengunci ke output engine berarti: saat backend datang, tidak ada penyesuaian
bentuk data — dan demo untuk juri tetap bisa jalan hari ini tanpa server.

## Fase 1 — Supabase: Auth + Database

Paling dulu karena semua fase lain butuh identitas pengguna.

- **Auth**: OTP nomor HP (`signInWithOtp` + `verifyOtp`). Alur login → layar
  OTP (`web/src/app/otp/page.tsx`) sudah lengkap dalam mode demo (semua kode
  diterima); tinggal ganti `mulaiLogin`/`selesaiLogin` di `store.tsx`.
  Penjaga rute per peran ada di `web/src/components/require-role.tsx` —
  sisi klien saja, perlindungan asli tetap RLS.
- **Tabel**: `profiles` (id, peran, nama, lokasi, lat, lng, rating),
  `listings` (kolom mengikuti `Listing` di `types.ts`),
  `orders` (mengikuti `Pesanan`), `gradings` (simpan JSON hasil + `hash_audit`).
- **RLS wajib**: petani hanya boleh menulis listing miliknya; pembeli hanya baca.
  Tanpa RLS, `anon key` di browser = siapa pun bisa mengubah harga orang lain.
- Ganti `getListings`/`getListing` di `data.ts` dan action pesanan/listing di
  `store.tsx` dengan query Supabase. Sisanya tidak berubah.

## Fase 2 — FastAPI: bungkus PantasModel

- Satu endpoint: `POST /predict` — terima `image` (multipart) + `commodity` +
  `roi` opsional, kembalikan persis `dict_results` dari `model.py`.
- Muat model sekali saat startup (`PantasModel` sudah punya cache per komoditas).
- Deploy ke Hugging Face Spaces (Docker). CPU cukup: inferensi 60–80 ms/frame.
- Ganti `gradeBatch()` dengan `fetch` ke endpoint ini.
- **Tangani `status: "error"`** — engine menolak foto blur (`blur_score < 50`).
  Layar hasil sudah punya cabang untuk ini.

## Fase 3 — Supabase Storage

- Kamera asli **sudah jalan**: layar pindai memakai `getUserMedia`
  (`facingMode: "environment"`) dengan fallback mode demo bila kamera tidak
  tersedia/diizinkan, plus unggah dari galeri. Frame di-downscale ke ≤900px
  JPEG sebelum disimpan.
- Yang tersisa: unggah frame ke bucket `panen/` alih-alih menyimpan data URL
  di localStorage, lalu kirim URL-nya ke `/predict`.
- Simpan `annotated_img` yang dikembalikan engine, lalu tampilkan di layar hasil
  menggantikan overlay `BatchPreview` di `petani/hasil/page.tsx`.

## Fase 4 — Harga acuan

`getRekomendasiHarga` masih memakai angka tetap. Rumusnya sudah transparan di
layar: `harga_acuan × pengali`, dengan `pengali` dari skor kualitas batch.
Yang perlu: sumber `harga_acuan` (PIHPS) via cron harian ke tabel `harga_acuan`.
Lihat `docs/PANTAS_Konsultasi_Algoritma_Harga.pdf`.

## Yang sengaja belum dikerjakan

- **Payment gateway** — v1 memakai tunai/transfer saat serah terima. Kode QR di
  layar pesanan sudah asli dan bisa dipindai untuk verifikasi serah terima.
- **Chat** — semua tombol "Hubungi …" kini deep-link WhatsApp dengan pesan
  terisi; tidak membangun perpesanan sendiri.
- **Angka dampak** — dasbor dampak sudah mencampur agregat tiruan dengan
  pesanan selesai dari store; versi backend menurunkannya penuh dari `orders`.

## Menjalankan

```bash
cd web
npm install
npm run dev     # http://localhost:3000
```

Peta memakai ubin OpenStreetMap publik — tidak perlu kunci API.
