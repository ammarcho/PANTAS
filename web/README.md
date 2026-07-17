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

**Petani** — `/` login → `/petani` beranda → `/petani/pindai` →
`/petani/hasil` → `/petani/harga` → `/petani/listing-tayang`.
Tab: beranda, pesanan, dampak, akun.

**Pembeli** — `/pembeli` katalog → `/pembeli/produk/[id]` →
`/pembeli/pesanan`. Tab: home, orders, `/pembeli/peta`, account.

## Data

Semua data lewat `src/lib/data.ts` — satu-satunya sambungan ke backend.
Bentuknya mengunci ke output `PantasModel.predict` di `ai_engine/model.py`,
jadi menyambungkan backend berarti mengganti isi fungsi, bukan mengubah layar.

Rencana lengkap: [`../docs/BACKEND.md`](../docs/BACKEND.md).

## Catatan

- Desain 390px (Figma). Di desktop, bingkai yang sama ditengahkan — bukan
  direntangkan ke layout yang tidak pernah dirancang.
- Layar pindai memakai foto contoh sebagai pengganti umpan kamera.
- Token warna (termasuk warna grade A/B/C/REJECT yang harus cocok dengan
  keluaran engine) ada di `src/app/globals.css`.
