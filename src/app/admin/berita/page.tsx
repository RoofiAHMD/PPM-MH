'use client';

import { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/admin/Header';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/logSupabaseError';
import { useModalDismiss } from '@/lib/useModalDismiss';
import { Berita, CATEGORY_BERITA_OPTIONS } from '@/lib/types';
import { Plus, Edit2, Trash2, Eye, X, Send } from 'lucide-react';

export default function BeritaPage() {
    const [beritaList, setBeritaList] = useState<Berita[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const modalDismiss = useModalDismiss(showModal, () => setShowModal(false));
    const [editingBerita, setEditingBerita] = useState<Berita | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        image_url: '',
        category: 'umum' as Berita['category'],
        status: 'draft' as Berita['status'],
    });

    const fetchBerita = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('berita')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBeritaList(data || []);
        } catch (error) {
            logSupabaseError('Error fetching berita:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBerita();
    }, []);

    const openAddModal = () => {
        setEditingBerita(null);
        setFormData({
            title: '',
            content: '',
            excerpt: '',
            image_url: '',
            category: 'umum',
            status: 'draft',
        });
        setShowModal(true);
    };

    const openEditModal = (berita: Berita) => {
        setEditingBerita(berita);
        setFormData({
            title: berita.title,
            content: berita.content,
            excerpt: berita.excerpt || '',
            image_url: berita.image_url || '',
            category: berita.category,
            status: berita.status,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent, publish = false) => {
        e.preventDefault();
        try {
            const now = new Date().toISOString();
            const nextStatus = publish ? 'published' : formData.status;

            // published_at hanya boleh kosong kalau beritanya memang draft. Berita yang
            // tetap published harus mempertahankan tanggal terbitnya, jangan ditimpa null.
            let publishedAt: string | null = null;
            if (publish) {
                publishedAt = now;
            } else if (nextStatus === 'published') {
                publishedAt = editingBerita?.published_at ?? now;
            }

            const saveData = {
                ...formData,
                status: nextStatus,
                published_at: publishedAt,
                updated_at: now,
            };

            if (editingBerita) {
                const { error } = await supabase
                    .from('berita')
                    .update(saveData)
                    .eq('id', editingBerita.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('berita').insert([saveData]);
                if (error) throw error;
            }

            setShowModal(false);
            fetchBerita();
        } catch (error) {
            logSupabaseError('Error saving berita:', error);
            alert('Gagal menyimpan berita');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus berita ini?')) return;

        try {
            const { error } = await supabase.from('berita').delete().eq('id', id);
            if (error) throw error;
            fetchBerita();
        } catch (error) {
            logSupabaseError('Error deleting berita:', error);
            alert('Gagal menghapus berita');
        }
    };

    const handlePublish = async (id: string) => {
        try {
            const { error } = await supabase
                .from('berita')
                .update({
                    status: 'published',
                    published_at: new Date().toISOString(),
                })
                .eq('id', id);
            if (error) throw error;
            fetchBerita();
        } catch (error) {
            logSupabaseError('Error publishing berita:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        return status === 'published'
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700';
    };

    const getCategoryLabel = (category: string) => {
        return CATEGORY_BERITA_OPTIONS.find(c => c.value === category)?.label || category;
    };

    return (
        <div className="flex flex-col h-full">
            <AdminHeader title="Kelola Berita" subtitle={`${beritaList.length} berita`} />

            <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Daftar Berita</h2>
                        <p className="text-sm text-gray-500">Kelola berita dan pengumuman PPM</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
                    >
                        <Plus size={18} />
                        Tambah Berita
                    </button>
                </div>

                <div className="grid gap-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Memuat data...</div>
                    ) : beritaList.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Belum ada berita</div>
                    ) : (
                        beritaList.map((berita) => (
                            <div key={berita.id} className="bg-white rounded-xl p-4 shadow-sm flex items-start gap-4">
                                <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400">
                                    {berita.image_url ? (
                                        <img src={berita.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <span className="text-2xl">📰</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-800 truncate">{berita.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(berita.status)}`}>
                                                    {berita.status === 'published' ? 'Published' : 'Draft'}
                                                </span>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    {getCategoryLabel(berita.category)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {berita.status === 'draft' && (
                                                <button
                                                    onClick={() => handlePublish(berita.id)}
                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                                    title="Publish"
                                                >
                                                    <Send size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEditModal(berita)}
                                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(berita.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Hapus"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                        {berita.excerpt || berita.content.substring(0, 150)}...
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(berita.created_at).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" {...modalDismiss}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingBerita ? 'Edit Berita' : 'Tambah Berita'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={(e) => handleSubmit(e)} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as Berita['category'] })}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    >
                                        {CATEGORY_BERITA_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Berita['status'] })}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar</label>
                                <input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                                {formData.image_url && (
                                    <div className="mt-2">
                                        <img src={formData.image_url} alt="Preview" className="w-32 h-20 object-cover rounded-lg" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ringkasan (Excerpt)</label>
                                <input
                                    type="text"
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    placeholder="Ringkasan singkat berita..."
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Konten</label>
                                <textarea
                                    required
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={8}
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
                                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition"
                                >
                                    Simpan Draft
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => handleSubmit(e, true)}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                                >
                                    <Send size={16} /> Publish
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
