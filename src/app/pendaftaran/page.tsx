import type { Metadata } from 'next';
import Link from 'next/link';
import PendaftaranForm from '@/components/PendaftaranForm';

export const metadata: Metadata = {
    title: 'Pendaftaran Santri Baru - PPM Minhajul Haq',
    description:
        'Formulir pendaftaran calon santri Pondok Pesantren Mahasiswa Minhajul Haq Bandung. Isi data diri dan nomor WhatsApp aktif untuk mengikuti seleksi administrasi.',
};

export default function PendaftaranPage() {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header sendiri, bukan Navbar landing page: seluruh isi navLinks berupa
                anchor ke section yang tidak ada di halaman ini. */}
            <div className="bg-white shadow-sm">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div>
                            <h1 className="text-base sm:text-lg font-bold text-gray-800">PPM Minhajul Haq</h1>
                            <p className="text-xs text-gray-500">Pendaftaran</p>
                        </div>
                        <Link
                            href="/"
                            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                        >
                            Beranda
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                        Pendaftaran Santri Baru
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base">
                        Isi data berikut untuk mendaftar sebagai calon santri PPM Minhajul Haq.
                    </p>
                </div>

                <PendaftaranForm />
            </div>
        </div>
    );
}
