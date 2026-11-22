import { redirect } from 'next/navigation';

// Pendaftaran akun lewat formulir dibatalkan. Penggantinya alur Masuk dengan Google
// yang dikerjakan terpisah, jadi halaman ini hanya mengalihkan ke halaman masuk.
export default function RegisterPage() {
    redirect('/auth/login');
}
