// Validasi dan normalisasi isian formulir yang dipakai lebih dari satu halaman.
// Berkas ini dinamai validation, bukan phone, karena isinya bukan hanya nomor HP.

// Terima 08xx, 8xx, 628xx, dan +628xx, lalu simpan seragam sebagai E.164.
// Mengembalikan null kalau nomornya tidak masuk akal sebagai nomor HP Indonesia.
export function normalizePhone(raw: string): string | null {
    const digits = raw.replace(/\D/g, '');

    let national = digits;
    if (national.startsWith('62')) {
        national = national.slice(2);
    } else if (national.startsWith('0')) {
        national = national.slice(1);
    }

    const normalized = `+62${national}`;
    return /^\+628\d{8,11}$/.test(normalized) ? normalized : null;
}

export function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
