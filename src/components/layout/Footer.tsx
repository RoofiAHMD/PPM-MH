'use client';

import Link from 'next/link';
import { Building2, Instagram, Facebook, Youtube, Mail } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-emerald-50/60 border-t border-emerald-100 relative overflow-hidden">
            {/* Islamic pattern faint */}
            <div className="absolute inset-0 islamic-pattern opacity-[0.04]" />
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative py-12">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                    {/* Brand */}
                    <div>
                        <Link href="/" className="flex items-center gap-3 mb-4 group">
                            <div className="p-2 rounded-xl bg-emerald-600 shadow-sm group-hover:bg-emerald-700 transition">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-800">PPM Minhajul Haq</h3>
                                <p className="text-xs text-emerald-600 font-medium">Pondok Pesantren Mahasiswa</p>
                            </div>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Mencetak Generasi Madani: Sarjana yang Mubaligh, Mubaligh yang Sarjana.
                        </p>
                        {/* Ornament */}
                        <div className="flex items-center gap-2 mt-4">
                            <div className="h-px w-8 bg-emerald-300" />
                            <span className="text-emerald-400 text-sm select-none">❋</span>
                            <div className="h-px w-8 bg-emerald-300" />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-gray-800 font-semibold mb-4 text-sm uppercase tracking-widest">Link Cepat</h4>
                        <ul className="space-y-2">
                            {['Home', 'Profil', 'Program', 'Fasilitas', 'Galeri', 'Kontak'].map((link) => (
                                <li key={link}>
                                    <a
                                        href={`#${link.toLowerCase()}`}
                                        className="text-gray-500 hover:text-emerald-600 text-sm transition flex items-center gap-1.5 group"
                                    >
                                        <span className="w-1 h-1 rounded-full bg-emerald-300 group-hover:bg-emerald-500 transition" />
                                        {link}
                                    </a>
                                </li>
                            ))}
                            <li>
                                <Link
                                    href="/player"
                                    className="text-gray-500 hover:text-emerald-600 text-sm transition flex items-center gap-1.5 group"
                                >
                                    <span className="w-1 h-1 rounded-full bg-emerald-300 group-hover:bg-emerald-500 transition" />
                                    Kajian
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-gray-800 font-semibold mb-4 text-sm uppercase tracking-widest">Kontak</h4>
                        <ul className="space-y-1.5 text-gray-500 text-sm leading-relaxed">
                            <li>Jl. Bijaksana 2 No. 8</li>
                            <li>Pasteur, Sukajadi</li>
                            <li>Kota Bandung, Jawa Barat</li>
                            <li className="pt-2 text-emerald-600 font-medium">+62 878-8982-7126</li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h4 className="text-gray-800 font-semibold mb-4 text-sm uppercase tracking-widest">Ikuti Kami</h4>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { icon: Instagram, href: '#', label: 'Instagram' },
                                { icon: Facebook, href: '#', label: 'Facebook' },
                                { icon: Youtube, href: 'https://youtu.be/E0k9bXSnx58', label: 'YouTube' },
                                { icon: Mail, href: 'mailto:ppmminhajulhaq@gmail.com', label: 'Email' },
                            ].map((social, index) => (
                                <a
                                    key={index}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className="p-2.5 bg-white border border-emerald-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 shadow-sm transition-all group"
                                >
                                    <social.icon className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition" />
                                </a>
                            ))}
                        </div>
                        <p className="text-gray-400 text-xs mt-4 leading-relaxed">
                            ppmminhajulhaq@gmail.com
                        </p>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-emerald-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-gray-400 text-sm">
                        © {new Date().getFullYear()} PPM Minhajul Haq. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2 text-emerald-400 text-sm select-none">
                        <span>❋</span>
                        <span className="text-gray-400 text-xs">Barakallahu fiikum</span>
                        <span>❋</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}