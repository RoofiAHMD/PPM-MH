import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';

// Menutup modal saat tombol Escape ditekan atau saat area gelap di luar modal diklik.
// Mengembalikan props untuk elemen backdrop: <div className="fixed inset-0 ..." {...props}>.
export function useModalDismiss(isOpen: boolean, onClose: () => void) {
    // Selalu memakai onClose terbaru tanpa memasang ulang listener Escape di setiap render.
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Klik backdrop hanya menutup kalau tekan dan lepas sama-sama terjadi di backdrop.
    // Tanpa ini, menyeret seleksi teks dari dalam form lalu melepasnya di luar modal
    // ikut terhitung sebagai klik backdrop dan menutup modal beserta isiannya.
    const pressedOnBackdrop = useRef(false);

    return {
        onMouseDown: (e: MouseEvent<HTMLDivElement>) => {
            pressedOnBackdrop.current = e.target === e.currentTarget;
        },
        onClick: (e: MouseEvent<HTMLDivElement>) => {
            if (pressedOnBackdrop.current && e.target === e.currentTarget) onCloseRef.current();
            pressedOnBackdrop.current = false;
        },
    };
}
