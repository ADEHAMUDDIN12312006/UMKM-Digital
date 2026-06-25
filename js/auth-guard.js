(function() {
    const path = window.location.pathname.toLowerCase();
    
    // Check if the path ends with or contains specific route names
    const isAdminRoute = [
        'dashboard-admin',
        'management-produk',
        'management-stok',
        'kelola-transaksi',
        'verifikasi-pembayaran',
        'kelola-pelanggan',
        'laporan-penjualan',
        'backup-data'
    ].some(route => path.endsWith('/' + route) || path.endsWith('/' + route + '.html'));

    const isBuyerRoute = [
        'dashboard-pembeli',
        'detail-produk',
        'keranjang',
        'checkout',
        'pembayaran-qris',
        'upload-bukti',
        'notifikasi',
        'riwayat-transaksi'
    ].some(route => path.endsWith('/' + route) || path.endsWith('/' + route + '.html'));

    const isAuthRoute = [
        'login',
        'register'
    ].some(route => path.endsWith('/' + route) || path.endsWith('/' + route + '.html'));

    // Retrieve currentUser from localStorage
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    
    const isStatic = window.location.protocol === 'file:' || window.location.port !== '5000' || path.includes('.html');
    const isInPagesFolder = path.includes('/pages/');

    let loginUrl, adminDashUrl, buyerDashUrl;

    if (isStatic) {
        loginUrl = isInPagesFolder ? 'login.html' : 'pages/login.html';
        adminDashUrl = isInPagesFolder ? 'dashboard-admin.html' : 'pages/dashboard-admin.html';
        buyerDashUrl = isInPagesFolder ? 'dashboard-pembeli.html' : 'pages/dashboard-pembeli.html';
    } else {
        loginUrl = '/login';
        adminDashUrl = '/dashboard-admin';
        buyerDashUrl = '/dashboard-pembeli';
    }

    if (isAdminRoute) {
        if (!currentUser) {
            alert('Akses ditolak: Silakan login terlebih dahulu.');
            window.location.href = loginUrl;
        } else if (currentUser.role !== 'admin') {
            alert('Akses ditolak: Halaman ini hanya dapat diakses oleh Admin.');
            window.location.href = loginUrl;
        }
    } else if (isBuyerRoute) {
        if (!currentUser) {
            alert('Akses ditolak: Silakan login terlebih dahulu.');
            window.location.href = loginUrl;
        } else if (currentUser.role !== 'pembeli') {
            alert('Akses ditolak: Halaman ini hanya dapat diakses oleh Pembeli.');
            window.location.href = loginUrl;
        }
    } else if (isAuthRoute) {
        if (currentUser) {
            if (currentUser.role === 'admin') {
                window.location.href = adminDashUrl;
            } else if (currentUser.role === 'pembeli') {
                window.location.href = buyerDashUrl;
            }
        }
    }
})();
