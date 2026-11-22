'use client';

import { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/admin/Header';
import { supabase } from '@/lib/supabase';
import { Santri } from '@/lib/types';
import { Users, Newspaper, ArrowUp, Eye, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
    totalSantri: number;
    publishedBerita: number;
    santriAktif: number;
}

interface Activity {
    id: string;
    type: 'berita' | 'update' | 'santri';
    title: string;
    description: string;
    time: string;
    created_at: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalSantri: 0,
        publishedBerita: 0,
        santriAktif: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentSantri, setRecentSantri] = useState<Santri[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);

    // Format relative time
    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        return date.toLocaleDateString('id-ID');
    };

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch stats
                const [santriRes, beritaRes, santriAktifRes] = await Promise.all([
                    supabase.from('santri').select('id', { count: 'exact', head: true }),
                    supabase.from('berita').select('id', { count: 'exact', head: true }).eq('status', 'published'),
                    supabase.from('santri').select('id', { count: 'exact', head: true }).eq('status', 'aktif'),
                ]);

                setStats({
                    totalSantri: santriRes.count || 0,
                    publishedBerita: beritaRes.count || 0,
                    santriAktif: santriAktifRes.count || 0,
                });

                // Fetch recent santri for table
                const { data: santriData } = await supabase
                    .from('santri')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5);
                setRecentSantri(santriData || []);

                // Build dynamic activities from real data
                const activityList: Activity[] = [];

                // Get recent berita
                const { data: recentBerita } = await supabase
                    .from('berita')
                    .select('id, title, status, created_at')
                    .order('created_at', { ascending: false })
                    .limit(2);

                recentBerita?.forEach((b) => {
                    activityList.push({
                        id: `berita-${b.id}`,
                        type: 'berita',
                        title: b.status === 'published' ? 'Berita Dipublish' : 'Berita Draft',
                        description: b.title,
                        time: formatRelativeTime(b.created_at),
                        created_at: b.created_at,
                    });
                });

                // Get recent santri updates
                const { data: recentSantriActivity } = await supabase
                    .from('santri')
                    .select('id, nama, created_at')
                    .order('created_at', { ascending: false })
                    .limit(2);

                recentSantriActivity?.forEach((s) => {
                    activityList.push({
                        id: `santri-${s.id}`,
                        type: 'santri',
                        title: 'Santri Baru',
                        description: `${s.nama} ditambahkan`,
                        time: formatRelativeTime(s.created_at),
                        created_at: s.created_at,
                    });
                });

                // Sort activities by created_at and take top 5
                activityList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setActivities(activityList.slice(0, 5));
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const getActivityIcon = (type: Activity['type']) => {
        const icons = {
            berita: { icon: Newspaper, bg: 'bg-purple-100', color: 'text-purple-600' },
            update: { icon: Edit2, bg: 'bg-amber-100', color: 'text-amber-600' },
            santri: { icon: Users, bg: 'bg-emerald-100', color: 'text-emerald-600' },
        };
        return icons[type];
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            aktif: 'bg-green-100 text-green-700',
            alumni: 'bg-blue-100 text-blue-700',
            cuti: 'bg-yellow-100 text-yellow-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const statCards = [
        {
            title: 'Total Santri',
            value: stats.totalSantri,
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            subtitle: '12% dari bulan lalu',
            subtitleIcon: ArrowUp,
        },
        {
            title: 'Berita Published',
            value: stats.publishedBerita,
            icon: Newspaper,
            color: 'from-purple-500 to-purple-600',
            subtitle: 'Bulan ini',
            subtitleIcon: null,
        },
    ];

    return (
        <div className="flex flex-col h-full">
            <AdminHeader title="Dashboard Overview" />

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* Stats Grid - dua kartu, jadi dua kolom supaya tidak ada kolom kosong */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {statCards.map((card, index) => (
                        <div
                            key={index}
                            className={`bg-gradient-to-br ${card.color} text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-white/80 text-sm">{card.title}</p>
                                    <h3 className="text-4xl font-bold">
                                        {loading ? '...' : card.value}
                                    </h3>
                                </div>
                                <div className="p-4 bg-white/20 rounded-xl">
                                    <card.icon className="w-8 h-8" />
                                </div>
                            </div>
                            <div className="flex items-center text-sm text-white/80">
                                {card.subtitleIcon && <card.subtitleIcon className="w-4 h-4 mr-1" />}
                                <span>{card.subtitle}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Activities - Dynamic */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Aktivitas Terbaru</h3>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-4 text-gray-400">Memuat aktivitas...</div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-4 text-gray-400">Belum ada aktivitas</div>
                        ) : (
                            activities.map((activity) => {
                                const iconData = getActivityIcon(activity.type);
                                return (
                                    <div key={activity.id} className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${iconData.bg}`}>
                                            <iconData.icon className={`w-4 h-4 ${iconData.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800">{activity.title}</p>
                                            <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                                            <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Recent Santri Table */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Data Santri Terbaru</h3>
                        <div className="flex gap-2">
                            <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-600 transition">
                                📊 Export Excel
                            </button>
                            <Link
                                href="/admin/santri"
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition"
                            >
                                + Tambah Santri
                            </Link>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">No</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nama</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NIS</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kampus</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Angkatan</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                                ) : recentSantri.length === 0 ? (
                                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Belum ada data santri</td></tr>
                                ) : (
                                    recentSantri.map((santri, index) => (
                                        <tr key={santri.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm">{index + 1}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm mr-3">
                                                        {santri.nama.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-gray-800">{santri.nama}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{santri.nis}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{santri.kampus}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{santri.angkatan}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(santri.status)}`}>
                                                    {santri.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button className="text-blue-600 hover:text-blue-700" title="View">
                                                        <Eye size={16} />
                                                    </button>
                                                    <Link href="/admin/santri" className="text-amber-600 hover:text-amber-700" title="Edit">
                                                        <Edit2 size={16} />
                                                    </Link>
                                                    <button className="text-red-600 hover:text-red-700" title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-gray-600">Showing 1-{recentSantri.length} of {stats.totalSantri} santri</p>
                        <Link href="/admin/santri" className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold">
                            Lihat Semua Santri →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
