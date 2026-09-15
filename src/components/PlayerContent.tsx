'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ClassSelection from '@/components/ClassSelection';
import AudioPlayer from '@/components/AudioPlayer';
import {
    Recording,
    formatDate,
    formatDurationDisplay,
    KELAS_OPTIONS,
    MANGKULAN_OPTIONS,
} from '@/lib/types';
import { ArrowLeft, Zap, Leaf, Loader2, Clock, Headphones, Calendar } from 'lucide-react';

const [KELAS_CEPATAN] = KELAS_OPTIONS;
const [MANGKULAN_QURAN] = MANGKULAN_OPTIONS;

// Param yang nilainya tidak ada di daftar types.ts diperlakukan seperti tidak dikirim,
// supaya /player?kelas=ngawur jatuh ke langkah pilih kelas dan bukan layar rusak.
function parseParam(raw: string | null, options: readonly { value: string }[]): string | null {
    if (!raw) return null;
    return options.some((opt) => opt.value === raw) ? raw : null;
}

export default function PlayerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const kelas = parseParam(searchParams.get('kelas'), KELAS_OPTIONS);
    const mangkulan = parseParam(searchParams.get('mangkulan'), MANGKULAN_OPTIONS);

    const [activeRecording, setActiveRecording] = useState<Recording | null>(null);
    const [loading, setLoading] = useState(false);

    // Sumber kebenarannya URL, jadi pemuatan data ikut param — bukan dipicu dari klik.
    // Dengan begitu refresh, deep link, dan tombol back browser sama-sama memuat data.
    useEffect(() => {
        if (!kelas || !mangkulan) {
            setActiveRecording(null);
            return;
        }

        let ignore = false;
        setLoading(true);

        const load = async () => {
            try {
                const response = await fetch('/api/recordings');
                const data = await response.json();
                if (ignore) return;

                // Check if data is array (API might return error object)
                if (!Array.isArray(data)) {
                    console.error('API error:', data);
                    setActiveRecording(null);
                    return;
                }

                const filtered = data.filter(
                    (r: Recording) => r.kelas === kelas && r.mangkulan === mangkulan
                );

                // Get active recording from filtered results
                setActiveRecording(
                    filtered.find((r: Recording) => r.is_active) || filtered[0] || null
                );
            } catch (error) {
                if (!ignore) console.error('Failed to fetch recordings:', error);
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        load();

        // Abaikan respons yang telanjur datang setelah param berganti.
        return () => {
            ignore = true;
        };
    }, [kelas, mangkulan]);

    const handleSelectKelas = (nextKelas: string) => {
        const params = new URLSearchParams({ kelas: nextKelas });
        router.push(`/player?${params.toString()}`);
    };

    const handleSelectMangkulan = (nextMangkulan: string) => {
        if (!kelas) return;
        const params = new URLSearchParams({ kelas, mangkulan: nextMangkulan });
        router.push(`/player?${params.toString()}`);
    };

    if (!kelas || !mangkulan) {
        return (
            <>
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Kajian Mangkulan</h1>
                    <p className="text-gray-600">Dengarkan kajian mangkulan dari PPM Minhajul Haq</p>
                </div>
                <ClassSelection
                    kelas={kelas}
                    onSelectKelas={handleSelectKelas}
                    onSelectMangkulan={handleSelectMangkulan}
                    onBack={() => router.back()}
                />
            </>
        );
    }

    return (
        <>
            {/* Back to menu button */}
            <button
                onClick={() => router.push('/player')}
                className="mb-6 text-gray-600 hover:text-green-600 transition flex items-center gap-2"
            >
                <ArrowLeft size={18} />
                <span>Kembali ke pilihan kelas</span>
            </button>

            {/* Selected Class Info */}
            <div className="mb-6 bg-white rounded-xl shadow p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${kelas === KELAS_CEPATAN.value
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-blue-100 text-blue-600'
                    }`}>
                    {kelas === KELAS_CEPATAN.value ? <Zap size={24} /> : <Leaf size={24} />}
                </div>
                <div>
                    <p className="font-semibold text-gray-800">
                        Kelas {kelas === KELAS_CEPATAN.value ? 'Cepatan' : 'Lambatan'} - {mangkulan === MANGKULAN_QURAN.value ? "Mangkul Qur'an" : 'Hadits'}
                    </p>
                    <p className="text-sm text-gray-500">Kajian terpilih</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-16">
                    <Loader2 className="w-10 h-10 text-green-600 animate-spin mx-auto" />
                    <p className="mt-4 text-gray-600">Memuat kajian...</p>
                </div>
            ) : (
                <>
                    {/* Main Player */}
                    <AudioPlayer
                        recording={activeRecording}
                        onPlayCountUpdate={() => {
                            // Update play count locally without re-fetching
                            if (activeRecording) {
                                setActiveRecording({
                                    ...activeRecording,
                                    play_count: activeRecording.play_count + 1
                                });
                            }
                        }}
                    />

                    {/* Recording Description */}
                    {activeRecording && (
                        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Tentang Kajian Ini</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                {activeRecording.description || 'Tidak ada deskripsi untuk kajian ini.'}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Durasi</p>
                                    <p className="font-semibold text-gray-800">{formatDurationDisplay(activeRecording.duration)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <Headphones className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Didengar</p>
                                    <p className="font-semibold text-gray-800">{activeRecording.play_count} kali</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Tanggal</p>
                                    <p className="font-semibold text-gray-800">{formatDate(activeRecording.date)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}
