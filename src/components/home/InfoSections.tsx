'use client';
import { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    GraduationCap,
    Users,
    CheckCircle,
    Target,
    Lightbulb,
    Heart,
    Building,
    Home,
    DoorOpen,
    Car,
    Building2,
    MapPin,
    Phone,
    Mail,
    Youtube,
    X,
    ZoomIn,
} from 'lucide-react';

// ── Reusable white card ──────────────────────────────────────────────────────
function WhiteCard({
    children,
    delay = 0,
    className = '',
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay }}
            className={`bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all ${className}`}
        >
            {children}
        </motion.div>
    );
}

// ── Section header ornament ──────────────────────────────────────────────────
function SectionOrnament() {
    return (
        <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-400" />
            <span className="text-emerald-500 text-lg select-none">❋</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-400" />
        </div>
    );
}

// ── Daftar kampus ────────────────────────────────────────────────────────────
const kampusList = [
    { nama: 'Institut Teknologi Bandung',               singkatan: 'ITB',          logo: '/img/ITB.png' },
    { nama: 'Universitas Pendidikan Indonesia',         singkatan: 'UPI',          logo: '/img/upi.png' },
    { nama: 'Politeknik Manufaktur Negeri Bandung',     singkatan: 'POLMAN',       logo: '/img/Polman.png' },
    { nama: 'Politeknik Negeri Bandung',                singkatan: 'POLBAN',       logo: '/img/polban.png' },
    { nama: 'Poltekkes Kemenkes Bandung',               singkatan: 'POLTEKKES',    logo: '/img/poltekkes.png' },
    { nama: 'Politeknik Kesejahteraan Sosial',          singkatan: 'POLTEKESOS',   logo: '/img/poltekesos.png' },
    { nama: 'Sekolah Tinggi Teknologi Tekstil',         singkatan: 'STTT',         logo: '/img/sttt.png' },
    { nama: 'Universitas Pasundan',                     singkatan: 'UNPAS',        logo: '/img/unpas.png' },
    { nama: 'Universitas Islam Bandung',                singkatan: 'UNISBA',       logo: '/img/unisba.png' },
    { nama: 'Universitas Logistik & Bisnis Indonesia',  singkatan: 'ULBI',         logo: '/img/ulbi.png' },
    { nama: 'Institut Teknologi Nasional Bandung',      singkatan: 'ITENAS',       logo: '/img/itenas.png' },
    { nama: 'Universitas Komputer Indonesia',           singkatan: 'UNIKOM',       logo: '/img/unikom.png' },
    { nama: 'Universitas Sangga Buana YPKP',            singkatan: 'USB YPKP',     logo: '/img/USB_YPKP_Logo.png' },
    { nama: 'Universitas Terbuka',                      singkatan: 'UT',           logo: '/img/UT.png' },
];

// ── Marquee strip kampus ─────────────────────────────────────────────────────
function KampusMarquee() {
    // Duplikat 3x agar loop seamless
    const items = [...kampusList, ...kampusList, ...kampusList];

    return (
        <div className="relative overflow-hidden">
            {/* Fade kiri & kanan */}
            <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none" />

            <div className="flex gap-6 w-max animate-marquee">
                {items.map((k, i) => (
                    <div
                        key={i}
                        className="flex flex-col items-center gap-4 px-6 py-6 bg-white border border-emerald-100 rounded-3xl shadow-sm hover:shadow-xl hover:border-emerald-400 hover:-translate-y-1 transition-all cursor-default select-none"
                        style={{ minWidth: '220px', maxWidth: '220px' }}
                    >
                        {/* Logo */}
                        <div className="w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center bg-emerald-50 border-2 border-emerald-100 flex-shrink-0">
                            <img
                                src={k.logo}
                                alt={k.singkatan}
                                className="w-full h-full object-contain p-2"
                                onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent && !parent.querySelector('span')) {
                                        const span = document.createElement('span');
                                        span.className = 'text-emerald-600 font-bold text-lg text-center leading-tight';
                                        span.textContent = k.singkatan;
                                        parent.appendChild(span);
                                    }
                                }}
                            />
                        </div>
                        {/* Singkatan / badge */}
                        <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 tracking-wide">
                            {k.singkatan}
                        </span>
                        {/* Nama lengkap */}
                        <p className="text-sm text-gray-700 font-semibold text-center leading-snug">
                            {k.nama}
                        </p>
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(calc(-100% / 3)); }
                }
                .animate-marquee {
                    animation: marquee 45s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
}

// ============================================
// ABOUT SECTION
// ============================================
export function AboutSection() {
    return (
        <section id="profil" className="py-24 relative bg-white">
            <div className="absolute inset-0 islamic-pattern opacity-[0.025]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <SectionOrnament />
                    <span className="text-emerald-600 font-semibold mb-2 block tracking-widest text-sm uppercase">
                        Tentang Kami
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        Profil PPM Minhajul Haq
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Lembaga pendidikan agama Islam yang berlokasi strategis di tengah Kota Bandung
                    </p>
                </motion.div>

                {/* Video Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <div className="bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-md">
                        <div className="aspect-video w-full">
                            <iframe
                                src="https://www.youtube.com/embed/E0k9bXSnx58"
                                title="Video Profil PPM Minhajul Haq"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="rounded-3xl"
                            />
                        </div>
                    </div>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
                    {/* Description */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <p className="text-gray-600 text-lg leading-relaxed">
                            PPM Minhajul Haq adalah lembaga pendidikan agama Islam yang berlokasi strategis
                            di tengah Kota Bandung. Pesantren ini berdiri di atas lahan seluas lebih dari
                            <strong className="text-emerald-600"> dua hektar</strong>, dirancang khusus sebagai
                            tempat menuntut ilmu bagi mahasiswa dengan memadukan konsep hunian asrama modern
                            dan nilai-nilai Islami.
                        </p>

                        <div className="space-y-4">
                            {[
                                { icon: CheckCircle, text: "Kurikulum berbasis Al-Qur'an dan Al-Hadits" },
                                { icon: CheckCircle, text: 'Dibimbing langsung oleh Ulama ahli' },
                                { icon: CheckCircle, text: 'Pemisahan (Hijab) dalam kegiatan belajar' },
                            ].map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <item.icon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                    <span className="text-gray-600">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Vision & Mission Cards */}
                    <div className="space-y-4">
                        <WhiteCard delay={0.2}>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <Target className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Visi</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Berkontribusi dalam dakwah dan pemberdayaan masyarakat menuju
                                        kehidupan yang lebih baik.
                                    </p>
                                </div>
                            </div>
                        </WhiteCard>

                        <WhiteCard delay={0.3}>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <Lightbulb className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Misi</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Mencetak kader muslim sejati yang memiliki keseimbangan antara
                                        ilmu pengetahuan (akademis) dan agama.
                                    </p>
                                </div>
                            </div>
                        </WhiteCard>

                        <WhiteCard delay={0.4}>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <Heart className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Karakter</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Membentuk karakter luhur, profesional, dan religius dengan tetap
                                        memegang teguh sikap toleransi.
                                    </p>
                                </div>
                            </div>
                        </WhiteCard>
                    </div>
                </div>

                {/* ── Kampus Marquee ── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Header kampus */}
                    <div className="text-center mb-8">
                        <p className="text-emerald-600 font-semibold tracking-widest text-sm uppercase mb-2">
                            Santri Kami Berasal Dari
                        </p>
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                            Kampus-kampus Ternama Sekitar
                        </h3>
                        {/* Garis bawah judul */}
                        <div className="flex justify-center">
                            <div className="h-0.5 w-24 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" />
                        </div>
                    </div>

                    <KampusMarquee />
                </motion.div>
            </div>
        </section>
    );
}


// ============================================
// PROGRAM SECTION
// ============================================
export function ProgramSection() {
    const programs = [
        {
            icon: BookOpen,
            title: "Kajian Al-Qur'an & Hadits",
            description: "Kurikulum berbasis Al-Qur'an dan Al-Hadits dengan metode pembelajaran intensif.",
        },
        {
            icon: Users,
            title: 'Bimbingan Ulama Ahli',
            description: 'Dibimbing langsung oleh Ustadz atau Ulama yang ahli di bidang Tafsir.',
        },
        {
            icon: GraduationCap,
            title: 'Pendidikan Karakter',
            description: 'Pendidikan karakter sebagai landasan utama dalam kehidupan bermasyarakat.',
        },
        {
            icon: Heart,
            title: 'Budaya Komunikatif',
            description: 'Membangun budaya komunikatif antara pengasuh asrama dan santri.',
        },
    ];

    return (
        <section id="program" className="py-24 relative bg-emerald-50/40">
            <div className="absolute inset-0 islamic-pattern opacity-[0.04]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <SectionOrnament />
                    <span className="text-emerald-600 font-semibold mb-2 block tracking-widest text-sm uppercase">
                        Program Kami
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        Program Pendidikan
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Program pendidikan yang dirancang untuk mencetak generasi Muslim yang berilmu dan berakhlak
                    </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {programs.map((program, index) => (
                        <WhiteCard key={index} delay={index * 0.1} className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-center">
                                <program.icon className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{program.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{program.description}</p>
                        </WhiteCard>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================
// FACILITIES SECTION
// ============================================
export function FacilitiesSection() {
    const facilities = [
        {
            icon: Building2,
            title: 'Masjid',
            description: 'Sarana utama peribadatan yang menjadi pusat kegiatan pesantren.',
        },
        {
            icon: Building,
            title: 'Gedung Asrama Putri',
            description: 'Ruang belajar nyaman, kamar bernuansa Islami, dan sistem keamanan terjamin.',
        },
        {
            icon: Home,
            title: 'Gedung Asrama Putra',
            description: 'Terletak di sebelah barat masjid dengan fasilitas lengkap setara asrama putri.',
        },
        {
            icon: DoorOpen,
            title: 'Ruang Kelas Terpisah',
            description: 'Desain khusus dengan dua akses pintu terpisah untuk santri putra dan putri.',
        },
        {
            icon: Car,
            title: 'Area Parkir Luas',
            description: 'Area parkir yang luas untuk kenyamanan santri dan pengunjung.',
        },
        {
            icon: Users,
            title: 'Ruang Tamu',
            description: 'Ruang tamu yang nyaman untuk menerima kunjungan keluarga santri.',
        },
    ];

    return (
        <section id="fasilitas" className="py-24 relative bg-white">
            <div className="absolute inset-0 islamic-pattern opacity-[0.025]" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <SectionOrnament />
                    <span className="text-emerald-600 font-semibold mb-2 block tracking-widest text-sm uppercase">
                        Fasilitas
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        Fasilitas Modern & Islami
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Dilengkapi fasilitas yang mengedepankan kenyamanan dan nilai-nilai Islami
                    </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {facilities.map((facility, index) => (
                        <WhiteCard key={index} delay={index * 0.1}>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex-shrink-0">
                                    <facility.icon className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{facility.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{facility.description}</p>
                                </div>
                            </div>
                        </WhiteCard>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================
// CONTACT SECTION
// ============================================
export function ContactSection() {
    return (
        <section id="kontak" className="py-24 relative bg-emerald-50/40">
            <div className="absolute inset-0 islamic-pattern opacity-[0.04]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <SectionOrnament />
                    <span className="text-emerald-600 font-semibold mb-2 block tracking-widest text-sm uppercase">
                        Kontak
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        Hubungi Kami
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Kunjungi lokasi kami atau hubungi untuk informasi lebih lanjut
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Contact Info */}
                    <div className="space-y-4">
                        {[
                            {
                                icon: MapPin,
                                title: 'Alamat',
                                content: (
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Jl. Bijaksana 2 No. 8, Pasteur<br />
                                        Kecamatan Sukajadi, Kota Bandung<br />
                                        Jawa Barat
                                    </p>
                                ),
                                delay: 0.1,
                            },
                            {
                                icon: Phone,
                                title: 'Telepon',
                                content: <p className="text-gray-500 text-sm">+62 878-8982-7126</p>,
                                delay: 0.2,
                            },
                            {
                                icon: Mail,
                                title: 'Email',
                                content: <p className="text-gray-500 text-sm">ppmminhajulhaq@gmail.com</p>,
                                delay: 0.3,
                            },
                            {
                                icon: Youtube,
                                title: 'YouTube',
                                content: (
                                    <a
                                        href="https://youtu.be/E0k9bXSnx58?si=tqQqPlSH98MICGJe"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition"
                                    >
                                        Lihat Video Profil →
                                    </a>
                                ),
                                delay: 0.4,
                            },
                        ].map(({ icon: Icon, title, content, delay }) => (
                            <WhiteCard key={title} delay={delay}>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <Icon className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
                                        {content}
                                    </div>
                                </div>
                            </WhiteCard>
                        ))}
                    </div>

                    {/* Map */}
                    <WhiteCard delay={0.2} className="min-h-[400px] p-0 overflow-hidden">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.0!2d107.5934!3d-6.8877!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNTMnMTUuNyJTIDEwN8KwMzUnMzYuMCJF!5e0!3m2!1sen!2sid!4v1234567890"
                            width="100%"
                            height="100%"
                            style={{ border: 0, minHeight: '400px' }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="rounded-2xl"
                        />
                    </WhiteCard>
                </div>
            </div>
        </section>
    );
}

// ── Gallery Section ──────────────────────────────────────────────────────────
const GALLERY_EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const photos = [
    {
        src: '/img/santri-putri.jpg',
        label: 'Santri Putri',
        desc: 'Keluarga besar santriwati PPM Minhajul Haq',
    },
    {
        src: '/img/santri-putra.jpg',
        label: 'Santri Putra',
        desc: 'Keluarga besar santri putra bersama dewan Guru',
    },
    {
        src: '/img/kegiatan.JPG',
        label: 'Kegiatan Bersama',
        desc: 'Kegiatan outdoor seluruh santri PPM Minhajul Haq',
    },
];

export function GallerySection() {
    const [lightbox, setLightbox] = useState<number | null>(null);

    return (
        <section id="galeri" className="py-24 bg-white relative overflow-hidden">
            <div className="absolute inset-0 islamic-pattern opacity-[0.025]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6, ease: GALLERY_EASE }}
                    className="text-center mb-14"
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-400" />
                        <span className="text-emerald-500 text-lg select-none">❋</span>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-400" />
                    </div>
                    <span className="text-emerald-600 font-semibold mb-2 block tracking-widest text-sm uppercase">
                        Galeri
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        Keluarga Besar Kami
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Santri dan Dewan Guru PPM Minhajul Haq — bersama membangun generasi madani
                    </p>
                </motion.div>

                {/* Photo Grid */}
                <div className="grid md:grid-cols-3 gap-5">
                    {photos.map((photo, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ delay: index * 0.15, duration: 0.65, ease: GALLERY_EASE }}
                            className="group relative rounded-2xl overflow-hidden border border-emerald-100 cursor-pointer"
                            style={{ aspectRatio: '4/3' }}
                            onClick={() => setLightbox(index)}
                            whileHover={{ y: -4, transition: { duration: 0.22 } }}
                        >
                            {!photo.src && (
                                <div className="absolute inset-0 bg-emerald-50 animate-pulse flex items-center justify-center">
                                    <span className="text-emerald-200 text-4xl select-none">❋</span>
                                </div>
                            )}
                            <img
                                src={photo.src}
                                alt={photo.label}
                                className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent transition-all duration-500 group-hover:from-black/75" />
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300">
                                <div className="p-2 bg-white/90 rounded-full shadow-sm">
                                    <ZoomIn className="w-4 h-4 text-emerald-700" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-emerald-300 text-xs select-none">❋</span>
                                    <span className="text-xs text-emerald-300 font-medium tracking-widest uppercase">
                                        {photo.label}
                                    </span>
                                </div>
                                <p className="text-white text-sm font-medium leading-snug">{photo.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox !== null && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setLightbox(null)}
                    >
                        <motion.div
                            key={lightbox}
                            initial={{ scale: 0.9, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.93, opacity: 0 }}
                            transition={{ duration: 0.3, ease: GALLERY_EASE }}
                            className="relative max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={photos[lightbox as number].src}
                                alt={photos[lightbox as number].label}
                                className="w-full h-auto max-h-[80vh] object-contain bg-white"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-5">
                                <p className="text-white font-semibold">{photos[lightbox as number].label}</p>
                                <p className="text-gray-300 text-sm">{photos[lightbox as number].desc}</p>
                            </div>
                            <button
                                onClick={() => setLightbox(null)}
                                className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition"
                            >
                                <X className="w-5 h-5 text-gray-700" />
                            </button>
                            <div className="absolute inset-y-0 left-0 flex items-center px-3">
                                <button
                                    onClick={() => setLightbox((( lightbox as number) - 1 + photos.length) % photos.length)}
                                    className="p-2.5 bg-white/80 rounded-full hover:bg-white transition text-gray-700 font-bold text-xl shadow"
                                >‹</button>
                            </div>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3">
                                <button
                                    onClick={() => setLightbox(((lightbox as number) + 1) % photos.length)}
                                    className="p-2.5 bg-white/80 rounded-full hover:bg-white transition text-gray-700 font-bold text-xl shadow"
                                >›</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}