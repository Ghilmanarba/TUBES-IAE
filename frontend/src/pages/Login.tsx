import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchGraphQL, GRAPHQL_URLS } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Pill } from 'lucide-react';

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
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                        <Pill size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Selamat Datang</h1>
                    <p className="text-slate-500 mt-2">Masuk untuk mengakses AmplePharmacy</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        id="username"
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin_naufal"
                        required
                    />
                    <Input
                        id="password"
                        type="password"
                        label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    {error && <div className="p-3 rounded bg-red-50 text-red-600 text-sm">{error}</div>}

                    <Button type="submit" fullWidth disabled={isLoading}>
                        {isLoading ? 'Memproses...' : 'Masuk'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-400">
                    &copy; 2025 AmplePharmacy (TUBES-IAE)
                </div>
            </div>
        </div>
    );
}
