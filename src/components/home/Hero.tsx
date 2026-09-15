'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronDown, GraduationCap, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const bgPhotos = [
    '/img/22.jpg',
    '/img/23.JPG',
    '/img/24.jpg',
    '/img/santri-putra.jpg',
    '/img/santri-putri.jpg',
];

export function Hero() {
    const [current, setCurrent] = useState(0);
    const [transitioning, setTransitioning] = useState(false);

    const goTo = (index: number) => {
        if (transitioning || index === current) return;
        setCurrent(index);
        setTransitioning(true);
        setTimeout(() => setTransitioning(false), 600);
    };

    const goPrev = () => goTo((current - 1 + bgPhotos.length) % bgPhotos.length);
    const goNext = () => goTo((current + 1) % bgPhotos.length);

    useEffect(() => {
        const timer = setInterval(() => {
            goTo((current + 1) % bgPhotos.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [current, transitioning]);

    // Indeks kartu yang ditampilkan: prev, current, next
    const getVisible = () => {
        const prev = (current - 1 + bgPhotos.length) % bgPhotos.length;
        const next = (current + 1) % bgPhotos.length;
        return { prev, current, next };
    };
    const { prev, next } = getVisible();

    return (
        <section
            id="home"
            className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gray-950"
        >
            {/* Soft background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-gray-950 to-gray-950" />
            <div className="absolute inset-0 islamic-pattern opacity-[0.04]" />

            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-1 z-20 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

            {/* ── Content ── */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 pt-24 pb-8">
                <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

                    {/* LEFT — teks */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 text-center lg:text-left"
                    >
                        {/* Ornament */}
                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-5">
                            <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-400" />
                            <span className="text-emerald-400 text-xl select-none">❋</span>
                            <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-400" />
                        </div>

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full mb-6">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-xs text-white/80 font-medium tracking-wide">Pondok Pesantren Mahasiswa</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 leading-tight">
                            <span className="text-white">Selamat Datang di</span>
                            <br />
                            <span className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-300 bg-clip-text text-transparent">
                                PPM Minhajul Haq
                            </span>
                        </h1>

                        <p className="text-white/75 italic mb-3 text-sm md:text-base leading-relaxed">
                            &ldquo;Mencetak Generasi Madani: Sarjana yang Mubaligh, Mubaligh yang Sarjana&rdquo;
                        </p>
                        <p className="text-white/55 text-sm mb-8 leading-relaxed">
                            Kurikulum berbasis Al-Qur&apos;an dan Al-Hadits, dibimbing langsung oleh Ulama ahli
                        </p>

                        {/* CTA */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                            <Link
                                href="/pendaftaran"
                                className="px-7 py-3.5 bg-emerald-600 text-white font-semibold rounded-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <GraduationCap className="w-4 h-4" />
                                Daftar Sekarang
                            </Link>
                            <a
                                href="#profil"
                                className="px-7 py-3.5 bg-white/10 border border-white/25 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <Users className="w-4 h-4" />
                                Pelajari Lebih Lanjut
                            </a>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-3 mt-10">
                            {[
                                { value: '82', label: 'Santri Aktif' },
                                { value: '7', label: 'Dewan Guru' },
                                { value: '5', label: 'Gedung Asrama' },
                                { value: '5+', label: 'Tahun Berdiri' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/8 border border-white/15 rounded-xl py-3 px-2 text-center">
                                    <p className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-emerald-200 bg-clip-text text-transparent">
                                        {stat.value}
                                    </p>
                                    <p className="text-white/50 text-[10px] mt-0.5 leading-tight">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* RIGHT — card carousel */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex-1 w-full max-w-lg lg:max-w-none"
                    >
                        {/* 3-card fan layout */}
                        <div className="relative flex items-center justify-center" style={{ height: '380px' }}>

                            {/* Card PREV — kiri, kecil */}
                            <div
                                className="absolute left-0 cursor-pointer"
                                style={{ width: '45%', zIndex: 1 }}
                                onClick={goPrev}
                            >
                                <div className="rounded-2xl overflow-hidden shadow-xl border border-white/10"
                                    style={{ transform: 'rotate(-4deg) translateX(-10px)', opacity: 0.6, transition: 'all 0.5s ease' }}>
                                    <img
                                        src={bgPhotos[prev]}
                                        alt=""
                                        className="w-full h-52 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/30 rounded-2xl" />
                                </div>
                            </div>

                            {/* Card CURRENT — tengah, besar */}
                            <div
                                className="relative z-10"
                                style={{ width: '62%' }}
                            >
                                <motion.div
                                    key={current}
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    className="rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-400/30"
                                >
                                    <img
                                        src={bgPhotos[current]}
                                        alt=""
                                        className="w-full object-contain bg-black"
                                        style={{ maxHeight: '340px' }}
                                    />
                                    {/* Bottom label */}
                                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl" />
                                </motion.div>

                                {/* Dots */}
                                <div className="flex justify-center gap-1.5 mt-4">
                                    {bgPhotos.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => goTo(i)}
                                            className={`rounded-full transition-all duration-400 ${
                                                i === current
                                                    ? 'w-5 h-1.5 bg-emerald-400'
                                                    : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Card NEXT — kanan, kecil */}
                            <div
                                className="absolute right-0 cursor-pointer"
                                style={{ width: '45%', zIndex: 1 }}
                                onClick={goNext}
                            >
                                <div className="rounded-2xl overflow-hidden shadow-xl border border-white/10"
                                    style={{ transform: 'rotate(4deg) translateX(10px)', opacity: 0.6, transition: 'all 0.5s ease' }}>
                                    <img
                                        src={bgPhotos[next]}
                                        alt=""
                                        className="w-full h-52 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/30 rounded-2xl" />
                                </div>
                            </div>
                        </div>

                        {/* Prev/Next buttons */}
                        <div className="flex justify-center gap-3 mt-2">
                            <button
                                onClick={goPrev}
                                className="p-2.5 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition text-white"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={goNext}
                                className="p-2.5 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition text-white"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
            >
                <a href="#profil" className="flex flex-col items-center text-white/40 hover:text-emerald-400 transition">
                    <span className="text-xs mb-1">Scroll</span>
                    <ChevronDown className="w-5 h-5 animate-bounce" />
                </a>
            </motion.div>
        </section>
    );
}