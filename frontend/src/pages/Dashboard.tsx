import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchGraphQL, GRAPHQL_URLS } from '../services/api';
import { Activity, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardStats {
    totalTransactions: string;
    totalRevenue: string;
    medicinesCount: string;
    criticalStockCount: number;
    revenueChart: any[];
    stockChart: any[];
}

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadDashboardData = async () => {
        try {
            // 1. Fetch Transaction Stats (Revenue & Transactions)
            const transQuery = `query { dashboardStats { totalTransactions totalRevenue revenueChart { date value } } }`;
            const transData: any = await fetchGraphQL(GRAPHQL_URLS.TRANSACTION, transQuery);
            const tStats = transData.dashboardStats;

            // 2. Fetch Inventory Data (Medicines & Stock)
            const invQuery = `query { medicines { name stock } }`;
            const invData: any = await fetchGraphQL(GRAPHQL_URLS.INVENTORY, invQuery);
            const medicines = invData.medicines || [];

            // 3. Process Inventory Data
            const criticalStock = medicines.filter((m: any) => m.stock < 10).length;
            const stockChartData = medicines.map((m: any) => ({ name: m.name, stock: m.stock }));

            setStats({
                totalTransactions: tStats.totalTransactions.toString(),
                totalRevenue: `Rp ${tStats.totalRevenue.toLocaleString()}`,
                medicinesCount: medicines.length.toString(),
                criticalStockCount: criticalStock,
                revenueChart: tStats.revenueChart,
                stockChart: stockChartData
            });

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const statCards = [
        { label: 'Total Transaksi', value: stats?.totalTransactions || '-', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Total Pendapatan', value: stats?.totalRevenue || '-', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Jenis Obat', value: stats?.medicinesCount || '-', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' }, // Changed Icon contextually
        { label: 'Stok Kritis (<10)', value: stats?.criticalStockCount.toString() || '-', icon: Activity, color: 'text-red-600', bg: 'bg-red-100' },
    ];

    if (isLoading) return <div className="p-8 text-center text-slate-500">Memuat Dashboard...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500">Selamat datang kembali, {user?.fullName}. Inilah ringkasan apotek hari ini.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
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
                {/* Revenue Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Tren Pendapatan (7 Hari)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats?.revenueChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString()}`} />
                            <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} name="Pendapatan" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Stock Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Stok Obat</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.stockChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="stock" fill="#3b82f6" name="Stok" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
