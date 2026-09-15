# CLAUDE.md

File ini memberi panduan untuk Claude Code (claude.ai/code) saat bekerja dengan kode di repositori ini.

## Perintah

```bash
npm run dev      # next dev (Turbopack) -> http://localhost:3000
npm run build    # next build
npm start        # menjalankan hasil build produksi
npm run lint     # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

Tidak ada test framework yang dikonfigurasi — tidak ada test yang bisa dijalankan.

`next build` (Next 16 / Turbopack) **tidak** menjalankan ESLint, dan `npm run lint` saat ini gagal karena
error yang sudah ada sebelumnya (tanda `'` yang tidak di-escape di `player/page.tsx` + `ClassSelection.tsx`,
serta error `react-hooks/purity` pada `Math.random()` di `AudioPlayer.tsx`) plus sekitar 17 warning. Nilai
perubahanmu dari *selisihnya*, bukan dari exit code yang bersih.

## Environment

`.env.local` di root repo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

`src/lib/supabase.ts` jatuh ke fallback `https://placeholder.supabase.co` kalau kedua variabel ini tidak ada,
jadi environment yang salah konfigurasi **tidak** membuat aplikasi crash — dia diam-diam menghasilkan list
kosong dan error fetch di console. Curigai env lebih dulu kalau semua halaman tampil tapi tidak ada data
yang muncul.

Setup backend ada di `supabase-schema.sql` (tabel, RLS, `users_profile` + trigger signup, index). File ini
tidak diterapkan oleh tooling migrasi apa pun: mengubah skema berarti mengedit file tersebut *dan*
menjalankan SQL-nya secara manual di Supabase SQL Editor. Audio butuh Storage bucket publik bernama
`recordings` (batas 50MB).

## Arsitektur

Next.js 16 App Router + React 19, TypeScript strict, Tailwind v4 (CSS-first: tidak ada `tailwind.config`,
lihat `@theme inline` di `src/app/globals.css`), Supabase untuk DB/Auth/Storage. Path alias `@/*` → `src/*`.

**Hampir semuanya client component.** Hanya `src/app/layout.tsx` dan `src/app/page.tsx` yang server
component; semua pemuatan data terjadi di `useEffect` di browser. Jangan berasumsi pola server-side
fetching berlaku di sini.

### Dua jalur akses data (disengaja, keduanya dipakai)

- **Recordings** lewat route handler: `src/app/api/recordings/route.ts` dan `[id]/route.ts`.
- **Santri / pendaftaran / berita / pengurus / auth** memanggil `supabase` langsung dari client component
  (`src/app/admin/*/page.tsx`, `src/components/home/BeritaCarousel.tsx`, `src/context/AuthContext.tsx`).

Kedua jalur memakai anon key publik yang sama, dan setiap policy di `supabase-schema.sql` bernilai
`USING (true)` untuk read *maupun* write. Kontrol akses saat ini hanya di sisi klien
(`src/components/AdminAuth.tsx`); route API tidak mengautentikasi apa pun. Anggap semua perilaku
"admin-only" sebagai penguncian UI, bukan penegakan aturan.

### Auth dan role

`src/context/AuthContext.tsx` membungkus Supabase auth dan melakukan join ke `users_profile` untuk
mengekspos `role: 'admin' | 'guru' | 'guest'` plus `isAdmin` / `isGuru` / `canAccessAdmin`. Trigger DB
membuat setiap pendaftar baru sebagai `guest`, jadi akun harus dinaikkan role-nya secara manual di Supabase
sebelum `/admin` bisa dibuka.

`AuthProvider` dipasang **per route group** (`src/app/admin/layout.tsx`, `src/app/auth/layout.tsx`), bukan di
root — `useAuth()` akan throw di luar tree tersebut, dan landing page tidak punya auth context. `AdminAuth`
menunggu `loading || profileLoading` sebelum melakukan redirect; melewatkan salah satu flag itu menyebabkan
redirect berkedip ke `/auth/login` saat halaman di-refresh.

### Siklus hidup recording (invariant yang tidak kelihatan)

Persis satu recording yang `is_active` **di seluruh tabel**: `POST /api/recordings` mengarsipkan semua baris
aktif sebelum menyisipkan yang baru. `PUT /api/recordings/[id]` bersifat overload berdasarkan bentuk body —
`{ increment_play_count: true }`, `{ restore: true }` (mengarsipkan semua, lalu mengaktifkan yang ini), selain
itu update kolom biasa. `DELETE` menurunkan nama object storage dari segmen path terakhir `file_url`, yang
hanya bekerja karena file upload dinamai `${Date.now()}-${sanitized-name}` di `uploadAudioFile`.

Karena pengarsipan bersifat global sementara `/player` memfilter berdasarkan `kelas` + `mangkulan` lebih dulu,
tampilan yang terfilter jatuh ke `filtered[0]` kalau tidak ada yang aktif dalam kombinasi tersebut. Jadi
menerbitkan recording *cepatan/quran* akan menonaktifkan yang *lambatan/hadits*.

`duration` disimpan sebagai string dalam dua format historis; selalu render lewat `formatDurationDisplay()`
(`src/lib/types.ts`), yang menormalkan format lama `mm:ss` menjadi `h:mm:ss`.

### Landing page

`src/app/page.tsx` menyusun `Navbar` → `Hero` → section-section yang diekspor dari
`src/components/home/InfoSections.tsx` (`AboutSection`, `ProgramSection`, `FacilitiesSection`,
`GallerySection`, `ContactSection`) → `BeritaCarousel` → `Footer`.

Tiga hal harus tetap sinkron saat menambah atau mengurutkan ulang section: `id` pada `<section>`, array
`navLinks` di `src/components/layout/Navbar.tsx`, dan nilai offset — `NAVBAR_HEIGHT = 80` di Navbar serta
`scroll-padding-top: 80px` di `globals.css`. IntersectionObserver milik Navbar memilih section terlihat dengan
`offsetTop` terkecil untuk di-highlight, jadi id section yang tidak ditemukan akan mati begitu saja.

Teks landing page, daftar kampus, dan foto galeri adalah array yang di-hardcode di dalam `InfoSections.tsx` /
`Hero.tsx`; hanya *berita* yang berasal dari database.

### Dua generasi UI admin

- Sekarang: `/admin`, `/admin/santri`, `/admin/pendaftaran`, `/admin/berita`, `/admin/pengurus` — shell
  sidebar emerald dari `src/app/admin/layout.tsx`, `src/components/admin/Sidebar.tsx`, `AdminHeader` sebagai
  named export dari `src/components/admin/Header.tsx`, ikon lucide, panggilan Supabase langsung.
- Lama: `/admin/recordings` — punya `AdminAuth` sendiri plus `src/components/AdminHeader.tsx` yang *berbeda*
  (default export), dan menjalankan semuanya lewat route API.

Perhatikan ada dua komponen `AdminHeader` yang berbeda; impor yang benar. `src/components/TabNavigation.tsx`
dan `src/components/ui/GlassCard.tsx` saat ini tidak terpakai. Layar recordings versi lama
(`AdminHeader.tsx`, `RecordingList.tsx`, `RecordingUpload.tsx`, `admin/recordings/page.tsx`) merender ikon
Font Awesome `<i className="fas fa-...">`, padahal tidak ada stylesheet Font Awesome yang dimuat di mana pun —
ikon-ikon itu tidak terlihat. Gunakan `lucide-react` untuk pekerjaan baru.

## Konvensi dan hal yang perlu diwaspadai

- Semua teks yang dilihat pengguna berbahasa Indonesia. String UI baru juga harus begitu.
- Pembagian visual per area: landing page bernuansa hijau gelap + glassmorphism (`gradient-dark`,
  `.glass-card`, `islamic-pattern` di `globals.css`, animasi masuk `framer-motion`); admin dan player
  memakai `bg-gray-100` terang dengan aksen emerald/hijau.
- `globals.css` memaksa override `input/textarea/select` menjadi teks gelap di atas putih dengan
  `!important`. Menata gaya field form berarti melawan aturan itu, bukan sekadar menambah class Tailwind.
- `<img>` dipakai secara sengaja untuk gambar galeri/berita (tidak ada remote pattern `next/image` yang
  dikonfigurasi); warning lint yang muncul memang diharapkan.
- Path gambar di `public/img/` tidak cocok casing-nya dengan kode di beberapa tempat (kode meminta
  `/img/23.jpg` dan `/img/polman.png`; file-nya bernama `23.JPG` dan `Polman.png`). Ini bekerja di Windows
  dan menghasilkan 404 di host Linux — perbaiki casing-nya saat menyentuh referensi tersebut.
- Ada `package-lock.json` nyasar di direktori induk yang membuat Next mencetak warning "workspace root" di
  setiap build; ini tidak berbahaya di sini.
- `.vscode/mcp.json` mendaftarkan MCP server shadcn dan `components.json` menambahkan registry `@react-bits`,
  tetapi project ini belum punya setup `ui/` shadcn — `components.json` tidak punya konfigurasi tailwind/alias,
  jadi perintah generator perlu bagian itu diisi lebih dulu.