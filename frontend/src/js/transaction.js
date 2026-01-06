import { Auth } from './auth.js';
import { initLayout } from './layout.js';
import { fetchGraphQL, GRAPHQL_URLS } from './api.js';
import { formatRupiah } from './utils.js';

Auth.requireAuth();
initLayout();

// Elements
const stepInput = document.getElementById('step-input');
const stepPreview = document.getElementById('step-preview');
const stepSuccess = document.getElementById('step-success');
const errorAlert = document.getElementById('error-alert');
const errorMessage = document.getElementById('error-message');

const checkForm = document.getElementById('check-form');
const prescriptionIdInput = document.getElementById('prescription-id');
const checkBtn = document.getElementById('check-btn');

const patientNameEl = document.getElementById('patient-name');
const itemsBody = document.getElementById('items-body');
const totalPriceEl = document.getElementById('total-price');
const paymentAmountInput = document.getElementById('payment-amount');

const payBtn = document.getElementById('pay-btn');
const cancelBtn = document.getElementById('cancel-btn');
const resetBtn = document.getElementById('reset-btn');

// State
let prescriptionId = '';

function showError(msg) {
    errorAlert.classList.remove('hidden');
    errorMessage.textContent = msg;
}
function hideError() {
    errorAlert.classList.add('hidden');
}

// CHECK RESEP
checkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    prescriptionId = prescriptionIdInput.value;

    checkBtn.textContent = 'Mengecek...';
    checkBtn.disabled = true;

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

        const data = await fetchGraphQL(GRAPHQL_URLS.TRANSACTION, query);
        const result = data.previewTransaction;

        if (result.isSuccess) {
            patientNameEl.textContent = result.patientName;

            itemsBody.innerHTML = result.items.map(item => `
                <tr>
                    <td class="p-3">${item.name}</td>
                    <td class="p-3 text-center">${item.qty}</td>
                    <td class="p-3 text-right">${formatRupiah(item.price)}</td>
                    <td class="p-3 text-right font-medium">${formatRupiah(item.subtotal)}</td>
                </tr>
            `).join('');

            totalPriceEl.textContent = formatRupiah(result.totalPrice);

            stepInput.classList.add('hidden');
            stepPreview.classList.remove('hidden');
        } else {
            showError(result.message);
        }
    } catch (err) {
        showError(err.message || 'Gagal mengecek resep.');
    } finally {
        checkBtn.textContent = 'Cek Resep';
        checkBtn.disabled = false;
    }
});

// BAYAR
payBtn.addEventListener('click', async () => {
    const payment = parseFloat(paymentAmountInput.value);
    if (!payment) return alert("Masukkan nominal pembayaran!");

    hideError();
    payBtn.textContent = 'Memproses...';
    payBtn.disabled = true;

    try {
        const query = `mutation { 
            createTransaction(paymentAmount: ${payment}, prescriptionId: "${prescriptionId}") 
        }`;
        const data = await fetchGraphQL(GRAPHQL_URLS.TRANSACTION, query);
        const resultMessage = data.createTransaction;

        if (resultMessage.includes("Error")) {
            showError(resultMessage);
        } else {
            document.getElementById('success-message').textContent = resultMessage;
            stepPreview.classList.add('hidden');
            stepSuccess.classList.remove('hidden');
        }
    } catch (err) {
        showError(err.message);
    } finally {
        payBtn.textContent = 'Konfirmasi Pembayaran';
        payBtn.disabled = false;
    }
});

// RESET
function reset() {
    stepInput.classList.remove('hidden');
    stepPreview.classList.add('hidden');
    stepSuccess.classList.add('hidden');
    hideError();
    checkForm.reset();
    paymentAmountInput.value = '';
}

cancelBtn.addEventListener('click', reset);
resetBtn.addEventListener('click', reset);
