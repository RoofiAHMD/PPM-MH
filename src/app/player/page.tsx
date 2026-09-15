import { Suspense } from 'react';
import PlayerHeader from '@/components/PlayerHeader';
import PlayerContent from '@/components/PlayerContent';

export default function PlayerPage() {
    return (
        <div className="min-h-screen bg-gray-100">
            <PlayerHeader />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* PlayerContent membaca useSearchParams, dan itu butuh batas Suspense
                    supaya halaman ini tetap bisa di-prerender statis. */}
                <Suspense
                    fallback={<div className="text-center py-16 text-gray-600">Memuat kajian...</div>}
                >
                    <PlayerContent />
                </Suspense>
            </div>
        </div>
    );
}
