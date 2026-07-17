-- PANTAS — data demo. Petani demo dibuat sebagai baris auth.users stub
-- (tidak pernah login; hanya supaya FK profiles tetap ketat). Trigger
-- handle_new_user membuat profilnya, lalu kita lengkapi lokasi/rating.

-- ---------------------------------------------------------------------------
-- Petani demo
-- ---------------------------------------------------------------------------
insert into auth.users
  (instance_id, id, aud, role, phone, phone_confirmed_at,
   raw_app_meta_data, raw_user_meta_data,
   created_at, updated_at, confirmation_token, recovery_token,
   email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000001',
   'authenticated', 'authenticated', '+62811000001', now(),
   '{"provider":"phone","providers":["phone"]}', '{"peran":"petani","nama":"Pak Warsono"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000002',
   'authenticated', 'authenticated', '+62811000002', now(),
   '{"provider":"phone","providers":["phone"]}', '{"peran":"petani","nama":"Bu Karsih"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000003',
   'authenticated', 'authenticated', '+62811000003', now(),
   '{"provider":"phone","providers":["phone"]}', '{"peran":"petani","nama":"Pak Rahman"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000004',
   'authenticated', 'authenticated', '+62811000004', now(),
   '{"provider":"phone","providers":["phone"]}', '{"peran":"petani","nama":"Pelani Budi"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000005',
   'authenticated', 'authenticated', '+62811000005', now(),
   '{"provider":"phone","providers":["phone"]}', '{"peran":"petani","nama":"Farm Modern"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000006',
   'authenticated', 'authenticated', '+62811000006', now(),
   '{"provider":"phone","providers":["phone"]}', '{"peran":"petani","nama":"Kelompok Tani"}',
   now(), now(), '', '', '', '')
on conflict (id) do nothing;

update public.profiles set lokasi = 'Lembang, Bandung Barat',
  alamat = 'Kebun Sayur Berkah Utama, Jl. Raya Maribaya No. 12, Lembang',
  lat = -6.8118, lng = 107.6175, rating = 4.8, transaksi = 96
  where id = '00000000-0000-4000-a000-000000000001';
update public.profiles set lokasi = 'Cisarua, Bandung Barat',
  alamat = 'Greenhouse Karsih Tani, Jl. Kolonel Masturi, Cisarua',
  lat = -6.7742, lng = 107.5896, rating = 4.6, transaksi = 61
  where id = '00000000-0000-4000-a000-000000000002';
update public.profiles set lokasi = 'Lembang, Bandung Barat',
  alamat = 'Kebun Organik Berkah Utama, Jl. Raya Maribaya No. 12, Lembang',
  lat = -6.8323, lng = 107.6421, rating = 4.9, transaksi = 120
  where id = '00000000-0000-4000-a000-000000000003';
update public.profiles set lokasi = 'Sukabumi',
  alamat = 'Kelompok Tani Budi Makmur, Sukabumi',
  lat = -6.9277, lng = 106.9299, rating = 4.7, transaksi = 88
  where id = '00000000-0000-4000-a000-000000000004';
update public.profiles set lokasi = 'Bandung',
  alamat = 'Farm Modern Hidroponik, Bandung',
  lat = -6.9175, lng = 107.6191, rating = 4.5, transaksi = 43
  where id = '00000000-0000-4000-a000-000000000005';
update public.profiles set lokasi = 'Dieng',
  alamat = 'Kelompok Tani Dieng Sejahtera, Wonosobo',
  lat = -7.2, lng = 109.9075, rating = 4.4, transaksi = 55
  where id = '00000000-0000-4000-a000-000000000006';

-- ---------------------------------------------------------------------------
-- Listing katalog (samakan dengan LISTINGS di web/src/lib/data.ts)
-- ---------------------------------------------------------------------------
insert into public.listings
  (id, petani_id, nama, komoditas, grade, berat_kg, harga_per_kg, gambar,
   satuan, stok_kg, panen_terakhir, komposisi, catatan_ai)
values
  ('PNT-L-0219', '00000000-0000-4000-a000-000000000001', 'Tomat Sayur', 'tomato_sayur',
   'B', 120, 10000, '/img/tomat.jpg', null, 120, 'Hari ini, 06.00 WIB',
   '{"A":0.14,"B":0.6,"C":0.21,"REJECT":0.05}',
   'Batch ini memiliki tingkat kematangan optimal untuk pengiriman jarak jauh (3-5 hari). Kadar air rendah dengan kulit yang tebal meningkatkan daya simpan.'),
  ('PNT-L-0220', '00000000-0000-4000-a000-000000000002', 'Tomat Beef', 'tomato_beef',
   'B', 80, 9600, '/img/tomat-rumahkaca.jpg', null, 80, 'Kemarin, 15.30 WIB',
   '{"A":0.2,"B":0.55,"C":0.2,"REJECT":0.05}',
   'Ukuran seragam dengan solidity tinggi. Cocok untuk olahan pasta dan saus industri.'),
  ('PNT-L-0221', '00000000-0000-4000-a000-000000000003', 'Tomat Cherry Organik', 'tomato_ceri',
   'A', 1250, 24500, '/img/tomat-cherry.jpg', null, 1250, 'Hari ini, 06.00 WIB',
   '{"A":0.15,"B":0.6,"C":0.2,"REJECT":0.05}',
   'Batch ini memiliki tingkat kematangan optimal untuk pengiriman jarak jauh (3-5 hari). Kadar air rendah dan kulit yang tebal meningkatkan daya simpan.'),
  ('PNT-L-0222', '00000000-0000-4000-a000-000000000004', 'Cabai Rawit Merah', 'chili_rawit',
   'A', 240, 45000, '/img/cabai-pasar.jpg', null, 240, 'Hari ini, 05.30 WIB',
   '{"A":0.62,"B":0.28,"C":0.08,"REJECT":0.02}',
   'Warna merata dan tingkat kepedasan konsisten. Cacat kosmetik di bawah ambang batas.'),
  ('PNT-L-0223', '00000000-0000-4000-a000-000000000005', 'Pakcoy Hidroponik', 'pakcoy',
   'B', 60, 12000, '/img/pakcoy.jpg', null, 60, 'Hari ini, 07.00 WIB',
   '{"A":0.18,"B":0.64,"C":0.15,"REJECT":0.03}',
   'Daun utuh, tidak ada tanda layu. Rantai dingin disarankan.'),
  ('PNT-L-0224', '00000000-0000-4000-a000-000000000006', 'Kentang Dieng', 'kentang',
   'B', 1000, 18500, '/img/kentang-industri.jpg', 'ton', 1000, '2 hari lalu',
   '{"A":0.1,"B":0.66,"C":0.2,"REJECT":0.04}',
   'Ukuran menengah dominan. Cocok untuk industri keripik.'),
  -- Listing milik Pak Warsono (dasbor petani demo)
  ('PNT-L-0301', '00000000-0000-4000-a000-000000000001', 'Bawang Merah', 'bawang_merah',
   'A', 120, 35000, '/img/bawang-merah.jpg', null, 120, 'Hari ini', null, null),
  ('PNT-L-0302', '00000000-0000-4000-a000-000000000001', 'Bayam Hijau', 'bayam',
   'A', 45, 12000, '/img/bayam.jpg', null, 45, 'Hari ini', null, null),
  ('PNT-L-0303', '00000000-0000-4000-a000-000000000001', 'Kubis Hijau', 'kubis',
   'B', 300, 6000, '/img/kubis.jpg', null, 300, 'Hari ini', null, null),
  ('PNT-L-0304', '00000000-0000-4000-a000-000000000001', 'Kentang Dieng', 'kentang',
   'B', 300, 14500, '/img/kentang.jpg', null, 300, 'Hari ini', null, null),
  ('PNT-L-0305', '00000000-0000-4000-a000-000000000001', 'Tomat Ceri', 'tomato_ceri',
   'C', 32, 4000, '/img/tomat.jpg', null, 32, 'Hari ini', null, null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Harga acuan pasar (Fase 4 — nanti dimutakhirkan cron PIHPS harian)
-- ---------------------------------------------------------------------------
insert into public.harga_acuan (komoditas, label, harga, sumber) values
  ('tomato',        'Tomat',              12000, 'PIHPS'),
  ('tomato_sayur',  'Tomat Sayur',        12000, 'PIHPS'),
  ('tomato_beef',   'Tomat Beef',         11500, 'PIHPS'),
  ('tomato_ceri',   'Tomat Ceri',         26000, 'PIHPS'),
  ('chili',         'Cabai',              45000, 'PIHPS'),
  ('chili_rawit',   'Cabai Rawit Merah',  52000, 'PIHPS'),
  ('chili_keriting','Cabai Merah Keriting', 45000, 'PIHPS'),
  ('carrot',        'Wortel',             11000, 'PIHPS'),
  ('cucumber',      'Timun',               9000, 'PIHPS'),
  ('pakcoy',        'Pakcoy',             13000, 'PIHPS'),
  ('kentang',       'Kentang',            19000, 'PIHPS'),
  ('bawang_merah',  'Bawang Merah',       38000, 'PIHPS')
on conflict (komoditas) do update
  set harga = excluded.harga, updated_at = now();
