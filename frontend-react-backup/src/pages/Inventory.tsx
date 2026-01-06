import React, { useState, useEffect } from 'react';
import { fetchGraphQL, GRAPHQL_URLS } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';

interface Medicine {
    id: string;
    name: string;
    stock: number;
    price: number;
    category: string;
}

export default function Inventory() {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');

    // Form State
    const [editId, setEditId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', stock: 0, price: 0, category: '' });

    const loadMedicines = async () => {
        setIsLoading(true);
        try {
            const query = `query { medicines { id name stock price category } }`;
            const data: any = await fetchGraphQL(GRAPHQL_URLS.INVENTORY, query);
            setMedicines(data.medicines || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMedicines();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editId) {
                // Update
                const query = `mutation { 
                    updateMedicine(id: "${editId}", name: "${formData.name}", stock: ${formData.stock}, price: ${formData.price}, category: "${formData.category}") 
                }`;
                await fetchGraphQL(GRAPHQL_URLS.INVENTORY, query);
            } else {
                // Create
                const query = `mutation { 
                    createMedicine(name: "${formData.name}", stock: ${formData.stock}, price: ${formData.price}, category: "${formData.category}") { id } 
                }`;
                await fetchGraphQL(GRAPHQL_URLS.INVENTORY, query);
            }
            setIsModalOpen(false);
            resetForm();
            loadMedicines();
            loadMedicines();
        } catch (error: any) {
            console.error(error);
            alert("Gagal menyimpan data: " + (error.message || "Unknown error"));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus obat ini?")) return;
        try {
            const query = `mutation { deleteMedicine(id: "${id}") }`;
            await fetchGraphQL(GRAPHQL_URLS.INVENTORY, query);
            loadMedicines();
        } catch (error) {
            alert("Gagal menghapus data");
        }
    };

    const openEdit = (m: Medicine) => {
        setEditId(m.id);
        setFormData({ name: m.name, stock: m.stock, price: m.price, category: m.category });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditId(null);
        setFormData({ name: '', stock: 0, price: 0, category: '' });
    };

    const filteredMedicines = medicines.filter(m =>
        m.name.toLowerCase().includes(filterCategory.toLowerCase()) ||
        m.category.toLowerCase().includes(filterCategory.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Katalog Obat</h1>
                    <p className="text-slate-500">Kelola stok dan harga obat.</p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2 bg-green-600 hover:bg-green-700">
                    <Plus size={16} /> Tambah Obat
                </Button>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <Input
                        placeholder="Cari obat atau kategori..."
                        className="pl-10"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-semibold text-slate-700">Nama Obat</th>
                            <th className="p-4 font-semibold text-slate-700">Kategori</th>
                            <th className="p-4 font-semibold text-slate-700">Stok</th>
                            <th className="p-4 font-semibold text-slate-700">Harga (Rp)</th>
                            <th className="p-4 font-semibold text-slate-700 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">Memuat data...</td></tr>
                        ) : filteredMedicines.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">Belum ada data obat.</td></tr>
                        ) : (
                            filteredMedicines.map((m) => (
                                <tr key={m.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-900">{m.name}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                            {m.category}
                                        </span>
                                    </td>
                                    <td className={`p-4 font-mono ${m.stock < 10 ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                        {m.stock}
                                    </td>
                                    <td className="p-4 text-slate-600">{m.price.toLocaleString()}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => openEdit(m)} className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(m.id)} className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-red-600 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editId ? 'Edit Obat' : 'Tambah Obat Baru'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <Input
                                label="Nama Obat"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Kategori"
                                placeholder="Contoh: Bebas, Keras, Vitamin"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Stok"
                                    type="number"
                                    value={formData.stock}
                                    onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                    required
                                />
                                <Input
                                    label="Harga (Rp)"
                                    type="number"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" fullWidth onClick={() => setIsModalOpen(false)}>Batal</Button>
                                <Button type="submit" fullWidth className="bg-green-600 hover:bg-green-700">{editId ? 'Simpan Perubahan' : 'Tambah Obat'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
