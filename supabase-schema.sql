-- PPM Complete Database Schema
-- Run this SQL in your Supabase SQL Editor

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
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendaftaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE berita ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengurus ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Allow public insert pendaftaran" ON pendaftaran
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow staff read pendaftaran" ON pendaftaran
  FOR SELECT TO authenticated USING (
    exists (
      select 1 from users_profile
      where users_profile.id = auth.uid()
        and users_profile.role in ('admin', 'guru')
    )
  );

CREATE POLICY "Allow staff update pendaftaran" ON pendaftaran
  FOR UPDATE TO authenticated USING (
    exists (
      select 1 from users_profile
      where users_profile.id = auth.uid()
        and users_profile.role in ('admin', 'guru')
    )
  );

CREATE POLICY "Allow staff delete pendaftaran" ON pendaftaran
  FOR DELETE TO authenticated USING (
    exists (
      select 1 from users_profile
      where users_profile.id = auth.uid()
        and users_profile.role in ('admin', 'guru')
    )
  );

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
CREATE INDEX IF NOT EXISTS idx_pendaftaran_status ON pendaftaran(status);
CREATE INDEX IF NOT EXISTS idx_berita_status ON berita(status);
CREATE INDEX IF NOT EXISTS idx_berita_published_at ON berita(published_at DESC);

-- ============================================
-- USERS PROFILE TABLE (for role-based auth)
-- ============================================
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nama TEXT,
  role TEXT DEFAULT 'guest' CHECK (role IN ('admin', 'guru', 'guest')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for users_profile
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users_profile;
DROP POLICY IF EXISTS "Allow public read users_profile" ON users_profile;

-- Policies for users_profile
CREATE POLICY "Allow public read users_profile" ON users_profile FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users_profile FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow insert for authenticated users" ON users_profile FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, nama, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'nama', 'guest');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for users_profile
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON users_profile(role);
