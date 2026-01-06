import { Auth } from './auth.js';

export function initLayout() {
    const user = Auth.getUser();
    const currentPath = window.location.pathname;

    const navItems = [
        { label: 'Dashboard', path: '/', icon: 'layout-dashboard' }, // simplified path for index.html as /
        { label: 'Transaksi', path: '/transaction.html', icon: 'shopping-cart' },
        { label: 'Katalog Obat', path: '/inventory.html', icon: 'pill' },
    ];

    // Handle root path mapping to dashboard
    const isDashboard = currentPath === '/' || currentPath.endsWith('index.html') || currentPath.endsWith('dashboard.html');

    const sidebarHtml = `
    <aside class="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col text-slate-300 h-screen fixed left-0 top-0">
        <div class="p-6 border-b border-slate-800">
            <h1 class="text-2xl font-bold text-white flex items-center gap-2">
                <i data-lucide="pill" class="w-8 h-8 text-green-500"></i>
                AmplePharma
            </h1>
        </div>

        <nav class="flex-1 p-4 space-y-1">
            ${navItems.map(item => {
        const isActive = (item.path === '/' && isDashboard) || currentPath.endsWith(item.path);
        const activeClass = isActive
            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white';

        return `
                <a href="${item.path}" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeClass}">
                    <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                    ${item.label}
                </a>
                `;
    }).join('')}
        </nav>

        <div class="p-4 border-t border-slate-800">
            <div class="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-lg">
                <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-green-400">
                    <i data-lucide="user" class="w-4 h-4"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-white truncate">${user?.fullName || 'User'}</p>
                    <p class="text-xs text-slate-500 truncate">${user?.role || 'Staff'}</p>
                </div>
            </div>
            <button id="logout-btn" class="w-full mt-2 flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <i data-lucide="log-out" class="w-4 h-4"></i>
                Logout
            </button>
        </div>
    </aside>
    `;

    // Inject Sidebar
    const layoutContainer = document.getElementById('app-layout');
    if (layoutContainer) {
        const sidebarContainer = document.createElement('div');
        sidebarContainer.innerHTML = sidebarHtml;
        layoutContainer.insertBefore(sidebarContainer.firstElementChild, layoutContainer.firstChild);

        // Add main content wrapper class
        const mainContent = layoutContainer.querySelector('main');
        if (mainContent) {
            mainContent.classList.add('md:ml-64', 'min-h-screen', 'bg-slate-50');
        }
    }

    // Attach Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        Auth.logout();
    });

    // Initialize Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}
