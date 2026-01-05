import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchGraphQL, GRAPHQL_URLS } from '../services/api';
import { Button } from '../components/ui/Button';
import { Pill } from 'lucide-react';

// Specialized Dark Input for this page
function DarkInput({ label, id, ...props }: any) {
    return (
        <div className="space-y-1.5">
            {label && <label htmlFor={id} className="block text-sm font-medium text-slate-300">{label}</label>}
            <input
                id={id}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                {...props}
            />
        </div>
    );
}

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const query = `mutation { login(username: "${username}", password: "${password}") { token user { id username fullName role nim } } }`;
            const data: any = await fetchGraphQL(GRAPHQL_URLS.AUTH, query);

            if (data.login) {
                login(data.login.token, data.login.user);
                navigate('/');
            } else {
                setError('Username atau password salah');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan saat login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 rounded-xl shadow-2xl p-8 border border-slate-800">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-green-500 mb-4 ring-1 ring-green-500/20">
                        <Pill size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Selamat Datang</h1>
                    <p className="text-slate-400 mt-2">Masuk untuk mengakses AmplePharmacy</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <DarkInput
                        id="username"
                        label="Username"
                        value={username}
                        onChange={(e: any) => setUsername(e.target.value)}
                        placeholder="admin_naufal"
                        required
                    />
                    <DarkInput
                        id="password"
                        type="password"
                        label="Password"
                        value={password}
                        onChange={(e: any) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    {error && <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

                    <Button
                        type="submit"
                        fullWidth
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5"
                    >
                        {isLoading ? 'Memproses...' : 'Masuk'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-500">
                    &copy; 2025 AmplePharmacy (TUBES-IAE)
                </div>
            </div>
        </div>
    );
}
