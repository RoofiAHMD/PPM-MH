-- Migrasi: sistem pendaftaran akun empat role
-- Untuk database yang SUDAH berisi data, yaitu MH-DEV dan PPM-MH.
-- Database kosong tidak perlu berkas ini; cukup jalankan supabase-schema.sql.
--
-- Jalankan berurutan dari atas ke bawah, dan aman dijalankan berulang.
-- Urutannya mengikat: langkah 4 sampai 7 memakai fungsi dari langkah 1.

-- ============================================
-- LANGKAH 0: PEMERIKSAAN SEBELUM MENGUBAH
-- ============================================
-- Kalau kueri ini mengembalikan baris, perbaiki dulu nilainya. Kalau tidak,
-- langkah 3 akan gagal dengan ERROR 23514 check constraint violation.
SELECT id, email, role
FROM public.users_profile
WHERE role IS NOT NULL
  AND role NOT IN ('admin', 'guru', 'orang_tua', 'santri', 'guest');

-- ============================================
-- LANGKAH 1: FUNGSI PEMBANTU ROLE
-- ============================================
-- Harus lebih dulu: policy di langkah 4, 5, dan 6 memanggil fungsi ini, dan
-- PostgreSQL mengurai isi policy pada saat policy dibuat.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.users_profile WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(public.current_user_role() = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(public.current_user_role() IN ('admin', 'guru'), false);
$$;

REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- ============================================
-- LANGKAH 2: KOLOM STATUS DI users_profile
-- ============================================
-- Backfill hanya dijalankan sekali, yaitu saat kolomnya baru dibuat. Kalau
-- UPDATE ditaruh di luar blok ini, menjalankan ulang berkas akan menyetujui
-- kembali akun yang sengaja ditolak atau yang memang masih menunggu.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users_profile'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.users_profile ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    -- Semua akun yang sudah ada mendahului alur persetujuan ini, termasuk akun admin.
    -- Tanpa baris ini, admin sendiri ikut berstatus pending.
    UPDATE public.users_profile SET status = 'approved';
  END IF;
END $$;

ALTER TABLE public.users_profile DROP CONSTRAINT IF EXISTS users_profile_status_check;
ALTER TABLE public.users_profile ADD CONSTRAINT users_profile_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_users_profile_status ON public.users_profile(status);

-- ============================================
-- LANGKAH 3: CHECK ROLE BARU
-- ============================================
ALTER TABLE public.users_profile DROP CONSTRAINT IF EXISTS users_profile_role_check;
ALTER TABLE public.users_profile ADD CONSTRAINT users_profile_role_check
  CHECK (role IN ('admin', 'guru', 'orang_tua', 'santri', 'guest'));

-- ============================================
-- LANGKAH 4: POLICY users_profile, PENJAGA KOLOM, TRIGGER SIGNUP
-- ============================================
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users_profile;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users_profile;
DROP POLICY IF EXISTS "Allow public read users_profile" ON public.users_profile;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.users_profile;

CREATE POLICY "Users can read own profile" ON public.users_profile
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.users_profile
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Admin can update all profiles" ON public.users_profile
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Allow insert for authenticated users" ON public.users_profile
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- RLS bekerja per baris, bukan per kolom, dan WITH CHECK tidak bisa melihat nilai
-- lama. Tanpa trigger ini, user bisa menaikkan role-nya sendiri menjadi admin atau
-- menyetujui akunnya sendiri lewat satu UPDATE biasa ke barisnya sendiri.
CREATE OR REPLACE FUNCTION public.guard_users_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := COALESCE(NEW.role, 'guest');
    NEW.status := 'pending';
  ELSE
    NEW.role := OLD.role;
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_users_profile_role_trigger ON public.users_profile;
CREATE TRIGGER guard_users_profile_role_trigger
  BEFORE INSERT OR UPDATE ON public.users_profile
  FOR EACH ROW EXECUTE FUNCTION public.guard_users_profile_role();

-- raw_user_meta_data dikirim dari browser saat signup, jadi tidak tepercaya.
-- Hanya tiga role ini yang boleh diminta sendiri; 'admin' tidak pernah.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, nama, role, status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nama',
    CASE new.raw_user_meta_data->>'role'
      WHEN 'guru' THEN 'guru'
      WHEN 'orang_tua' THEN 'orang_tua'
      WHEN 'santri' THEN 'santri'
      ELSE 'guest'
    END,
    'pending'
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- LANGKAH 5: TABEL DETAIL PENDAFTARAN AKUN
-- ============================================
-- Nama dan email tidak diduplikasi di sini; keduanya sudah ada di users_profile.
CREATE TABLE IF NOT EXISTS public.pendaftaran_guru (
  id UUID PRIMARY KEY REFERENCES public.users_profile(id) ON DELETE CASCADE,
  nik VARCHAR(16) NOT NULL UNIQUE CHECK (nik ~ '^[0-9]{16}$'),
  alamat_asal TEXT NOT NULL,
  tempat_lahir VARCHAR(255) NOT NULL,
  tanggal_lahir DATE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  jenis_kelamin VARCHAR(20) NOT NULL CHECK (jenis_kelamin IN ('laki-laki', 'perempuan')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- nomor_kk sengaja tidak UNIQUE: ayah dan ibu berbagi satu nomor kartu keluarga.
CREATE TABLE IF NOT EXISTS public.pendaftaran_orang_tua (
  id UUID PRIMARY KEY REFERENCES public.users_profile(id) ON DELETE CASCADE,
  nomor_kk VARCHAR(16) NOT NULL CHECK (nomor_kk ~ '^[0-9]{16}$'),
  kota_asal VARCHAR(255) NOT NULL,
  alamat_sambung TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  jenis_kelamin VARCHAR(20) NOT NULL CHECK (jenis_kelamin IN ('laki-laki', 'perempuan')),
  peran VARCHAR(10) NOT NULL CHECK (peran IN ('ayah', 'ibu', 'wali')),
  santri_id UUID REFERENCES public.santri(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pendaftaran_guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendaftaran_orang_tua ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own pendaftaran_guru" ON public.pendaftaran_guru;
DROP POLICY IF EXISTS "Users can read own pendaftaran_guru" ON public.pendaftaran_guru;
DROP POLICY IF EXISTS "Admin can update pendaftaran_guru" ON public.pendaftaran_guru;

DROP POLICY IF EXISTS "Users can insert own pendaftaran_orang_tua" ON public.pendaftaran_orang_tua;
DROP POLICY IF EXISTS "Users can read own pendaftaran_orang_tua" ON public.pendaftaran_orang_tua;
DROP POLICY IF EXISTS "Admin can update pendaftaran_orang_tua" ON public.pendaftaran_orang_tua;

-- Persetujuan akun hanya untuk admin, jadi di sini is_admin(), bukan is_staff().
CREATE POLICY "Users can insert own pendaftaran_guru" ON public.pendaftaran_guru
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Users can read own pendaftaran_guru" ON public.pendaftaran_guru
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admin can update pendaftaran_guru" ON public.pendaftaran_guru
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users can insert own pendaftaran_orang_tua" ON public.pendaftaran_orang_tua
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Users can read own pendaftaran_orang_tua" ON public.pendaftaran_orang_tua
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admin can update pendaftaran_orang_tua" ON public.pendaftaran_orang_tua
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_pendaftaran_orang_tua_santri
  ON public.pendaftaran_orang_tua(santri_id);

-- ============================================
-- LANGKAH 6: POLICY pendaftaran MEMAKAI is_staff()
-- ============================================
-- Isi aturannya sama seperti sebelumnya, hanya cara membaca role yang berubah:
-- dari EXISTS ke users_profile menjadi pemanggilan fungsi SECURITY DEFINER.
-- Tabel pendaftaran lama beserta kolomnya tidak diubah sama sekali.
DROP POLICY IF EXISTS "Allow staff read pendaftaran" ON public.pendaftaran;
DROP POLICY IF EXISTS "Allow staff update pendaftaran" ON public.pendaftaran;
DROP POLICY IF EXISTS "Allow staff delete pendaftaran" ON public.pendaftaran;

CREATE POLICY "Allow staff read pendaftaran" ON public.pendaftaran
  FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY "Allow staff update pendaftaran" ON public.pendaftaran
  FOR UPDATE TO authenticated USING (public.is_staff());

CREATE POLICY "Allow staff delete pendaftaran" ON public.pendaftaran
  FOR DELETE TO authenticated USING (public.is_staff());

-- ============================================
-- LANGKAH 7: FUNGSI PENCARIAN SANTRI
-- ============================================
CREATE OR REPLACE FUNCTION public.search_santri(keyword TEXT)
RETURNS TABLE (id UUID, nama TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT s.id, s.nama::text
  FROM public.santri s
  WHERE length(btrim(keyword)) >= 3
    AND s.status = 'aktif'
    AND s.nama ILIKE '%' || replace(replace(btrim(keyword), '%', '\%'), '_', '\_') || '%' ESCAPE '\'
  ORDER BY s.nama
  LIMIT 20;
$$;

REVOKE EXECUTE ON FUNCTION public.search_santri(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_santri(TEXT) TO authenticated;

-- ============================================
-- VERIFIKASI SETELAH MIGRASI
-- ============================================
-- 1. Sebaran role dan status. Pastikan akun admin Anda berstatus approved.
SELECT role, status, count(*) FROM public.users_profile GROUP BY role, status ORDER BY role, status;

-- 2. Policy yang aktif pada tabel yang tersentuh.
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users_profile', 'pendaftaran', 'pendaftaran_guru', 'pendaftaran_orang_tua')
ORDER BY tablename, policyname;

-- 3. Fungsi yang seharusnya SECURITY DEFINER (kolom prosecdef harus true).
SELECT proname, prosecdef
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('current_user_role', 'is_admin', 'is_staff', 'search_santri',
                  'handle_new_user', 'guard_users_profile_role')
ORDER BY proname;
