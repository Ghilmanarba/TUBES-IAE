import React, { useState } from 'react';
import { fetchGraphQL, GRAPHQL_URLS } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Transaction() {
    const { token } = useAuth();

    // Steps: 'input' -> 'preview' -> 'success'
    const [step, setStep] = useState<'input' | 'preview' | 'success'>('input');

    // Data
    const [prescriptionId, setPrescriptionId] = useState('');
    const [previewData, setPreviewData] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: null, message: '' });

        try {
            const query = `query { 
                previewTransaction(prescriptionId: "${prescriptionId}") {
                    isSuccess
                    message
                    patientName
                    totalPrice
                    items { id name qty price subtotal }
                }
            }`;
            const data: any = await fetchGraphQL(GRAPHQL_URLS.TRANSACTION, query, token || undefined);
            const result = data.previewTransaction;

            if (result.isSuccess) {
                setPreviewData(result);
                setStep('preview');
            } else {
                setStatus({ type: 'error', message: result.message });
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Gagal mengecek resep.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            const query = `mutation { 
                createTransaction(paymentAmount: ${parseFloat(paymentAmount)}, prescriptionId: "${prescriptionId}") 
            }`;
            const data: any = await fetchGraphQL(GRAPHQL_URLS.TRANSACTION, query, token || undefined);
            const resultMessage = data.createTransaction;

            if (resultMessage.includes("Error")) {
                setStatus({ type: 'error', message: resultMessage });
            } else {
                setStatus({ type: 'success', message: resultMessage });
                setStep('success');
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setStep('input');
        setPrescriptionId('');
        setPaymentAmount('');
        setPreviewData(null);
        setStatus({ type: null, message: '' });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Transaksi Baru</h1>
                <p className="text-slate-500">Proses resep dan pembayaran obat.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">

                {/* STEP 1: INPUT RESEP */}
                {step === 'input' && (
                    <form onSubmit={handleCheck} className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-6">
                            <h4 className="font-semibold mb-1">Informasi Demo</h4>
                            <p>Masukkan ID Resep untuk melihat rincian obat dan harga.</p>
                            <p className="mt-1 font-mono text-xs">ID Valid: RS-1001 s/d RS-1005</p>
                        </div>

                        <Input
                            label="ID Resep"
                            value={prescriptionId}
                            onChange={(e) => setPrescriptionId(e.target.value)}
                            placeholder="Contoh: RS-1001"
                            required
                        />

                        <Button type="submit" fullWidth size="lg" disabled={isLoading}>
                            {isLoading ? 'Mengecek...' : 'Cek Resep'}
                        </Button>
                    </form>
                )}

                {/* STEP 2: PREVIEW & PAYMENT */}
                {step === 'preview' && previewData && (
                    <div className="space-y-6">
                        <div className="border-b pb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Rincian Resep</h3>
                            <p className="text-sm text-slate-500">Pasien: <span className="font-medium text-slate-900">{previewData.patientName}</span></p>
                        </div>

                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-medium">
                                <tr>
                                    <th className="p-3">Obat</th>
                                    <th className="p-3 text-center">Qty</th>
                                    <th className="p-3 text-right">Harga</th>
                                    <th className="p-3 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {previewData.items.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="p-3">{item.name}</td>
                                        <td className="p-3 text-center">{item.qty}</td>
                                        <td className="p-3 text-right">Rp {item.price.toLocaleString()}</td>
                                        <td className="p-3 text-right font-medium">Rp {item.subtotal.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t font-bold text-slate-900">
                                <tr>
                                    <td colSpan={3} className="p-3 text-right">Total Tagihan</td>
                                    <td className="p-3 text-right text-lg">Rp {previewData.totalPrice.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <div className="pt-4 border-t space-y-4">
                            <Input
                                label="Nominal Pembayaran (Rp)"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="Masukkan jumlah uang"
                                required
                            />

                            <div className="flex gap-3">
                                <Button variant="outline" fullWidth onClick={reset}>Batal</Button>
                                <Button fullWidth className="bg-green-600 hover:bg-green-700" onClick={handlePayment} disabled={isLoading}>
                                    {isLoading ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: SUCCESS */}
                {step === 'success' && (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Transaksi Berhasil!</h3>
                        <p className="text-slate-600">{status.message}</p>
                        <Button onClick={reset} className="mt-4">Transaksi Baru</Button>
                    </div>
                )}

                {/* ERROR MESSAGE (Global) */}
                {status.type === 'error' && (
                    <div className="mt-6 p-4 rounded-lg flex items-start gap-3 bg-red-50 text-red-700">
                        <AlertCircle className="shrink-0" />
                        <div>
                            <h4 className="font-semibold">Gagal</h4>
                            <p className="text-sm">{status.message}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
