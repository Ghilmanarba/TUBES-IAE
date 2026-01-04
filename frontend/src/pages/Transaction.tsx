import React, { useState } from 'react';
import { fetchGraphQL, GRAPHQL_URLS } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Transaction() {
    const { token } = useAuth();
    const [prescriptionId, setPrescriptionId] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: null, message: '' });

        try {
            // Hardcoded medicine_id "1" as per request requirements for demo
            const query = `mutation { 
                create_transaction(medicine_id: "1", payment_amount: ${parseFloat(paymentAmount)}, prescription_id: "${prescriptionId}") 
            }`;

            const data: any = await fetchGraphQL(GRAPHQL_URLS.TRANSACTION, query, token || undefined);

            const resultMessage = data.create_transaction;

            if (resultMessage.includes("Error")) {
                setStatus({ type: 'error', message: resultMessage });
            } else {
                setStatus({ type: 'success', message: resultMessage });
                // Reset form on success
                setPrescriptionId('');
                setPaymentAmount('');
            }

        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Gagal memproses transaksi.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Transaksi Baru</h1>
                <p className="text-slate-500">Proses resep dan pembayaran obat.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <form onSubmit={handleTransaction} className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-6">
                        <h4 className="font-semibold mb-1">Informasi Demo</h4>
                        <p>ID Obat di-hardcode ke "1". Pastikan Inventory Service memiliki obat dengan ID "1".</p>
                    </div>

                    <Input
                        label="ID Resep (Integrasi Hospital Service)"
                        value={prescriptionId}
                        onChange={(e) => setPrescriptionId(e.target.value)}
                        placeholder="Contoh: RS-999"
                        required
                    />

                    <Input
                        label="Nominal Pembayaran (Rp)"
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="50000"
                        min="0"
                        required
                    />

                    <Button type="submit" fullWidth size="lg" disabled={isLoading}>
                        {isLoading ? 'Memproses Transaksi...' : 'Proses Pembayaran'}
                    </Button>
                </form>

                {status.message && (
                    <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {status.type === 'error' ? <AlertCircle className="shrink-0" /> : <CheckCircle2 className="shrink-0" />}
                        <div>
                            <h4 className="font-semibold">{status.type === 'error' ? 'Gagal' : 'Berhasil'}</h4>
                            <p className="text-sm">{status.message}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
