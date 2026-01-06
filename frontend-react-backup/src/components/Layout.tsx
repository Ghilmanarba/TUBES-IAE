
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingCart, Pill, LogOut, User } from 'lucide-react';

export default function Layout() {
    const { logout, user } = useAuth();
    const location = useLocation();

    const navItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Transaksi', path: '/transaction', icon: ShoppingCart },
        { label: 'Katalog Obat', path: '/inventory', icon: Pill },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col text-slate-300">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Pill className="w-8 h-8 text-green-500" />
                        AmplePharma
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-green-400">
                            <User size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.fullName || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.role || 'Staff'}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full mt-2 flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
