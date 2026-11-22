-- Migrasi: hapus alur pendaftaran lewat formulir web
-- Untuk MH-DEV dan PPM-MH, yang sudah memuat ketiga tabel ini.
--
-- Pendaftaran akun lewat /daftar-akun dibatalkan, penggantinya alur Masuk dengan
-- Google. Penerimaan santri baru kembali memakai Google Form, jadi tabel
-- pendaftaran lama beserta halamannya juga tidak dipakai lagi.
--
-- PENTING: BAGIAN 1 jangan dijalankan bersama bagian lainnya. SQL Editor
-- menjalankan seluruh isi berkas sekaligus dalam satu transaksi, jadi sorot
-- BAGIAN 1 saja lalu Run selection, periksa hasilnya, baru jalankan BAGIAN 2
-- dan BAGIAN 3.

-- ============================================
-- BAGIAN 1: PEMERIKSAAN (jalankan sendiri dulu)
-- ============================================
-- Jumlah baris ketiga tabel sebelum dihapus. Kalau ada data yang masih Anda
-- perlukan, ekspor dulu sebelum menjalankan BAGIAN 2.
SELECT 'pendaftaran' AS tabel, count(*) AS jumlah_baris FROM public.pendaftaran
UNION ALL
SELECT 'pendaftaran_guru' AS tabel, count(*) AS jumlah_baris FROM public.pendaftaran_guru
UNION ALL
SELECT 'pendaftaran_orang_tua' AS tabel, count(*) AS jumlah_baris FROM public.pendaftaran_orang_tua;

-- ============================================
-- BAGIAN 2: PENGHAPUSAN
-- ============================================
-- Tanpa CASCADE. Kalau masih ada objek lain yang bergantung pada tabel atau fungsi
-- ini, perintahnya akan gagal dengan error, bukan ikut menghapus benda yang tidak
-- terduga secara diam-diam. Policy dan index milik sebuah tabel terhapus otomatis
-- bersama tabelnya, jadi tidak perlu DROP POLICY atau DROP INDEX terpisah.
--
-- Urutan: tabel detail lebih dulu, lalu fungsi pencarian, terakhir tabel pendaftaran.
DROP TABLE IF EXISTS public.pendaftaran_orang_tua;
DROP TABLE IF EXISTS public.pendaftaran_guru;
DROP FUNCTION IF EXISTS public.search_santri(TEXT);
DROP TABLE IF EXISTS public.pendaftaran;

-- ============================================
-- BAGIAN 3: GERBANG IZIN IKUT MEMERIKSA STATUS
-- ============================================
-- Sebelumnya is_admin() dan is_staff() hanya membaca role, jadi akun berstatus
-- pending atau rejected dengan role admin atau guru tetap lolos policy RLS.
-- Gerbang status yang sudah ada hanya bekerja di sisi klien, dan itu tidak
-- menjaga jalur API.
--
-- current_user_role() sengaja dibiarkan apa adanya: fungsi itu hanya menjawab
-- "role apa", bukan "boleh atau tidak". REVOKE dan GRANT yang sudah ada tidak
-- perlu diulang, karena CREATE OR REPLACE tidak menyentuh hak akses fungsi.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_profile
    WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_profile
    WHERE id = auth.uid() AND role IN ('admin', 'guru') AND status = 'approved'
  );
$$;

-- Catatan: setelah ini, akun admin yang statusnya bukan approved kehilangan
-- kemampuan mengubah role dan status lewat trigger penjaga. Semua akun lama
-- sudah berstatus approved, jadi tidak ada yang terkunci.

-- ============================================
-- VERIFIKASI SETELAH BAGIAN 2 DAN BAGIAN 3
-- ============================================
-- Kedua kueri berikut harus mengembalikan nol baris.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('pendaftaran', 'pendaftaran_guru', 'pendaftaran_orang_tua');

SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'search_santri';

-- Definisi kedua gerbang izin setelah BAGIAN 3. Keduanya harus memuat
-- status = 'approved', dan tetap SECURITY DEFINER dengan search_path yang diset.
SELECT pg_get_functiondef('public.is_admin()'::regprocedure);
SELECT pg_get_functiondef('public.is_staff()'::regprocedure);
