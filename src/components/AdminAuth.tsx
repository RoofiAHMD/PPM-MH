'use client';

import RequireAccount from '@/components/RequireAccount';

interface AdminAuthProps {
    children: React.ReactNode;
}

// Gerbang halaman admin. Semua layarnya, termasuk pemeriksaan status akun, ada di
// RequireAccount supaya halaman portal memakai gerbang yang sama persis.
export default function AdminAuth({ children }: AdminAuthProps) {
    return <RequireAccount allowedRoles={['admin', 'guru']}>{children}</RequireAccount>;
}
