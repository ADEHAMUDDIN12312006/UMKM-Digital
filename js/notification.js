// Dynamic Component Injector & Global UI Handler
document.addEventListener('DOMContentLoaded', async function() {
    const isSubpage = window.location.href.includes('/pages/');
    const prefix = isSubpage ? '../' : '';

    // 1. Auto Load Shared Components
    await injectComponent('header.main-header', 'components/navbar.html', prefix, setupNavbar);
    await injectComponent('footer.main-footer', 'components/tooter.html', prefix);
    await injectComponent('.sidebar-admin-container', 'components/sidebar-admin.html', prefix, setupSidebar);
    
    // Inject notification card if it doesn't exist
    if (!document.getElementById('notificationToast')) {
        const toastDiv = document.createElement('div');
        toastDiv.id = 'toast-container-wrapper';
        document.body.appendChild(toastDiv);
        await injectComponent('#toast-container-wrapper', 'components/notification-card.html', prefix, setupToastEvents);
    } else {
        setupToastEvents();
    }

    // Update cart badge initially
    updateCartBadge();
});

// Component Fallback Strings (used for local CORS / file:// protocol loading)
const COMPONENT_FALLBACKS = {
    'components/navbar.html': `
<div class="brand-section">
    <a href="index.html" class="brand-logo">UMKM Digital</a>
    <ul class="nav-links">
        <li><a href="index.html" class="nav-link" id="navHome">Home</a></li>
        <li><a href="index.html#product-section" class="nav-link" id="navProducts">Products</a></li>
    </ul>
</div>

<div class="search-bar">
    <span class="search-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    </span>
    <input type="text" class="search-input" id="globalSearchInput" placeholder="Cari produk lokal unggulan...">
</div>

<div class="header-actions">
    <!-- Shopping Cart Icon with Badge -->
    <button class="action-btn" id="btnCartHeader" aria-label="Keranjang belanja" onclick="window.location.href='pages/keranjang.html'">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span class="cart-badge" id="cartBadgeCount">0</span>
    </button>
    
    <!-- Notification Bell Icon -->
    <button class="action-btn" id="btnNotificationHeader" aria-label="Notifikasi" onclick="window.location.href='pages/notifikasi.html'">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
    </button>
    
    <!-- User Profile Dropdown -->
    <div class="user-profile-menu" style="position: relative; display: inline-block;">
        <div class="user-profile" id="userProfileBtn" aria-label="Profil pengguna">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f5927" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        </div>
        <div class="dropdown-menu" id="profileDropdown" style="display: none; position: absolute; right: 0; top: 52px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.12); width: 220px; z-index: 1001; padding: 6px 0; overflow: hidden;">
            <div id="userInfoHeader" style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 13px; font-weight: 700; color: #111827;">Tamu</div>
            <a href="pages/login.html" class="dropdown-item" id="menuLogin" style="display: block; padding: 10px 16px; font-size: 14px; color: #374151; text-decoration: none; transition: background 0.2s;">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px;margin-top:-2px;"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Masuk
            </a>
            <a href="pages/profile.html" class="dropdown-item" id="menuProfile" style="display: none; padding: 10px 16px; font-size: 14px; color: #374151; text-decoration: none; transition: background 0.2s;">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px; margin-top: -2px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Lihat Profil
            </a>
            <a href="pages/dashboard-pembeli.html" class="dropdown-item" id="menuBuyerDash" style="display: none; padding: 10px 16px; font-size: 14px; color: #374151; text-decoration: none; transition: background 0.2s;">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px;margin-top:-2px;"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Dashboard Saya
            </a>
            <a href="pages/dashboard-admin.html" class="dropdown-item" id="menuAdminDash" style="display: none; padding: 10px 16px; font-size: 14px; color: #374151; text-decoration: none; transition: background 0.2s;">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px;margin-top:-2px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Panel Admin
            </a>
            <a href="#" class="dropdown-item" id="menuLogout" style="display: none; padding: 10px 16px; font-size: 14px; color: #ef4444; text-decoration: none; transition: background 0.2s; border-top: 1px solid #f3f4f6; margin-top: 4px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px;margin-top:-2px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
            </a>
        </div>
    </div>
</div>
`,
    'components/tooter.html': `
<div class="footer-left">
    <a href="index.html" class="footer-brand">UMKM Digital</a>
    <p class="footer-copyright">&copy; 2026 UMKM Digital Platform. Empowering Local Business. Proudly made in Indonesia.</p>
</div>

<div class="footer-right">
    <ul class="footer-links">
        <li><a href="#">Terms of Service</a></li>
        <li><a href="#">Privacy Policy</a></li>
        <li><a href="#">Contact Us</a></li>
        <li><a href="#">Help Center</a></li>
    </ul>
    
    <div class="footer-icons">
        <button class="footer-icon-btn" aria-label="Ganti Bahasa / Lokasi">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
        </button>
        <button class="footer-icon-btn" aria-label="Bagikan Halaman Ini">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
        </button>
    </div>
</div>
`,
    'components/sidebar-admin.html': `
<div class="sidebar-brand">
    <a href="dashboard-admin.html">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        UMKM Digital <span class="badge-admin">Admin</span>
    </a>
</div>
<nav class="sidebar-nav">
    <a href="dashboard-admin.html" class="sidebar-link" id="sideDash">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span>Dashboard Admin</span>
    </a>
    <a href="verifikasi-pembayaran.html" class="sidebar-link" id="sideVerif">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        <span>Verifikasi Pembayaran</span>
    </a>
    <a href="management-stok.html" class="sidebar-link" id="sideStock">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <span>Management Stok</span>
    </a>
    <a href="management-produk.html" class="sidebar-link" id="sideProducts">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <span>Management Produk</span>
    </a>
    <a href="kelola-transaksi.html" class="sidebar-link" id="sideTxs">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
        <span>Kelola Transaksi</span>
    </a>
    <a href="laporan-penjualan.html" class="sidebar-link" id="sideReports">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        <span>Laporan Penjualan</span>
    </a>
    <a href="kelola-pelanggan.html" class="sidebar-link" id="sideUsers">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span>Mengelola Pelanggan</span>
    </a>
    <a href="backup-data.html" class="sidebar-link" id="sideBackup">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Backup Data</span>
    </a>
</nav>
<div class="sidebar-footer">
    <a href="../index.html" class="sidebar-back-home">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>Kembali ke Awal</span>
    </a>
    <a href="#" class="sidebar-logout" id="adminLogoutLink">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Logout</span>
    </a>
</div>
`,
    'components/notification-card.html': `
<div class="toast-card" id="notificationToast" style="display: none; position: fixed; bottom: 24px; right: 24px; z-index: 9999; min-width: 300px; max-width: 450px; background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border-left: 5px solid #10853e; padding: 16px; align-items: center; gap: 12px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: translateY(100px); opacity: 0; display: flex;">
    <div class="toast-icon-wrapper" id="toastIconContainer" style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #e8f5e9; color: #10853e; flex-shrink: 0;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    </div>
    <div class="toast-body" style="flex: 1; font-family: 'Plus Jakarta Sans', sans-serif;">
        <h4 class="toast-title" id="toastTitleText" style="font-size: 14px; font-weight: 700; color: #111827; margin: 0 0 2px 0;">Notifikasi</h4>
        <p class="toast-message" id="toastMessageText" style="font-size: 13px; color: #6b7280; line-height: 1.4; margin: 0;">Deskripsi pesan disini.</p>
    </div>
    <button class="toast-close" id="toastCloseBtn" style="background: none; border: none; cursor: pointer; color: #9ca3af; padding: 4px; display: flex; align-items: center; justify-content: center;" aria-label="Tutup">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    </button>
</div>
`
};

// Component Loader Helper
async function injectComponent(selector, path, prefix, callback) {
    const el = document.querySelector(selector);
    if (!el) return;

    try {
        const response = await fetch(prefix + path);
        if (response.ok) {
            let htmlContent = await response.text();
            processAndInject(el, htmlContent, prefix, callback);
        } else {
            throw new Error('Response not OK');
        }
    } catch (err) {
        console.warn('Fetch failed for component:', path, 'Using fallback. Details:', err);
        const fallbackContent = COMPONENT_FALLBACKS[path];
        if (fallbackContent) {
            processAndInject(el, fallbackContent, prefix, callback);
        } else {
            console.error('No fallback found for component:', path);
        }
    }
}

function processAndInject(el, htmlContent, prefix, callback) {
    // Adjust relative links dynamically based on prefix
    if (prefix) {
        // Adjust href attributes (e.g. href="pages/login.html" becomes href="../pages/login.html" or just "login.html")
        htmlContent = htmlContent.replace(/href="pages\//g, 'href="');
        htmlContent = htmlContent.replace(/href="index\.html"/g, 'href="../index.html"');
        htmlContent = htmlContent.replace(/src="image\//g, 'src="../image/');
        htmlContent = htmlContent.replace(/window\.location\.href='pages\//g, "window.location.href='");
    }
    
    el.innerHTML = htmlContent;
    if (callback) callback(prefix);
}

// Setup Navbar Functions
function setupNavbar(prefix) {
    const userProfileBtn = document.getElementById('userProfileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const menuProfile = document.getElementById('menuProfile');

    if (userProfileBtn && profileDropdown) {
        userProfileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const visible = profileDropdown.style.display === 'block';
            profileDropdown.style.display = visible ? 'none' : 'block';
        });

        document.addEventListener('click', function() {
            profileDropdown.style.display = 'none';
        });
    }

    if (menuProfile && profileDropdown) {
        menuProfile.addEventListener('click', function() {
            profileDropdown.style.display = 'none';
        });
    }

    function updateNavbarWithUser(data) {
        const userInfo = document.getElementById('userInfoHeader');
        const menuLogin = document.getElementById('menuLogin');
        const menuBuyer = document.getElementById('menuBuyerDash');
        const menuAdmin = document.getElementById('menuAdminDash');
        const menuLogout = document.getElementById('menuLogout');

        if (data.logged_in) {
            if (userInfo) userInfo.innerText = data.user.username.toUpperCase();
            if (menuLogin) menuLogin.style.display = 'none';
            if (menuProfile) menuProfile.style.display = 'block';
            if (menuLogout) menuLogout.style.display = 'block';

            if (data.user.role === 'admin') {
                if (menuAdmin) menuAdmin.style.display = 'block';
                if (menuBuyer) menuBuyer.style.display = 'none';
            } else {
                if (menuBuyer) menuBuyer.style.display = 'block';
                if (menuAdmin) menuAdmin.style.display = 'none';
            }

            // Attach logout action
            if (menuLogout) {
                menuLogout.onclick = function(e) {
                    e.preventDefault();
                    localStorage.removeItem('currentUser');
                    const loginRedirect = prefix ? 'login.html' : 'pages/login.html';
                    fetch(prefix + 'api/logout', { method: 'POST' })
                        .finally(() => {
                            window.location.href = loginRedirect;
                        });
                };
            }
        } else {
            if (userInfo) userInfo.innerText = 'Tamu';
            if (menuLogin) menuLogin.style.display = 'block';
            if (menuProfile) menuProfile.style.display = 'none';
            if (menuLogout) menuLogout.style.display = 'none';
            if (menuBuyer) menuBuyer.style.display = 'none';
            if (menuAdmin) menuAdmin.style.display = 'none';
        }
    }

    fetch(prefix + 'api/user/status')
        .then(res => res.json())
        .then(data => {
            if (data.logged_in) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            } else {
                localStorage.removeItem('currentUser');
            }
            updateNavbarWithUser(data);
        })
        .catch(err => {
            console.log('Error checking user status:', err);
            updateNavbarWithUser({ logged_in: false });
        });
}

// Setup Admin Sidebar
function setupSidebar(prefix) {
    // Highlight active link based on current file name
    const currentFile = decodeURIComponent(window.location.pathname.split('/').pop());
    const links = {
        'dashboard-admin.html': 'sideDash',
        'verifikasi-pembayaran.html': 'sideVerif',
        'management-produk.html': 'sideProducts',
        'management-stok.html': 'sideStock',
        'kelola-transaksi.html': 'sideTxs',
        'kelola-pelanggan.html': 'sideUsers',
        'laporan-penjualan.html': 'sideReports',
        'backup-data.html': 'sideBackup'
    };

    const activeId = links[currentFile];
    if (activeId) {
        const activeLink = document.getElementById(activeId);
        if (activeLink) activeLink.classList.add('active');
    }

    // Attach admin logout
    const adminLogout = document.getElementById('adminLogoutLink');
    if (adminLogout) {
        adminLogout.onclick = function(e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isLoggedIn');
            sessionStorage.clear();
            
            fetch(prefix + 'api/logout', { method: 'POST' })
                .finally(() => {
                    window.location.href = '/login';
                });
        };
    }
}

// Setup Toast Actions
function setupToastEvents() {
    const toast = document.getElementById('notificationToast');
    const closeBtn = document.getElementById('toastCloseBtn');
    if (toast && closeBtn) {
        closeBtn.onclick = function() {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
            setTimeout(() => { toast.style.display = 'none'; }, 300);
        };
    }
}

// Global Show Notification function
function showNotification(title, message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    const titleText = document.getElementById('toastTitleText');
    const messageText = document.getElementById('toastMessageText');
    const iconContainer = document.getElementById('toastIconContainer');

    if (!toast || !titleText || !messageText) return;

    titleText.innerText = title;
    messageText.innerText = message;

    // Apply colors and icon based on type
    if (type === 'error') {
        toast.style.borderLeftColor = '#ef4444';
        iconContainer.style.background = '#fee2e2';
        iconContainer.style.color = '#ef4444';
        iconContainer.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
    } else {
        toast.style.borderLeftColor = '#10853e';
        iconContainer.style.background = '#e8f5e9';
        iconContainer.style.color = '#10853e';
        iconContainer.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
    }

    toast.style.display = 'flex';
    // Small timeout for CSS transition
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 50);

    // Auto hide after 4 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 4000);
}

// Update Cart Badge Count
function updateCartBadge() {
    const badge = document.getElementById('cartBadgeCount');
    if (!badge) return;

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.innerText = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}


