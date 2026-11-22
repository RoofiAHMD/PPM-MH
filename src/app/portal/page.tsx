'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_OPTIONS } from '@/lib/types';

export default function PortalPage() {
    const router = useRouter();
    const { user, profile, signOut } = useAuth();

    const isAdmin = profile?.role === 'admin';

    // Admin tidak punya isi di portal; tempatnya di dashboard. Keputusan rute ada di
    // sini, bukan di halaman login, karena role baru diketahui setelah profil termuat.
    useEffect(() => {
        if (isAdmin) {
            router.replace('/admin');
        }
    }, [isAdmin, router]);

    if (isAdmin) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Mengalihkan ke dashboard admin...</p>
                </div>
            </div>
        );
    }

    const nama = profile?.nama?.trim() || user?.email || '';
    const roleLabel = ROLE_OPTIONS.find((opt) => opt.value === profile?.role)?.label ?? '';

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="bg-white shadow-sm">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div>
                            <h1 className="text-base sm:text-lg font-bold text-gray-800">PPM Minhajul Haq</h1>
                            <p className="text-xs text-gray-500">Portal</p>
                        </div>
                        <button
                            onClick={signOut}
                            className="text-sm text-gray-600 hover:text-emerald-700 font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 sm:p-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                        Selamat Datang, {nama}
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base">
                        Akun Anda terdaftar sebagai{' '}
                        <span className="font-semibold text-gray-800">{roleLabel}</span>. Isi halaman ini
                        menyusul.
                    </p>

                    {profile?.role === 'guru' && (
                        <Link
                            href="/admin"
                            className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition"
                        >
                            <LayoutDashboard size={18} />
                            Buka Dashboard
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
