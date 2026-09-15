'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/logSupabaseError';
import { Berita } from '@/lib/types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function BeritaCarousel() {
    const [beritaList, setBeritaList] = useState<Berita[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBerita() {
            try {
                const { data, error } = await supabase
                    .from('berita')
                    .select('*')
                    .eq('status', 'published')
                    .order('published_at', { ascending: false })
                    .limit(6);

                if (error) throw error;
                setBeritaList(data || []);
            } catch (error) {
                logSupabaseError('Error fetching berita:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchBerita();
    }, []);

    if (loading) {
        return (
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center">
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-emerald-100 rounded w-32 mx-auto" />
                            <div className="h-8 bg-gray-100 rounded w-48 mx-auto" />
                            <div className="h-64 bg-gray-100 rounded-2xl" />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (beritaList.length === 0) {
        return null;
    }

    return (
        <section id="berita" className="py-20 bg-white relative overflow-hidden">
            {/* Islamic pattern very faint */}
            <div className="absolute inset-0 islamic-pattern opacity-[0.025]" />
            {/* Top/bottom border */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 relative">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    {/* Ornament */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-400" />
                        <span className="text-emerald-500 text-lg select-none">❋</span>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-400" />
                    </div>
                    <span className="inline-block px-4 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-sm font-medium mb-4 tracking-wide">
                        Berita & Aktivitas
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        Kegiatan Terbaru
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Ikuti perkembangan kegiatan dan aktivitas di PPM Minhajul Haq
                    </p>
                </motion.div>

                {/* Main Carousel */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <Swiper
                        modules={[Autoplay, Pagination, Navigation]}
                        spaceBetween={24}
                        slidesPerView={1}
                        pagination={{
                            clickable: true,
                            dynamicBullets: true,
                        }}
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                        }}
                        breakpoints={{
                            640: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 },
                        }}
                        className="berita-swiper pb-12"
                    >
                        {beritaList.map((berita, index) => (
                            <SwiperSlide key={berita.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300"
                                >
                                    {/* Image */}
                                    <div className="relative h-48 overflow-hidden">
                                        {berita.image_url ? (
                                            <img
                                                src={berita.image_url}
                                                alt={berita.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                                                <span className="text-6xl">📰</span>
                                            </div>
                                        )}
                                        {/* Soft overlay at bottom */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />

                                        {/* Category Badge */}
                                        <span className="absolute top-4 left-4 px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full capitalize shadow-sm">
                                            {berita.category}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                                            <Calendar size={14} className="text-emerald-500" />
                                            <span>
                                                {new Date(berita.published_at || berita.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                                            {berita.title}
                                        </h3>

                                        <p className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed">
                                            {berita.excerpt || berita.content.substring(0, 120)}...
                                        </p>

                                        <Link
                                            href={`#berita-${berita.id}`}
                                            className="inline-flex items-center gap-2 text-emerald-600 text-sm font-medium hover:text-emerald-700 transition-colors group/link"
                                        >
                                            Baca Selengkapnya
                                            <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </motion.div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </motion.div>

                {/* View All Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-4"
                >
                    <Link
                        href="#semua-berita"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-all font-medium"
                    >
                        Lihat Semua Berita
                        <ArrowRight size={18} />
                    </Link>
                </motion.div>
            </div>

            {/* Custom Swiper Styles */}
            <style jsx global>{`
                .berita-swiper .swiper-pagination-bullet {
                    background: #d1fae5;
                    opacity: 1;
                    border: 1px solid #6ee7b7;
                }
                .berita-swiper .swiper-pagination-bullet-active {
                    background: #059669;
                    border-color: #059669;
                }
                .berita-swiper .swiper-button-prev,
                .berita-swiper .swiper-button-next {
                    color: #059669;
                    background: rgba(255, 255, 255, 0.95);
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border: 1px solid #d1fae5;
                }
                .berita-swiper .swiper-button-prev:after,
                .berita-swiper .swiper-button-next:after {
                    font-size: 16px;
                    font-weight: bold;
                }
                .berita-swiper .swiper-button-prev:hover,
                .berita-swiper .swiper-button-next:hover {
                    background: #f0fdf4;
                    border-color: #6ee7b7;
                }
            `}</style>
        </section>
    );
}