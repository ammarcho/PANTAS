# Rencana Backend PANTAS

Frontend sudah jalan penuh dengan data tiruan. Semua data mengalir lewat satu
berkas: [`web/src/lib/data.ts`](../web/src/lib/data.ts). Setiap fungsi di sana
`async` dan mengembalikan bentuk yang sama dengan yang nanti dikirim backend,
jadi migrasi = ganti isi fungsi, bukan ubah layar.

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

- **Auth**: OTP nomor HP (`signInWithOtp`). Layar login sudah memvalidasi format
  nomor dan memilih peran; tinggal sambungkan `submit()` di
  `web/src/app/page.tsx`.
- **Tabel**: `profiles` (id, peran, nama, lokasi, lat, lng, rating),
  `listings` (kolom mengikuti `Listing` di `types.ts`),
  `orders` (mengikuti `Pesanan`), `gradings` (simpan JSON hasil + `hash_audit`).
- **RLS wajib**: petani hanya boleh menulis listing miliknya; pembeli hanya baca.
  Tanpa RLS, `anon key` di browser = siapa pun bisa mengubah harga orang lain.
- Ganti `getListings`, `getListing`, `getListingSaya`, `getPesanan` dengan query
  Supabase. Sisanya tidak berubah.

## Fase 2 — FastAPI: bungkus PantasModel

- Satu endpoint: `POST /predict` — terima `image` (multipart) + `commodity` +
  `roi` opsional, kembalikan persis `dict_results` dari `model.py`.
- Muat model sekali saat startup (`PantasModel` sudah punya cache per komoditas).
- Deploy ke Hugging Face Spaces (Docker). CPU cukup: inferensi 60–80 ms/frame.
- Ganti `gradeBatch()` dengan `fetch` ke endpoint ini.
- **Tangani `status: "error"`** — engine menolak foto blur (`blur_score < 50`).
  Layar hasil sudah punya cabang untuk ini.

## Fase 3 — Supabase Storage + kamera asli

- Layar pindai kini memakai foto contoh. Ganti dengan `getUserMedia`
  (`facingMode: "environment"`), unggah frame ke bucket `panen/`, kirim URL-nya
  ke `/predict`.
- Simpan `annotated_img` yang dikembalikan engine, lalu tampilkan di layar hasil
  menggantikan `BatchPreview` (komponen tiruan di `petani/hasil/page.tsx`).

## Fase 4 — Harga acuan

`getRekomendasiHarga` masih memakai angka tetap. Rumusnya sudah transparan di
layar: `harga_acuan × pengali`, dengan `pengali` dari skor kualitas batch.
Yang perlu: sumber `harga_acuan` (PIHPS) via cron harian ke tabel `harga_acuan`.
Lihat `docs/PANTAS_Konsultasi_Algoritma_Harga.pdf`.

## Yang sengaja belum dikerjakan

- **Payment gateway** — v1 memakai tunai/transfer saat serah terima. Kode QR di
  layar pesanan sudah asli dan bisa dipindai untuk verifikasi serah terima.
- **Chat** — tombol "Hubungi Petani" sebaiknya ke WhatsApp dulu, bukan bangun
  perpesanan sendiri.
- **Angka dampak** — `getDampak` perlu diturunkan dari `orders` yang selesai,
  bukan dihitung terpisah, supaya tidak bisa berbeda dari transaksi asli.

## Menjalankan

```bash
cd web
npm install
npm run dev     # http://localhost:3000
```

Peta memakai ubin OpenStreetMap publik — tidak perlu kunci API.
