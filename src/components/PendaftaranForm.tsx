'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/logSupabaseError';
import { JENIS_KELAMIN_OPTIONS, PendaftaranFormData } from '@/lib/types';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

type FieldErrors = Partial<Record<keyof PendaftaranFormData, string>>;

const EMPTY_FORM: PendaftaranFormData = {
    nama: '',
    jenis_kelamin: '',
    kampus: '',
    phone: '',
    jurusan: '',
    email: '',
    alamat: '',
    motivasi: '',
};

// Terima 08xx, 8xx, 628xx, dan +628xx, lalu simpan seragam sebagai E.164.
// Mengembalikan null kalau nomornya tidak masuk akal sebagai nomor HP Indonesia.
function normalizePhone(raw: string): string | null {
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

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function PendaftaranForm() {
    const [formData, setFormData] = useState<PendaftaranFormData>(EMPTY_FORM);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitFailed, setSubmitFailed] = useState(false);
    const [submitted, setSubmitted] = useState<{ nama: string; phone: string } | null>(null);

    const update = (field: keyof PendaftaranFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitFailed(false);

        const nextErrors: FieldErrors = {};

        if (!formData.nama.trim()) nextErrors.nama = 'Nama lengkap wajib diisi.';
        if (!formData.jenis_kelamin) nextErrors.jenis_kelamin = 'Pilih salah satu.';
        if (!formData.kampus.trim()) nextErrors.kampus = 'Kampus wajib diisi.';

        const phone = normalizePhone(formData.phone);
        if (!formData.phone.trim()) {
            nextErrors.phone = 'Nomor WhatsApp wajib diisi.';
        } else if (!phone) {
            nextErrors.phone = 'Nomor WhatsApp tidak valid. Contoh: 081234567890.';
        }

        const email = formData.email.trim();
        if (email && !isValidEmail(email)) {
            nextErrors.email = 'Format email tidak valid.';
        }

        setErrors(nextErrors);

        const firstField = Object.keys(nextErrors)[0];
        if (firstField || !phone) {
            if (firstField) {
                document.getElementById(firstField)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
            return;
        }

        setSubmitting(true);

        // Jangan merantai .select() di sini. Policy anon hanya mengizinkan INSERT, jadi
        // membaca balik barisnya menghasilkan error walaupun datanya sudah tersimpan.
        const { error } = await supabase.from('pendaftaran').insert([
            {
                nama: formData.nama.trim(),
                jenis_kelamin: formData.jenis_kelamin,
                kampus: formData.kampus.trim(),
                phone,
                jurusan: formData.jurusan.trim() || null,
                email: email || null,
                alamat: formData.alamat.trim() || null,
                motivasi: formData.motivasi.trim() || null,
                status: 'pending',
            },
        ]);

        setSubmitting(false);

        if (error) {
            // Isian sengaja tidak disentuh supaya tidak hilang saat pengguna mencoba lagi.
            logSupabaseError('Gagal menyimpan pendaftaran:', error);
            setSubmitFailed(true);
            return;
        }

        setSubmitted({ nama: formData.nama.trim(), phone });
    };

    if (submitted) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 sm:p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-5">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Pendaftaran Terkirim</h2>
                <div className="space-y-3 text-gray-600 text-sm sm:text-base leading-relaxed mb-7 text-left sm:text-center">
                    <p>
                        Terima kasih, <span className="font-semibold text-gray-800">{submitted.nama}</span>.
                        Pendaftaran Anda sudah kami terima.
                    </p>
                    <p>
                        Tahap berikutnya adalah <span className="font-semibold text-gray-800">seleksi administrasi</span>.
                        Hasilnya beserta informasi biaya akan kami sampaikan melalui{' '}
                        <span className="font-semibold text-gray-800">WhatsApp</span> ke nomor{' '}
                        <span className="font-semibold text-emerald-700">{submitted.phone}</span>.
                    </p>
                    <p>
                        Mohon pastikan nomor tersebut aktif dan bisa menerima pesan dari nomor yang belum
                        tersimpan di kontak Anda. Untuk sekarang belum ada yang perlu Anda lakukan.
                    </p>
                </div>
                <Link
                    href="/"
                    className="inline-block w-full sm:w-auto px-6 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition"
                >
                    Kembali ke Beranda
                </Link>
            </div>
        );
    }

    const fieldClass = (field: keyof PendaftaranFormData) =>
        `w-full px-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${errors[field] ? 'border-red-400' : 'border-gray-300'
        }`;

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5 sm:p-8 space-y-5"
        >
            {/* Nama */}
            <div>
                <label htmlFor="nama" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                    id="nama"
                    type="text"
                    autoComplete="name"
                    value={formData.nama}
                    onChange={(e) => update('nama', e.target.value)}
                    placeholder="Nama lengkap sesuai KTP"
                    className={fieldClass('nama')}
                />
                {errors.nama && <p className="mt-1.5 text-sm text-red-600">{errors.nama}</p>}
            </div>

            {/* Jenis Kelamin */}
            <div id="jenis_kelamin">
                <span className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Jenis Kelamin <span className="text-red-500">*</span>
                </span>
                <div className="grid grid-cols-2 gap-3">
                    {JENIS_KELAMIN_OPTIONS.map((opt) => {
                        const selected = formData.jenis_kelamin === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => update('jenis_kelamin', opt.value)}
                                className={`py-3 text-base font-semibold rounded-xl border-2 transition ${selected
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-gray-300 bg-white text-gray-600 hover:border-emerald-300'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
                {errors.jenis_kelamin && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.jenis_kelamin}</p>
                )}
            </div>

            {/* Kampus */}
            <div>
                <label htmlFor="kampus" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Kampus <span className="text-red-500">*</span>
                </label>
                <input
                    id="kampus"
                    type="text"
                    value={formData.kampus}
                    onChange={(e) => update('kampus', e.target.value)}
                    placeholder="Contoh: Universitas Pendidikan Indonesia"
                    className={fieldClass('kampus')}
                />
                {errors.kampus && <p className="mt-1.5 text-sm text-red-600">{errors.kampus}</p>}
            </div>

            {/* Jurusan */}
            <div>
                <label htmlFor="jurusan" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Jurusan
                </label>
                <input
                    id="jurusan"
                    type="text"
                    value={formData.jurusan}
                    onChange={(e) => update('jurusan', e.target.value)}
                    placeholder="Contoh: Teknik Informatika"
                    className={fieldClass('jurusan')}
                />
            </div>

            {/* Nomor WhatsApp */}
            <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nomor WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="081234567890"
                    className={fieldClass('phone')}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                    Semua pengumuman dikirim ke nomor ini, jadi pastikan WhatsApp-nya aktif.
                </p>
                {errors.phone && <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="nama@email.com"
                    className={fieldClass('email')}
                />
                {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Alamat */}
            <div>
                <label htmlFor="alamat" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Alamat
                </label>
                <textarea
                    id="alamat"
                    rows={3}
                    value={formData.alamat}
                    onChange={(e) => update('alamat', e.target.value)}
                    placeholder="Alamat tempat tinggal saat ini"
                    className={fieldClass('alamat')}
                />
            </div>

            {/* Motivasi */}
            <div>
                <label htmlFor="motivasi" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Motivasi
                </label>
                <textarea
                    id="motivasi"
                    rows={4}
                    value={formData.motivasi}
                    onChange={(e) => update('motivasi', e.target.value)}
                    placeholder="Ceritakan alasan Anda ingin mondok di PPM Minhajul Haq"
                    className={fieldClass('motivasi')}
                />
            </div>

            {submitFailed && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>
                        Pendaftaran gagal terkirim. Periksa koneksi internet Anda, lalu tekan Kirim
                        Pendaftaran sekali lagi. Isian yang sudah Anda ketik masih tersimpan di halaman ini.
                    </p>
                </div>
            )}

            <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 text-base bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
                {submitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Mengirim...
                    </>
                ) : (
                    'Kirim Pendaftaran'
                )}
            </button>

            <p className="text-xs text-gray-500 text-center">
                Tanda <span className="text-red-500">*</span> menandakan isian wajib.
            </p>
        </form>
    );
}
