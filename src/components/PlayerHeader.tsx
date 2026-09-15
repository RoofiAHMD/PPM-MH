'use client';

import Link from 'next/link';
import { Mic, Home } from 'lucide-react';

export default function PlayerHeader() {
    return (
        <div className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-600 text-white p-2 rounded-lg">
                            <Mic size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800">PPM Minhajul Haq</h1>
                            <p className="text-xs text-gray-500">Kajian</p>
                        </div>
                    </div>
                    <Link
                        href="/"
                        className="text-green-600 hover:text-green-700 font-medium flex items-center gap-2"
                    >
                        <Home size={18} />
                        Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}
