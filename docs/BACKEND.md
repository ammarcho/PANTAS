# Backend PANTAS — status

Frontend tetap offline-first: tanpa env, semua fungsi jatuh ke data demo dan
localStorage. Dengan `web/.env.local` terisi, seam yang sama membaca/menulis
Supabase. Dua seam itu tidak berubah:

1. [`web/src/lib/data.ts`](../web/src/lib/data.ts) — data baca (katalog,
   grading, rekomendasi harga). Sekarang query Supabase dengan fallback demo.
2. [`web/src/lib/store.tsx`](../web/src/lib/store.tsx) — state tulis. Aksi
   tetap sinkron untuk komponen; tulisan DB berjalan di latar belakang
   (optimistic local + background sync), hidrasi dari DB setelah login OTP
   asli.

Kontrak tipe tetap di [`web/src/lib/types.ts`](../web/src/lib/types.ts)
(nama field Indonesia = wire format `PantasModel.predict`).

## Fase 1 — Supabase: Auth + Database ✅

Proyek: `saipqorcjeizxizjpfsp` (ap-southeast-1). Skema, RLS, trigger, seed:
lihat [`supabase/`](../supabase/README.md).

- **Auth**: `signInWithOtp`/`verifyOtp` nomor HP terpasang di `store.tsx`.
  Tanpa provider SMS terkonfigurasi (dashboard → Auth → Phone), aplikasi
  otomatis mode demo — layar OTP menampilkan status mana yang aktif.
- **Tabel**: `profiles`, `listings`, `orders`, `gradings`, `harga_acuan`,
  view `listings_view` (listing + profil petani).
- **RLS**: aktif semua tabel; petani hanya menulis listing miliknya, pesanan
  hanya terlihat dua pihak transaksi, verifikasi serah terima via RPC
  `security definer`.

## Fase 2 — FastAPI: bungkus PantasModel ✅ (kode) / ⏳ (deploy)

- [`ai_engine/api.py`](../ai_engine/api.py): `POST /predict` (multipart
  `image` + `commodity` + `roi` opsional) → `dict_results` dari `model.py`
  plus `annotated_img` (JPEG data URL). `GET /health` untuk probe.
- [`ai_engine/Dockerfile`](../ai_engine/Dockerfile) siap Hugging Face Spaces
  (port 7860). Deploy = buat Space Docker, salin isi `ai_engine/`.
- Frontend: isi `NEXT_PUBLIC_PREDICT_URL` di `web/.env.local`; `gradeBatch()`
  mengirim capture kamera asli dan layar hasil menampilkan `annotated_img`.
  Cabang `status:"error"` (foto blur) sudah ditangani layar hasil.

## Fase 3 — Supabase Storage ✅

- Bucket `panen` (publik, unggah ke folder `{uid}/`). `uploadCapture()` di
  [`web/src/lib/supabase.ts`](../web/src/lib/supabase.ts) mengunggah frame;
  URL publiknya dipakai listing & riwayat pindai, fallback data URL lokal.

## Fase 4 — Harga acuan ✅ (tabel) / ⏳ (cron PIHPS)

- Tabel `harga_acuan` terisi 12 komoditas. `getRekomendasiHarga` membaca DB
  dan menghitung: `pengali = bobot_grade × (0,9 + 0,16 × skor)`, rentang
  wajar 93%–108% dari `harga_acuan × pengali`. Layar hasil meneruskan
  komoditas/grade/skor lewat query string ke layar harga.
- Tersisa: cron harian PIHPS menulis ke `harga_acuan` (service role).
  Lihat `docs/PANTAS_Konsultasi_Algoritma_Harga.pdf`.

## Yang sengaja belum dikerjakan

- **Payment gateway** — v1 tunai/transfer saat serah terima; QR kode pesanan
  asli dan diverifikasi lewat RPC.
- **Chat** — tombol "Hubungi …" tetap deep-link WhatsApp.
- **Angka dampak** — dasbor dampak masih campuran agregat tiruan + pesanan
  store; versi penuh diturunkan dari `orders`.
- **Pemisahan `orders.kode` dari select petani** — v1 menerima trade-off ini
  agar mode demo offline tetap identik; catatan di `supabase/README.md`.

## Menjalankan

```bash
cd web
npm install
cp .env.example .env.local   # isi URL + anon key Supabase (opsional)
npm run dev                  # http://localhost:3000

# API grading (opsional, butuh bobot model di ai_engine/export_models/)
cd ../ai_engine
pip install -r requirements.txt
uvicorn api:app --port 7860
```

Tanpa env sama sekali, aplikasi berjalan penuh dalam mode demo — persis
perilaku sebelum backend ada.
