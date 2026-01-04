import { useAuth } from '../context/AuthContext';
import { Activity, Users, ShoppingCart, TrendingUp } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();

    const stats = [
        { label: 'Total Transaksi', value: '1,284', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Pelanggan', value: '842', icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Stok Kritis', value: '12', icon: Activity, color: 'text-red-600', bg: 'bg-red-100' },
        { label: 'Pendapatan', value: 'Rp 45.2M', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500">Selamat datang kembali, {user?.fullName}. Inilah ringkasan apotek hari ini.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-64 flex items-center justify-center text-slate-400">
                    [Chart Placeholder: Tren Penjualan]
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-64 flex items-center justify-center text-slate-400">
                    [Chart Placeholder: Stok Obat]
                </div>
            </div>
        </div>
    );
}
