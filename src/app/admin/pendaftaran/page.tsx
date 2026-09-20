'use client';

import { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/admin/Header';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/logSupabaseError';
import { useModalDismiss } from '@/lib/useModalDismiss';
import { JENIS_KELAMIN_OPTIONS, Pendaftaran, STATUS_PENDAFTARAN_OPTIONS } from '@/lib/types';
import { Check, X, Eye, Clock, GraduationCap, Phone } from 'lucide-react';

export default function PendaftaranPage() {
    const [pendaftaranList, setPendaftaranList] = useState<Pendaftaran[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPendaftaran, setSelectedPendaftaran] = useState<Pendaftaran | null>(null);
    const detailModalDismiss = useModalDismiss(selectedPendaftaran !== null, () => setSelectedPendaftaran(null));

    const fetchPendaftaran = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pendaftaran')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPendaftaranList(data || []);
        } catch (error) {
            logSupabaseError('Error fetching pendaftaran:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendaftaran();
    }, []);

    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('pendaftaran')
                .update({
                    status,
                    reviewed_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;
            fetchPendaftaran();
            setSelectedPendaftaran(null);
        } catch (error) {
            logSupabaseError('Error updating status:', error);
            alert('Gagal mengupdate status');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
        };
        const labels: Record<string, string> = {
            pending: 'Menunggu',
            approved: 'Diterima',
            rejected: 'Ditolak',
        };
        return { style: styles[status] || 'bg-gray-100 text-gray-700', label: labels[status] || status };
    };

    const getJenisKelaminLabel = (value: string) =>
        JENIS_KELAMIN_OPTIONS.find((opt) => opt.value === value)?.label || value || '-';

    const pendingCount = pendaftaranList.filter(p => p.status === 'pending').length;

    return (
        <div className="flex flex-col h-full">
            <AdminHeader title="Kelola Pendaftaran" subtitle={`${pendingCount} menunggu review`} />

            <div className="flex-1 p-6 overflow-y-auto">
                {/* Pending Cards */}
                {pendingCount > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Menunggu Review ({pendingCount})</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendaftaranList
                                .filter(p => p.status === 'pending')
                                .slice(0, 6)
                                .map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white border-2 border-emerald-200 rounded-xl p-4 hover:border-emerald-400 transition cursor-pointer"
                                    >
                                        <div className="flex items-center mb-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold mr-3">
                                                {item.nama.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-800">{item.nama}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {getJenisKelaminLabel(item.jenis_kelamin)} · {new Date(item.created_at).toLocaleDateString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                                            <p className="flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4 text-emerald-600" />
                                                {item.kampus} {item.jurusan ? `- ${item.jurusan}` : ''}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-emerald-600" />
                                                {item.phone}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(item.id, 'approved')}
                                                className="flex-1 flex items-center justify-center gap-1 bg-emerald-500 text-white py-2 rounded-lg text-sm hover:bg-emerald-600 transition"
                                            >
                                                <Check size={16} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(item.id, 'rejected')}
                                                className="flex-1 flex items-center justify-center gap-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 transition"
                                            >
                                                <X size={16} /> Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* All Pendaftaran Table */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold text-gray-800">Semua Pendaftaran</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">No</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nama</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jenis Kelamin</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kampus</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Telepon</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tanggal</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : pendaftaranList.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                            Belum ada data pendaftaran
                                        </td>
                                    </tr>
                                ) : (
                                    pendaftaranList.map((item, index) => {
                                        const badge = getStatusBadge(item.status);
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                                                <td className="px-4 py-3 font-medium text-gray-800">{item.nama}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{getJenisKelaminLabel(item.jenis_kelamin)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.kampus}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.phone}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {new Date(item.created_at).toLocaleDateString('id-ID')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.style}`}>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setSelectedPendaftaran(item)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        {item.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(item.id, 'approved')}
                                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                                    title="Approve"
                                                                >
                                                                    <Check size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(item.id, 'rejected')}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                                    title="Reject"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedPendaftaran && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" {...detailModalDismiss}>
                    <div className="bg-white rounded-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Detail Pendaftaran</h2>
                            <button onClick={() => setSelectedPendaftaran(null)} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Nama</p>
                                    <p className="font-medium text-gray-800">{selectedPendaftaran.nama}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedPendaftaran.status).style}`}>
                                        {getStatusBadge(selectedPendaftaran.status).label}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Kampus</p>
                                    <p className="font-medium text-gray-800">{selectedPendaftaran.kampus}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Jurusan</p>
                                    <p className="font-medium text-gray-800">{selectedPendaftaran.jurusan || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Jenis Kelamin</p>
                                    <p className="font-medium text-gray-800">{getJenisKelaminLabel(selectedPendaftaran.jenis_kelamin)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Telepon</p>
                                    <p className="font-medium text-gray-800">{selectedPendaftaran.phone}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium text-gray-800">{selectedPendaftaran.email || '-'}</p>
                                </div>
                            </div>
                            {selectedPendaftaran.motivasi && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Motivasi</p>
                                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedPendaftaran.motivasi}</p>
                                </div>
                            )}
                            {selectedPendaftaran.status === 'pending' && (
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedPendaftaran.id, 'approved')}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
                                    >
                                        <Check size={18} /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedPendaftaran.id, 'rejected')}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
                                    >
                                        <X size={18} /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
