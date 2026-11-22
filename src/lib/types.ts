export interface Recording {
    id: string;
    title: string;
    speaker: string;
    date: string;
    kelas: string; // 'cepatan' | 'lambatan'
    mangkulan: string; // 'quran' | 'hadits'
    description?: string;
    file_url: string;
    file_name: string;
    file_size?: number;
    duration?: string;
    play_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface RecordingFormData {
    title: string;
    speaker: string;
    date: string;
    kelas: string;
    mangkulan: string;
    description?: string;
}

export const GURU_OPTIONS = [
    { value: 'Pak Asa', label: 'Bp. Asa Nurpriyanto Syahputra' },
    { value: 'Pak Yakub', label: 'Bp. Yakub Maulana Nastain' },
    { value: 'Pak Hilal', label: 'Bp. Mohamad Hilal' },
] as const;

export const KELAS_OPTIONS = [
    { value: 'cepatan', label: 'Cepatan' },
    { value: 'lambatan', label: 'Lambatan' },
] as const;

export const MANGKULAN_OPTIONS = [
    { value: 'quran', label: "Al-Qur'an" },
    { value: 'hadits', label: 'Hadits' },
] as const;

export function getGuruLabel(value: string): string {
    const guru = GURU_OPTIONS.find((g) => g.value === value);
    return guru?.label || value;
}

export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Convert stored duration string to hour format for display
// Handles both old format (mm:ss or mmm:ss) and new format (h:mm:ss)
export function formatDurationDisplay(duration: string | undefined): string {
    if (!duration) return '0:00:00';

    const parts = duration.split(':');

    // Already in hour format (h:mm:ss)
    if (parts.length === 3) {
        return duration;
    }

    // Old format (mm:ss or mmm:ss) - convert to hours
    if (parts.length === 2) {
        const totalMins = parseInt(parts[0], 10) || 0;
        const secs = parseInt(parts[1], 10) || 0;
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return '0:00:00';
}

// ============================================
// Santri Types
// ============================================
export interface Santri {
    id: string;
    nama: string;
    nis: string;
    kampus: string;
    angkatan: number;
    phone?: string;
    email?: string;
    alamat?: string;
    photo_url?: string;
    status: 'aktif' | 'alumni' | 'cuti';
    created_at: string;
    updated_at: string;
}

export interface SantriFormData {
    nama: string;
    nis: string;
    kampus: string;
    angkatan: number;
    phone?: string;
    email?: string;
    alamat?: string;
    status: 'aktif' | 'alumni' | 'cuti';
}

// ============================================
// Berita Types
// ============================================
export interface Berita {
    id: string;
    title: string;
    content: string;
    excerpt?: string;
    image_url?: string;
    category: 'umum' | 'kajian' | 'prestasi' | 'pengumuman';
    status: 'draft' | 'published';
    published_at?: string;
    author_id?: string;
    created_at: string;
    updated_at: string;
}

// ============================================
// Pengurus Types
// ============================================
export interface Pengurus {
    id: string;
    nama: string;
    jabatan: string;
    phone?: string;
    email?: string;
    photo_url?: string;
    periode?: string;
    is_active: boolean;
    created_at: string;
}

export const STATUS_SANTRI_OPTIONS = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'alumni', label: 'Alumni' },
    { value: 'cuti', label: 'Cuti' },
] as const;

export const CATEGORY_BERITA_OPTIONS = [
    { value: 'umum', label: 'Umum' },
    { value: 'kajian', label: 'Kajian' },
    { value: 'prestasi', label: 'Prestasi' },
    { value: 'pengumuman', label: 'Pengumuman' },
] as const;

// ============================================
// Akun Types (users_profile)
// ============================================
// role menjawab "dia siapa", status menjawab "sudah boleh masuk atau belum".
export type UserRole = 'admin' | 'guru' | 'orang_tua' | 'santri' | 'guest';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UsersProfile {
    id: string;
    email: string;
    nama: string | null;
    role: UserRole;
    status: UserStatus;
    created_at: string;
    updated_at: string;
}

export const ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin' },
    { value: 'guru', label: 'Guru' },
    { value: 'orang_tua', label: 'Orang Tua' },
    { value: 'santri', label: 'Santri' },
    { value: 'guest', label: 'Guest' },
] as const;

export const STATUS_AKUN_OPTIONS = [
    { value: 'pending', label: 'Menunggu' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
] as const;
