'use client';

import { AuthProvider } from '@/context/AuthContext';
import RequireAccount from '@/components/RequireAccount';

// Gerbang yang sama dengan halaman admin, hanya daftar role-nya yang berbeda.
// Admin ikut diizinkan supaya halaman portal bisa mengalihkannya ke dashboard.
export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <RequireAccount allowedRoles={['admin', 'guru', 'orang_tua']}>
                {children}
            </RequireAccount>
        </AuthProvider>
    );
}
