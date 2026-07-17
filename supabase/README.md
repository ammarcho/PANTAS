# Supabase — backend PANTAS

Proyek hosted: **PANTAS** (`saipqorcjeizxizjpfsp`, region `ap-southeast-1`).
URL API: `https://saipqorcjeizxizjpfsp.supabase.co`.

## Isi

- `migrations/0001_init.sql` — skema inti: `profiles`, `gradings`, `listings`,
  `orders`, `harga_acuan`, view `listings_view`, trigger `handle_new_user`,
  RPC `verifikasi_serah_terima`, bucket storage `panen`, dan seluruh policy RLS.
- `migrations/0002_security_hardening.sql` — tindak lanjut advisor keamanan
  (search_path fungsi, revoke execute, hapus policy listing bucket).
- `seed.sql` — 6 petani demo (baris stub `auth.users`, tidak pernah bisa
  login), 11 listing katalog, 12 harga acuan.

Kedua migrasi **sudah diterapkan** ke proyek hosted lewat MCP, dan seed sudah
dijalankan. File di sini adalah sumber kebenaran bila proyek perlu dibangun
ulang (`supabase db push` / SQL editor).

## Konfigurasi yang tidak bisa lewat SQL

1. **SMS OTP** — Auth → Providers → Phone: aktifkan lalu isi kredensial
   Twilio/Vonage/MessageBird. Tanpa ini `signInWithOtp` gagal dan aplikasi
   otomatis kembali ke mode demo (semua kode diterima, tanpa tulis DB).
   Untuk pengujian tanpa biaya SMS: Auth → Providers → Phone → *Test phone
   numbers* — daftarkan nomor + OTP tetap.
2. **Env frontend** — salin `web/.env.example` ke `web/.env.local`; nilai
   proyek ini sudah terisi di `.env.local` lokal (tidak di-commit).

## Model keamanan (ringkas)

- Kunci anon/publishable hidup di browser; **RLS aktif di semua tabel**.
- `listings`: baca publik (status `tayang`), tulis hanya petani pemilik
  (cek `peran = 'petani'` di `profiles`).
- `orders`: hanya pembeli/petani pihak transaksi; verifikasi serah terima
  lewat RPC `security definer` — pencocokan kode terjadi di server.
- `gradings`: privat per petani; `hasil` jsonb + `hash_audit` untuk audit.
- Bucket `panen`: publik untuk URL objek, unggah hanya ke folder `{uid}/`,
  tanpa listing isi bucket.
- Catatan v1: kolom `orders.kode` terbaca petani via select (dipakai mode
  demo offline). Pemisahan kolom/kolom-level privilege = v2.
