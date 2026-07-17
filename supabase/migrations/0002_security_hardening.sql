-- Tindak lanjut advisor keamanan Supabase (get_advisors: security).

-- 1) search_path eksplisit untuk fungsi default kode pesanan.
alter function public.gen_kode_serah_terima() set search_path = '';

-- 2) handle_new_user hanya untuk trigger auth — jangan bisa dipanggil via API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 3) verifikasi_serah_terima hanya untuk pengguna login (petani).
revoke execute on function public.verifikasi_serah_terima(text, text) from public, anon;

-- 4) gen_kode_serah_terima cukup dipakai default kolom, bukan API publik.
revoke execute on function public.gen_kode_serah_terima() from public, anon, authenticated;

-- 5) Bucket publik tidak butuh policy SELECT luas (URL objek tetap bisa
--    diakses); tanpa policy ini klien tidak bisa me-list seluruh isi bucket.
drop policy "panen: baca publik" on storage.objects;
