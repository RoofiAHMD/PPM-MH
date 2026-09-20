-- PPM Complete Database Schema
-- Run this SQL in your Supabase SQL Editor
--
-- URUTAN PENTING: blok USERS PROFILE harus tetap berada paling atas.
-- Policy tabel pendaftaran merujuk users_profile, jadi tabel itu harus sudah
-- terbentuk lebih dulu. Kalau blok ini dipindah ke bawah, menjalankan berkas
-- ini di database kosong akan gagal dengan
-- ERROR 42P01: relation "users_profile" does not exist
--
-- Fungsi pembantu role (current_user_role, is_admin, is_staff) juga harus lahir
-- sebelum policy mana pun yang memanggilnya, karena PostgreSQL mengurai isi
-- policy pada saat policy dibuat.

-- ============================================
-- USERS PROFILE TABLE (for role-based auth)
-- ============================================
-- role menjawab "dia siapa", status menjawab "sudah boleh masuk atau belum".
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nama TEXT,
  role TEXT DEFAULT 'guest' CHECK (role IN ('admin', 'guru', 'orang_tua', 'santri', 'guest')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROLE HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================
-- Policy yang membaca users_profile dari dalam policy users_profile sendiri akan
-- gagal dengan ERROR 42P17 infinite recursion. Fungsi SECURITY DEFINER berjalan
-- sebagai pemilik fungsi dan melewati RLS, jadi aman dipakai di policy mana pun,
-- termasuk pada tabel users_profile itu sendiri.
-- SET search_path wajib ada supaya fungsi tidak bisa dibajak lewat search_path.
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

-- Enable RLS for users_profile
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users_profile;
DROP POLICY IF EXISTS "Allow public read users_profile" ON users_profile;
DROP POLICY IF EXISTS "Admin can update all profiles" ON users_profile;

-- Policies for users_profile
-- Baris sendiri untuk setiap user, seluruh tabel hanya untuk admin. Sebelumnya
-- SELECT memakai USING (true), artinya email dan status semua orang terbaca siapa pun.
CREATE POLICY "Users can read own profile" ON users_profile
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile" ON users_profile
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Admin can update all profiles" ON users_profile
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Allow insert for authenticated users" ON users_profile
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Penjaga kolom role dan status.
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
    -- Baris ini normalnya dibuat oleh handle_new_user, yang sudah menyaring role.
    NEW.role := COALESCE(NEW.role, 'guest');
    NEW.status := 'pending';
  ELSE
    NEW.role := OLD.role;
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_users_profile_role_trigger ON users_profile;
CREATE TRIGGER guard_users_profile_role_trigger
  BEFORE INSERT OR UPDATE ON users_profile
  FOR EACH ROW EXECUTE FUNCTION public.guard_users_profile_role();

-- Function to auto-create profile on user signup
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
    -- raw_user_meta_data dikirim dari browser saat signup, jadi tidak tepercaya.
    -- Hanya tiga role ini yang boleh diminta sendiri; 'admin' tidak pernah.
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

-- Trigger for auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for users_profile
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON users_profile(role);
CREATE INDEX IF NOT EXISTS idx_users_profile_status ON users_profile(status);

-- ============================================
-- RECORDINGS TABLE (existing)
-- ============================================
CREATE TABLE IF NOT EXISTS recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  speaker VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  kelas VARCHAR(20) NOT NULL DEFAULT 'cepatan',
  mangkulan VARCHAR(20) NOT NULL DEFAULT 'quran',
  description TEXT,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  duration VARCHAR(20),
  play_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SANTRI TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS santri (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  nis VARCHAR(20) UNIQUE NOT NULL,
  kampus VARCHAR(255) NOT NULL,
  angkatan INTEGER NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  alamat TEXT,
  photo_url TEXT,
  status VARCHAR(20) DEFAULT 'aktif', -- 'aktif', 'alumni', 'cuti'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PENDAFTARAN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pendaftaran (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  jenis_kelamin VARCHAR(10) NOT NULL CHECK (jenis_kelamin IN ('putra','putri')),
  kampus VARCHAR(255) NOT NULL,
  jurusan VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  alamat TEXT,
  motivasi TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BERITA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS berita (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  category VARCHAR(50) DEFAULT 'umum', -- 'umum', 'kajian', 'prestasi', 'pengumuman'
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published'
  published_at TIMESTAMP WITH TIME ZONE,
  author_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PENGURUS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pengurus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  jabatan VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  photo_url TEXT,
  periode VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PENDAFTARAN GURU TABLE
-- ============================================
-- Detail pendaftaran akun untuk role 'guru'. id-nya adalah id akun itu sendiri.
-- Nama dan email sengaja TIDAK diduplikasi di sini; keduanya sudah ada di
-- users_profile, dan dua sumber kebenaran pasti menyimpang.
-- Tabel ini harus berada di bawah users_profile karena merujuknya.
CREATE TABLE IF NOT EXISTS pendaftaran_guru (
  id UUID PRIMARY KEY REFERENCES users_profile(id) ON DELETE CASCADE,
  nik VARCHAR(16) NOT NULL UNIQUE CHECK (nik ~ '^[0-9]{16}$'),
  alamat_asal TEXT NOT NULL,
  tempat_lahir VARCHAR(255) NOT NULL,
  tanggal_lahir DATE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  jenis_kelamin VARCHAR(20) NOT NULL CHECK (jenis_kelamin IN ('laki-laki', 'perempuan')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PENDAFTARAN ORANG TUA TABLE
-- ============================================
-- Tabel ini merujuk users_profile dan santri, jadi harus berada di bawah keduanya.
-- nomor_kk sengaja tidak UNIQUE: ayah dan ibu berbagi satu nomor kartu keluarga.
CREATE TABLE IF NOT EXISTS pendaftaran_orang_tua (
  id UUID PRIMARY KEY REFERENCES users_profile(id) ON DELETE CASCADE,
  nomor_kk VARCHAR(16) NOT NULL CHECK (nomor_kk ~ '^[0-9]{16}$'),
  kota_asal VARCHAR(255) NOT NULL,
  alamat_sambung TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  jenis_kelamin VARCHAR(20) NOT NULL CHECK (jenis_kelamin IN ('laki-laki', 'perempuan')),
  peran VARCHAR(10) NOT NULL CHECK (peran IN ('ayah', 'ibu', 'wali')),
  santri_id UUID REFERENCES santri(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendaftaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE berita ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengurus ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendaftaran_guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendaftaran_orang_tua ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to run multiple times)
DROP POLICY IF EXISTS "Allow public read recordings" ON recordings;
DROP POLICY IF EXISTS "Allow public read santri" ON santri;
DROP POLICY IF EXISTS "Allow public read pendaftaran" ON pendaftaran;
DROP POLICY IF EXISTS "Allow public read berita" ON berita;
DROP POLICY IF EXISTS "Allow public read pengurus" ON pengurus;

DROP POLICY IF EXISTS "Allow public insert recordings" ON recordings;
DROP POLICY IF EXISTS "Allow public update recordings" ON recordings;
DROP POLICY IF EXISTS "Allow public delete recordings" ON recordings;

DROP POLICY IF EXISTS "Allow public insert santri" ON santri;
DROP POLICY IF EXISTS "Allow public update santri" ON santri;
DROP POLICY IF EXISTS "Allow public delete santri" ON santri;

DROP POLICY IF EXISTS "Allow public insert pendaftaran" ON pendaftaran;
DROP POLICY IF EXISTS "Allow public update pendaftaran" ON pendaftaran;
DROP POLICY IF EXISTS "Allow public delete pendaftaran" ON pendaftaran;
DROP POLICY IF EXISTS "Allow staff read pendaftaran" ON pendaftaran;
DROP POLICY IF EXISTS "Allow staff update pendaftaran" ON pendaftaran;
DROP POLICY IF EXISTS "Allow staff delete pendaftaran" ON pendaftaran;

DROP POLICY IF EXISTS "Allow public insert berita" ON berita;
DROP POLICY IF EXISTS "Allow public update berita" ON berita;
DROP POLICY IF EXISTS "Allow public delete berita" ON berita;

DROP POLICY IF EXISTS "Allow public insert pengurus" ON pengurus;
DROP POLICY IF EXISTS "Allow public update pengurus" ON pengurus;
DROP POLICY IF EXISTS "Allow public delete pengurus" ON pengurus;

DROP POLICY IF EXISTS "Users can insert own pendaftaran_guru" ON pendaftaran_guru;
DROP POLICY IF EXISTS "Users can read own pendaftaran_guru" ON pendaftaran_guru;
DROP POLICY IF EXISTS "Admin can update pendaftaran_guru" ON pendaftaran_guru;

DROP POLICY IF EXISTS "Users can insert own pendaftaran_orang_tua" ON pendaftaran_orang_tua;
DROP POLICY IF EXISTS "Users can read own pendaftaran_orang_tua" ON pendaftaran_orang_tua;
DROP POLICY IF EXISTS "Admin can update pendaftaran_orang_tua" ON pendaftaran_orang_tua;

-- Public read policies
CREATE POLICY "Allow public read recordings" ON recordings FOR SELECT USING (true);
CREATE POLICY "Allow public read santri" ON santri FOR SELECT USING (true);
CREATE POLICY "Allow public read berita" ON berita FOR SELECT USING (true);
CREATE POLICY "Allow public read pengurus" ON pengurus FOR SELECT USING (true);

-- Public write policies (for development - restrict in production)
CREATE POLICY "Allow public insert recordings" ON recordings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update recordings" ON recordings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete recordings" ON recordings FOR DELETE USING (true);

CREATE POLICY "Allow public insert santri" ON santri FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update santri" ON santri FOR UPDATE USING (true);
CREATE POLICY "Allow public delete santri" ON santri FOR DELETE USING (true);

-- Pendaftaran: formulir publik boleh mengirim, tapi hanya admin/guru yang boleh
-- membaca dan mengelola. Karena anon tidak punya hak SELECT, kode yang melakukan
-- insert TIDAK boleh merantai .select() — barisnya tersimpan tapi responsnya error.
-- Cek role memakai is_staff() supaya tidak membaca users_profile dari dalam policy.
CREATE POLICY "Allow public insert pendaftaran" ON pendaftaran
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow staff read pendaftaran" ON pendaftaran
  FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY "Allow staff update pendaftaran" ON pendaftaran
  FOR UPDATE TO authenticated USING (public.is_staff());

CREATE POLICY "Allow staff delete pendaftaran" ON pendaftaran
  FOR DELETE TO authenticated USING (public.is_staff());

CREATE POLICY "Allow public insert berita" ON berita FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update berita" ON berita FOR UPDATE USING (true);
CREATE POLICY "Allow public delete berita" ON berita FOR DELETE USING (true);

CREATE POLICY "Allow public insert pengurus" ON pengurus FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update pengurus" ON pengurus FOR UPDATE USING (true);
CREATE POLICY "Allow public delete pengurus" ON pengurus FOR DELETE USING (true);

-- Tabel detail pendaftaran akun: pendaftar menyisipkan dan membaca barisnya
-- sendiri, admin membaca dan mengubah semua. Persetujuan akun hanya untuk admin,
-- jadi di sini memakai is_admin(), bukan is_staff().
CREATE POLICY "Users can insert own pendaftaran_guru" ON pendaftaran_guru
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Users can read own pendaftaran_guru" ON pendaftaran_guru
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admin can update pendaftaran_guru" ON pendaftaran_guru
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users can insert own pendaftaran_orang_tua" ON pendaftaran_orang_tua
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Users can read own pendaftaran_orang_tua" ON pendaftaran_orang_tua
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admin can update pendaftaran_orang_tua" ON pendaftaran_orang_tua
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- SEARCH SANTRI (untuk dropdown orang tua)
-- ============================================
-- Sengaja tidak mengembalikan daftar utuh: minimal tiga huruf, maksimal 20 baris,
-- hanya santri berstatus aktif. SECURITY DEFINER supaya tetap bekerja setelah
-- policy SELECT santri dikencangkan nanti.
-- Karakter % dan _ pada kata kunci di-escape supaya tidak dipakai sebagai wildcard.
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
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_santri_status ON santri(status);
CREATE INDEX IF NOT EXISTS idx_santri_angkatan ON santri(angkatan);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_status ON pendaftaran(status);
CREATE INDEX IF NOT EXISTS idx_berita_status ON berita(status);
CREATE INDEX IF NOT EXISTS idx_berita_published_at ON berita(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_orang_tua_santri ON pendaftaran_orang_tua(santri_id);
