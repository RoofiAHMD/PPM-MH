'use client';

import { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/admin/Header';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/logSupabaseError';
import { Santri, SantriFormData, STATUS_SANTRI_OPTIONS } from '@/lib/types';
import { Plus, Edit2, Trash2, Eye, X } from 'lucide-react';

export default function SantriPage() {
    const [santriList, setSantriList] = useState<Santri[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
    const [formData, setFormData] = useState<SantriFormData>({
        nama: '',
        nis: '',
        kampus: '',
        angkatan: new Date().getFullYear(),
        phone: '',
        email: '',
        alamat: '',
        status: 'aktif',
    });

    const fetchSantri = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('santri')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSantriList(data || []);
        } catch (error) {
            logSupabaseError('Error fetching santri:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSantri();
    }, []);

    const openAddModal = () => {
        setEditingSantri(null);
        setFormData({
            nama: '',
            nis: '',
            kampus: '',
            angkatan: new Date().getFullYear(),
            phone: '',
            email: '',
            alamat: '',
            status: 'aktif',
        });
        setShowModal(true);
    };

    const openEditModal = (santri: Santri) => {
        setEditingSantri(santri);
        setFormData({
            nama: santri.nama,
            nis: santri.nis,
            kampus: santri.kampus,
            angkatan: santri.angkatan,
            phone: santri.phone || '',
            email: santri.email || '',
            alamat: santri.alamat || '',
            status: santri.status,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSantri) {
                // Update
                const { error } = await supabase
                    .from('santri')
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingSantri.id);

                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase.from('santri').insert([formData]);
                if (error) throw error;
            }

            setShowModal(false);
            fetchSantri();
        } catch (error) {
            logSupabaseError('Error saving santri:', error);
            alert('Gagal menyimpan data santri');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus santri ini?')) return;

        try {
            const { error } = await supabase.from('santri').delete().eq('id', id);
            if (error) throw error;
            fetchSantri();
        } catch (error) {
            logSupabaseError('Error deleting santri:', error);
            alert('Gagal menghapus data santri');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            aktif: 'bg-green-100 text-green-700',
            alumni: 'bg-blue-100 text-blue-700',
            cuti: 'bg-yellow-100 text-yellow-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="flex flex-col h-full">
            <AdminHeader title="Kelola Santri" subtitle={`${santriList.length} santri terdaftar`} />

            <div className="flex-1 p-6 overflow-y-auto">
                {/* Actions */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Data Santri</h2>
                        <p className="text-sm text-gray-500">Kelola data santri PPM Minhajul Haq</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
                    >
                        <Plus size={18} />
                        Tambah Santri
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">No</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nama</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NIS</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kampus</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Angkatan</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : santriList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            Belum ada data santri
                                        </td>
                                    </tr>
                                ) : (
                                    santriList.map((santri, index) => (
                                        <tr key={santri.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
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
                                                    <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Lihat">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(santri)}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(santri.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Hapus"
                                                    >
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
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingSantri ? 'Edit Santri' : 'Tambah Santri'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nama}
                                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NIS</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nis}
                                        onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Angkatan</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.angkatan}
                                        onChange={(e) => setFormData({ ...formData, angkatan: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kampus</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.kampus}
                                    onChange={(e) => setFormData({ ...formData, kampus: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'aktif' | 'alumni' | 'cuti' })}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                    {STATUS_SANTRI_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                                <textarea
                                    value={formData.alamat}
                                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
                                >
                                    {editingSantri ? 'Simpan Perubahan' : 'Tambah Santri'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
