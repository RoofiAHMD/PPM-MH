'use client';

import { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/admin/Header';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/logSupabaseError';
import { Pengurus } from '@/lib/types';
import { Plus, Edit2, Trash2, X, Phone, Mail } from 'lucide-react';

export default function PengurusPage() {
    const [pengurusList, setPengurusList] = useState<Pengurus[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPengurus, setEditingPengurus] = useState<Pengurus | null>(null);
    const [formData, setFormData] = useState({
        nama: '',
        jabatan: '',
        phone: '',
        email: '',
        periode: '',
        is_active: true,
    });

    const fetchPengurus = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pengurus')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPengurusList(data || []);
        } catch (error) {
            logSupabaseError('Error fetching pengurus:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPengurus();
    }, []);

    const openAddModal = () => {
        setEditingPengurus(null);
        setFormData({
            nama: '',
            jabatan: '',
            phone: '',
            email: '',
            periode: new Date().getFullYear().toString(),
            is_active: true,
        });
        setShowModal(true);
    };

    const openEditModal = (pengurus: Pengurus) => {
        setEditingPengurus(pengurus);
        setFormData({
            nama: pengurus.nama,
            jabatan: pengurus.jabatan,
            phone: pengurus.phone || '',
            email: pengurus.email || '',
            periode: pengurus.periode || '',
            is_active: pengurus.is_active,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPengurus) {
                const { error } = await supabase
                    .from('pengurus')
                    .update(formData)
                    .eq('id', editingPengurus.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('pengurus').insert([formData]);
                if (error) throw error;
            }

            setShowModal(false);
            fetchPengurus();
        } catch (error) {
            logSupabaseError('Error saving pengurus:', error);
            alert('Gagal menyimpan data pengurus');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus pengurus ini?')) return;

        try {
            const { error } = await supabase.from('pengurus').delete().eq('id', id);
            if (error) throw error;
            fetchPengurus();
        } catch (error) {
            logSupabaseError('Error deleting pengurus:', error);
            alert('Gagal menghapus pengurus');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <AdminHeader title="Kelola Pengurus" subtitle={`${pengurusList.length} pengurus`} />

            <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Struktur Pengurus</h2>
                        <p className="text-sm text-gray-500">Kelola data pengurus PPM Minhajul Haq</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
                    >
                        <Plus size={18} />
                        Tambah Pengurus
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-full text-center py-8 text-gray-500">Memuat data...</div>
                    ) : pengurusList.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-gray-500">Belum ada data pengurus</div>
                    ) : (
                        pengurusList.map((pengurus) => (
                            <div
                                key={pengurus.id}
                                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                        {pengurus.nama.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{pengurus.nama}</h3>
                                                <p className="text-sm text-emerald-600 font-medium">{pengurus.jabatan}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEditModal(pengurus)}
                                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(pengurus.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            {pengurus.phone && (
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Phone size={12} /> {pengurus.phone}
                                                </p>
                                            )}
                                            {pengurus.email && (
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Mail size={12} /> {pengurus.email}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${pengurus.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {pengurus.is_active ? 'Aktif' : 'Tidak Aktif'}
                                            </span>
                                            {pengurus.periode && (
                                                <span className="text-xs text-gray-400">Periode {pengurus.periode}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingPengurus ? 'Edit Pengurus' : 'Tambah Pengurus'}
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.jabatan}
                                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                                    placeholder="Contoh: Ketua, Sekretaris, dll"
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
                                    <input
                                        type="text"
                                        value={formData.periode}
                                        onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                                        placeholder="2024"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
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

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700">Aktif</label>
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
                                    {editingPengurus ? 'Simpan Perubahan' : 'Tambah Pengurus'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
