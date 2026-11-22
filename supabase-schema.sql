-- PPM Complete Database Schema
-- Run this SQL in your Supabase SQL Editor
--
-- URUTAN PENTING: blok USERS PROFILE harus tetap berada paling atas, karena
-- fungsi pembantu role dan policy di bawahnya membaca tabel itu. Kalau blok ini
-- dipindah ke bawah, menjalankan berkas ini di database kosong akan gagal dengan
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
-- PERINGATAN: current_user_role() TIDAK memeriksa status akun. Fungsi ini hanya
-- menjawab "role apa", bukan "boleh masuk atau tidak", jadi jangan dipakai
-- sendirian sebagai gerbang izin. Untuk gerbang izin pakai is_admin() atau
-- is_staff(), yang juga mensyaratkan status = 'approved'.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.users_profile WHERE id = auth.uid();
$$;

-- is_admin() dan is_staff() adalah gerbang izin: keduanya mensyaratkan akun
-- berstatus approved, supaya akun pending atau rejected tidak lolos policy RLS.
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
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE berita ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengurus ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to run multiple times)
DROP POLICY IF EXISTS "Allow public read recordings" ON recordings;
DROP POLICY IF EXISTS "Allow public read santri" ON santri;
DROP POLICY IF EXISTS "Allow public read berita" ON berita;
DROP POLICY IF EXISTS "Allow public read pengurus" ON pengurus;

DROP POLICY IF EXISTS "Allow public insert recordings" ON recordings;
DROP POLICY IF EXISTS "Allow public update recordings" ON recordings;
DROP POLICY IF EXISTS "Allow public delete recordings" ON recordings;

DROP POLICY IF EXISTS "Allow public insert santri" ON santri;
DROP POLICY IF EXISTS "Allow public update santri" ON santri;
DROP POLICY IF EXISTS "Allow public delete santri" ON santri;

DROP POLICY IF EXISTS "Allow public insert berita" ON berita;
DROP POLICY IF EXISTS "Allow public update berita" ON berita;
DROP POLICY IF EXISTS "Allow public delete berita" ON berita;

DROP POLICY IF EXISTS "Allow public insert pengurus" ON pengurus;
DROP POLICY IF EXISTS "Allow public update pengurus" ON pengurus;
DROP POLICY IF EXISTS "Allow public delete pengurus" ON pengurus;

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

CREATE POLICY "Allow public insert berita" ON berita FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update berita" ON berita FOR UPDATE USING (true);
CREATE POLICY "Allow public delete berita" ON berita FOR DELETE USING (true);

CREATE POLICY "Allow public insert pengurus" ON pengurus FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update pengurus" ON pengurus FOR UPDATE USING (true);
CREATE POLICY "Allow public delete pengurus" ON pengurus FOR DELETE USING (true);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_santri_status ON santri(status);
CREATE INDEX IF NOT EXISTS idx_santri_angkatan ON santri(angkatan);
CREATE INDEX IF NOT EXISTS idx_berita_status ON berita(status);
CREATE INDEX IF NOT EXISTS idx_berita_published_at ON berita(published_at DESC);
