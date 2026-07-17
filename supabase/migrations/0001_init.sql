-- PANTAS — skema inti (Fase 1 + 3 + 4 dari docs/BACKEND.md)
-- Nama kolom sengaja Indonesia: mengikuti kontrak web/src/lib/types.ts,
-- yang mengikuti wire format PantasModel.predict di ai_engine/model.py.

-- ---------------------------------------------------------------------------
-- profiles — satu baris per pengguna auth; dibuat otomatis oleh trigger.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  peran      text not null check (peran in ('petani', 'pembeli')),
  nama       text not null,
  phone      text,
  lokasi     text,
  alamat     text,
  lat        double precision,
  lng        double precision,
  rating     numeric(2, 1) not null default 5.0,
  transaksi  integer not null default 0,
  created_at timestamptz not null default now()
);

-- Profil dibuat saat verifyOtp pertama sukses; peran & nama dikirim lewat
-- options.data pada signInWithOtp (masuk ke raw_user_meta_data).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, peran, nama, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'peran', 'pembeli'),
    coalesce(new.raw_user_meta_data ->> 'nama', 'Pengguna PANTAS'),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- gradings — riwayat pindai; `hasil` menyimpan payload GradingResult utuh.
-- ---------------------------------------------------------------------------
create table public.gradings (
  id               uuid primary key default gen_random_uuid(),
  petani_id        uuid not null references public.profiles (id) on delete cascade,
  komoditas        text not null,
  komoditas_label  text not null,
  grade_dominan    text not null check (grade_dominan in ('A', 'B', 'C', 'REJECT')),
  objek_terdeteksi integer not null default 0,
  hasil            jsonb not null,
  hash_audit       text,
  gambar_url       text,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- listings — id text "PNT-L-xxxx" agar cocok dengan yang dipakai frontend.
-- ---------------------------------------------------------------------------
create sequence public.listing_id_seq start 401;

create table public.listings (
  id             text primary key
                 default 'PNT-L-' || lpad(nextval('public.listing_id_seq')::text, 4, '0'),
  petani_id      uuid not null references public.profiles (id) on delete cascade,
  grading_id     uuid references public.gradings (id) on delete set null,
  nama           text not null,
  komoditas      text not null,
  grade          text not null check (grade in ('A', 'B', 'C', 'REJECT')),
  berat_kg       numeric not null check (berat_kg > 0),
  harga_per_kg   integer not null check (harga_per_kg > 0),
  gambar         text not null default '/img/tomat.jpg',
  satuan         text,
  stok_kg        numeric,
  panen_terakhir text,
  komposisi      jsonb,
  catatan_ai     text,
  status         text not null default 'tayang' check (status in ('tayang', 'habis', 'ditutup')),
  created_at     timestamptz not null default now()
);

create index listings_petani_idx on public.listings (petani_id);
create index listings_status_idx on public.listings (status);

-- Bentuk yang dikonsumsi frontend (Listing di types.ts): listing + info petani.
-- jarak_km dihitung di klien dari lat/lng.
create view public.listings_view
with (security_invoker = true) as
select
  l.id, l.nama, l.komoditas, l.grade, l.berat_kg, l.harga_per_kg, l.gambar,
  l.satuan, l.stok_kg, l.panen_terakhir, l.komposisi, l.catatan_ai,
  l.status, l.created_at, l.petani_id, l.grading_id,
  p.nama   as petani,
  p.lokasi as lokasi,
  p.alamat as alamat,
  p.lat    as lat,
  p.lng    as lng,
  p.rating as rating,
  p.transaksi as transaksi
from public.listings l
join public.profiles p on p.id = l.petani_id;

-- ---------------------------------------------------------------------------
-- orders — snapshot harga/berat saat pesan; kode = kode serah terima (QR).
-- ---------------------------------------------------------------------------
create sequence public.order_id_seq start 100;

create function public.gen_kode_serah_terima()
returns text
language sql
volatile
as $$
  select 'PNT-'
    || array_to_string(array(
         select substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', (1 + floor(random() * 31))::int, 1)
         from generate_series(1, 4)
       ), '')
    || '-' || (10 + floor(random() * 89))::int;
$$;

create table public.orders (
  id           text primary key
               default 'PNT-' || lpad(nextval('public.order_id_seq')::text, 4, '0'),
  kode         text not null default public.gen_kode_serah_terima(),
  listing_id   text references public.listings (id) on delete set null,
  pembeli_id   uuid not null references public.profiles (id) on delete cascade,
  petani_id    uuid not null references public.profiles (id) on delete cascade,
  status       text not null default 'dipesan'
               check (status in ('dipesan', 'dikonfirmasi', 'serah_terima', 'selesai')),
  nama         text not null,
  grade        text not null check (grade in ('A', 'B', 'C', 'REJECT')),
  berat_kg     numeric not null check (berat_kg > 0),
  harga_per_kg integer not null,
  total        bigint not null,
  created_at   timestamptz not null default now()
);

create index orders_pembeli_idx on public.orders (pembeli_id);
create index orders_petani_idx on public.orders (petani_id);

-- Verifikasi serah terima: petani mengetik kode dari QR pembeli. SECURITY
-- DEFINER supaya pencocokan kode terjadi di server, bukan kepercayaan klien.
create function public.verifikasi_serah_terima(p_order_id text, p_kode text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ok boolean := false;
begin
  update public.orders o
  set status = 'selesai'
  where o.id = p_order_id
    and o.petani_id = auth.uid()
    and o.status <> 'selesai'
    and upper(regexp_replace(p_kode, '[\s-]', '', 'g'))
      = upper(regexp_replace(o.kode, '[\s-]', '', 'g'))
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

-- ---------------------------------------------------------------------------
-- harga_acuan — harga pasar per komoditas (Fase 4; diisi cron PIHPS nantinya).
-- ---------------------------------------------------------------------------
create table public.harga_acuan (
  komoditas  text primary key,
  label      text not null,
  harga      integer not null check (harga > 0),
  sumber     text not null default 'PIHPS',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS — anon key hidup di browser; tanpa ini siapa pun bisa mengubah harga
-- orang lain (docs/BACKEND.md).
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.gradings    enable row level security;
alter table public.listings    enable row level security;
alter table public.orders      enable row level security;
alter table public.harga_acuan enable row level security;

-- profiles: info publik marketplace (nama, lokasi, rating) boleh dibaca semua;
-- hanya pemilik yang menulis.
create policy "profiles boleh dibaca semua"
  on public.profiles for select using (true);
create policy "profil milik sendiri: insert"
  on public.profiles for insert with check (auth.uid() = id);
create policy "profil milik sendiri: update"
  on public.profiles for update using (auth.uid() = id);

-- gradings: privat milik petani.
create policy "grading milik sendiri: select"
  on public.gradings for select using (auth.uid() = petani_id);
create policy "grading milik sendiri: insert"
  on public.gradings for insert with check (auth.uid() = petani_id);

-- listings: katalog terbuka; menulis hanya petani pemilik.
create policy "listing tayang terbuka"
  on public.listings for select
  using (status = 'tayang' or auth.uid() = petani_id);
create policy "petani menulis listing miliknya: insert"
  on public.listings for insert
  with check (
    auth.uid() = petani_id
    and exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.peran = 'petani'
    )
  );
create policy "petani menulis listing miliknya: update"
  on public.listings for update using (auth.uid() = petani_id);
create policy "petani menulis listing miliknya: delete"
  on public.listings for delete using (auth.uid() = petani_id);

-- orders: hanya dua pihak transaksi. Catatan v1: kolom `kode` ikut terbaca
-- petani; verifikasi tetap lewat RPC di atas. Pemisahan kolom = v2.
create policy "pesanan pihak terkait: select"
  on public.orders for select
  using (auth.uid() = pembeli_id or auth.uid() = petani_id);
create policy "pembeli membuat pesanan"
  on public.orders for insert
  with check (auth.uid() = pembeli_id);
create policy "petani memperbarui status pesanan"
  on public.orders for update
  using (auth.uid() = petani_id);

-- harga_acuan: baca publik; tulis hanya service role (cron).
create policy "harga acuan terbuka"
  on public.harga_acuan for select using (true);

-- ---------------------------------------------------------------------------
-- Storage — bucket `panen` untuk frame kamera & annotated_img (Fase 3).
-- Baca publik (gambar listing tampil tanpa auth), tulis ke folder {uid}/.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('panen', 'panen', true)
on conflict (id) do nothing;

create policy "panen: baca publik"
  on storage.objects for select
  using (bucket_id = 'panen');
create policy "panen: unggah ke folder sendiri"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'panen'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
