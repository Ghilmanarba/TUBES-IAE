import { Auth } from './auth.js';
import { initLayout } from './layout.js';
import { fetchGraphQL, GRAPHQL_URLS } from './api.js';

Auth.requireAuth();
initLayout();

const tableBody = document.getElementById('inventory-table-body');
const searchInput = document.getElementById('search-input');
const modal = document.getElementById('modal');
const form = document.getElementById('inventory-form');
const modalTitle = document.getElementById('modal-title');
const editIdInput = document.getElementById('edit-id');

let medicines = [];

async function loadMedicines() {
    try {
        const query = `query { medicines { id name stock price category } }`;
        const data = await fetchGraphQL(GRAPHQL_URLS.INVENTORY, query);
        medicines = data.medicines || [];
        renderTable(medicines);
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Gagal memuat data</td></tr>`;
    }
}

function renderTable(data) {
    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500">Belum ada data obat.</td></tr>`;
        return;
    }

    tableBody.innerHTML = data.map(m => `
        <tr class="hover:bg-slate-50 border-b border-slate-100 last:border-0">
            <td class="p-4 font-medium text-slate-900">${m.name}</td>
            <td class="p-4">
                <span class="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                    ${m.category}
                </span>
            </td>
            <td class="p-4 font-mono ${m.stock < 10 ? 'text-red-600 font-bold' : 'text-slate-600'}">
                ${m.stock}
            </td>
            <td class="p-4 text-slate-600">${m.price.toLocaleString()}</td>
            <td class="p-4 text-right space-x-2">
                <button class="edit-btn p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors" data-id="${m.id}">
                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
                <button class="delete-btn p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-red-600 transition-colors" data-id="${m.id}">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
}

// Filter
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = medicines.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.category.toLowerCase().includes(term)
    );
    renderTable(filtered);
});

// Modal Actions
const openModal = () => {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};
const closeModal = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    form.reset();
    editIdInput.value = '';
};

document.getElementById('add-btn').addEventListener('click', () => {
    modalTitle.textContent = 'Tambah Obat Baru';
    openModal();
});

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);

// Form Submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = editIdInput.value;
    const name = document.getElementById('name').value;
    const stock = parseInt(document.getElementById('stock').value);
    const price = parseFloat(document.getElementById('price').value);
    const category = document.getElementById('category').value;

    try {
        if (id) {
            // Update
            const query = `mutation { 
                updateMedicine(id: "${id}", name: "${name}", stock: ${stock}, price: ${price}, category: "${category}") 
            }`;
            await fetchGraphQL(GRAPHQL_URLS.INVENTORY, query);
        } else {
            // Create
            const query = `mutation { 
                createMedicine(name: "${name}", stock: ${stock}, price: ${price}, category: "${category}") { id } 
            }`;
            await fetchGraphQL(GRAPHQL_URLS.INVENTORY, query);
        }
        closeModal();
        loadMedicines();
    } catch (error) {
        alert("Gagal menyimpan data: " + error.message);
    }
});

// Table Actions (Edit/Delete) via Delegation
tableBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const id = btn.dataset.id;

    if (btn.classList.contains('edit-btn')) {
        const m = medicines.find(item => item.id === id);
        if (m) {
            editIdInput.value = m.id;
            document.getElementById('name').value = m.name;
            document.getElementById('stock').value = m.stock;
            document.getElementById('price').value = m.price;
            document.getElementById('category').value = m.category;
            modalTitle.textContent = 'Edit Obat';
            openModal();
        }
    } else if (btn.classList.contains('delete-btn')) {
        if (confirm("Yakin ingin menghapus obat ini?")) {
            try {
                const query = `mutation { deleteMedicine(id: "${id}") }`;
                await fetchGraphQL(GRAPHQL_URLS.INVENTORY, query);
                loadMedicines();
            } catch (error) {
                alert("Gagal menghapus data");
            }
        }
    }
});

loadMedicines();
