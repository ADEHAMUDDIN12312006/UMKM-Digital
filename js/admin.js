/* ============================================================
   admin.js — UMKM Digital Admin Panel · Complete Logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', async function () {

    let products = [];
    let transactions = [];
    let users = [];

    // Preload all lists from backend API before running page controllers
    try {
        const [prodRes, txRes, userRes] = await Promise.all([
            fetch('/api/products').then(res => res.ok ? res.json() : { success: false }),
            fetch('/api/transactions').then(res => res.ok ? res.json() : { success: false }),
            fetch('/api/admin/users').then(res => res.ok ? res.json() : { success: false })
        ]);
        if (prodRes.success) products = prodRes.products;
        if (txRes.success) transactions = txRes.transactions;
        if (userRes.success) users = userRes.users;
    } catch (err) {
        console.error("Gagal memuat data dari database:", err);
    }

    // ─── 2. Route to Page Controller ─────────────────────────
    const path = window.location.pathname.split('/').pop();
    if (path === 'dashboard-admin.html' || path === 'dashboard-admin')          runDashboardAdmin();
    else if (path === 'management-produk.html' || path === 'management-produk')   runKelolaProduk();
    else if (path === 'management-stok.html' || path === 'management-stok')     runKelolaStok();
    else if (path === 'kelola-transaksi.html' || path === 'kelola-transaksi')    runKelolaTransaksi();
    else if (path === 'verifikasi-pembayaran.html' || path === 'verifikasi-pembayaran') runVerifikasiPembayaran();
    else if (path === 'kelola-pelanggan.html' || path === 'kelola-pelanggan')    runKelolaPelanggan();
    else if (path === 'laporan-penjualan.html' || path === 'laporan-penjualan')   runLaporanPenjualan();
    else if (path === 'backup-data.html' || path === 'backup-data')         runBackupRestore();

    // ─── 3. Data Helpers ─────────────────────────────────────
    function getMockProducts() {
        return products;
    }

    function getMockTransactions() {
        return transactions;
    }

    function getMockUsers() {
        return users;
    }

    function saveProducts(p) {
        products = p;
        return fetch('/api/admin/products/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: p })
        }).then(res => res.json())
          .then(data => {
              if (!data.success) {
                  showNotification('Error', 'Gagal sinkronisasi produk: ' + data.message, 'error');
              }
          }).catch(err => {
              showNotification('Error', 'Gagal menghubungkan ke database: ' + err.message, 'error');
          });
    }

    function saveTransactions(t) {
        transactions = t;
        return fetch('/api/admin/transactions/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions: t })
        }).then(res => res.json())
          .then(data => {
              if (!data.success) {
                  showNotification('Error', 'Gagal sinkronisasi transaksi: ' + data.message, 'error');
              }
          }).catch(err => {
              showNotification('Error', 'Gagal menghubungkan ke database: ' + err.message, 'error');
          });
    }

    function saveUsers(u) {
        users = u;
        return fetch('/api/admin/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: u })
        }).then(res => res.json())
          .then(data => {
              if (!data.success) {
                  showNotification('Error', 'Gagal sinkronisasi pelanggan: ' + data.message, 'error');
              }
          }).catch(err => {
              showNotification('Error', 'Gagal menghubungkan ke database: ' + err.message, 'error');
          });
    }

    function statusBadgeClass(s) {
        const map = { pending:'pending', diproses:'diproses', dikirim:'dikirim', selesai:'selesai', success:'success', dibatalkan:'dibatalkan', failed:'failed', menunggu:'menunggu', disetujui:'disetujui', ditolak:'ditolak' };
        return map[(s||'').toLowerCase()] || 'pending';
    }

    function fmtDate(d) {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });
    }

    function fmtRp(n) { return 'Rp ' + (n||0).toLocaleString('id-ID'); }

    // ─── 4. Dashboard Admin ───────────────────────────────────
    function runDashboardAdmin() {
        const products = getMockProducts();
        const transactions = getMockTransactions();
        const users = getMockUsers();

        const successTxs = transactions.filter(t => ['selesai','success','diproses','dikirim'].includes((t.payment_status||'').toLowerCase().trim()));
        const pendingTxs = transactions.filter(t => (t.payment_status||'').toLowerCase() === 'pending');
        const totalRevenue = successTxs.reduce((s, t) => s + (t.total||0), 0);

        setEl('adminTotalRevenue', fmtRp(totalRevenue));
        setEl('adminTotalTxs', transactions.length);
        setEl('adminTotalProducts', products.length);
        setEl('adminTotalUsers', users.filter(u => u.role !== 'admin').length);
        setEl('adminPendingPayments', pendingTxs.length);

        renderRecentTxTable(transactions);
        drawSalesChart(successTxs);
        renderLowStockWidget(products);
        renderAdminNotifications(products, transactions);
        bindDashboardProductModal(products, transactions, users);
    }

    function setEl(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    function renderLowStockWidget(products) {
        const tbody = document.getElementById('adminLowStockTbody');
        if (!tbody) return;
        const lowStockProducts = products.filter(p => p.stock < 5);
        if (lowStockProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--text-grey);">Semua stok produk aman (&ge; 5)</td></tr>';
            return;
        }
        tbody.innerHTML = lowStockProducts.map(p => {
            const statusLabel = p.stock === 0 ? 'Habis' : 'Menipis';
            const statusCls = p.stock === 0 ? 'failed' : 'pending';
            return `
                <tr>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.category}</td>
                    <td style="font-weight:700;color:#dc2626;">${p.stock}</td>
                    <td><span class="status-badge ${statusCls}">${statusLabel}</span></td>
                </tr>`;
        }).join('');
    }

    function renderAdminNotifications(products, transactions) {
        const listContainer = document.getElementById('adminNotificationList');
        const badge = document.getElementById('notifCountBadge');
        if (!listContainer) return;
        const notifications = [];

        // 1. Pending payment notifications
        const pendingTxs = transactions.filter(t => (t.payment_status||'').toLowerCase() === 'pending');
        pendingTxs.forEach(t => {
            notifications.push({
                type: 'warning',
                text: `Transaksi <strong>${t.id}</strong> (${t.username}) memerlukan verifikasi pembayaran.`,
                time: t.date
            });
        });

        // 2. Low stock notifications
        const lowStockProducts = products.filter(p => p.stock < 5);
        lowStockProducts.forEach(p => {
            notifications.push({
                type: 'danger',
                text: `Stok produk <strong>${p.name}</strong> hampir habis! Sisa stok: <strong>${p.stock}</strong>.`,
                time: new Date().toISOString()
            });
        });

        // 3. New registered users notifications
        const mockUsers = getMockUsers();
        mockUsers.filter(u => u.role !== 'admin').slice(0, 3).forEach(u => {
            notifications.push({
                type: 'info',
                text: `Pelanggan baru terdaftar: <strong>${u.username}</strong> (${u.email}).`,
                time: u.date_registered
            });
        });

        // Sort notifications by time
        notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

        if (badge) {
            badge.textContent = `${notifications.length} Baru`;
            badge.style.display = notifications.length > 0 ? 'inline-block' : 'none';
        }

        if (notifications.length === 0) {
            listContainer.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-grey);">Tidak ada notifikasi baru.</div>';
            return;
        }

        listContainer.innerHTML = notifications.slice(0, 5).map(n => {
            let iconColor = '#3b82f6';
            let bgColor = '#eff6ff';
            let icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
            
            if (n.type === 'warning') {
                iconColor = '#d97706';
                bgColor = '#fffbeb';
                icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
            } else if (n.type === 'danger') {
                iconColor = '#dc2626';
                bgColor = '#fef2f2';
                icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
            }

            return `
                <div style="display:flex;align-items:start;gap:12px;padding:12px;background:${bgColor};border-radius:10px;border:1px solid rgba(0,0,0,0.03);">
                    <div style="width:28px;height:28px;border-radius:50%;background:#fff;color:${iconColor};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,0.05);flex-shrink:0;">
                        ${icon}
                    </div>
                    <div style="flex:1;font-size:13px;line-height:1.4;">
                        <div>${n.text}</div>
                        <div style="font-size:11px;color:var(--text-grey);margin-top:4px;">${fmtDate(n.time)}</div>
                    </div>
                </div>`;
        }).join('');
    }

    function renderRecentTxTable(transactions) {
        const tbody = document.getElementById('adminRecentTxsTableBody');
        if (!tbody) return;
        const recent = [...transactions].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0, 5);
        if (!recent.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-grey);">Belum ada transaksi.</td></tr>';
            return;
        }
        tbody.innerHTML = recent.map(tx => `
            <tr>
                <td><strong>${tx.id}</strong></td>
                <td>${tx.username||'Guest'}</td>
                <td>${fmtRp(tx.total)}</td>
                <td><span class="status-badge ${statusBadgeClass(tx.payment_status)}">${tx.payment_status||'Pending'}</span></td>
            </tr>`).join('');
    }

    function bindDashboardProductModal(products, transactions, users) {
        const btn = document.getElementById('btnOpenAddProductModal');
        const quickBtn = document.getElementById('quickAddProduct');
        const modal = document.getElementById('productModal');
        const closeBtn = document.getElementById('btnCloseProductModal');
        const form = document.getElementById('productForm');

        const openModalFn = () => { 
            document.getElementById('modalTitle').textContent='Tambah Produk Baru'; 
            document.getElementById('productId').value=''; 
            if(form)form.reset(); 
            if(document.getElementById('uploadPreview')) document.getElementById('uploadPreview').style.display = 'none';
            if(document.getElementById('uploadText')) document.getElementById('uploadText').textContent = 'Klik atau seret gambar ke sini';
            modal.style.display='flex'; 
        };

        if (btn && modal) btn.onclick = openModalFn;
        if (quickBtn && modal) quickBtn.onclick = openModalFn;
        if (closeBtn && modal) closeBtn.onclick = () => modal.style.display='none';
        if (form && modal) {
            form.onsubmit = function(e) {
                e.preventDefault();
                const id = document.getElementById('productId').value;
                let prods = getMockProducts();
                const data = { name:document.getElementById('prodName').value.trim(), category:document.getElementById('prodCategory').value, price:+document.getElementById('prodPrice').value, stock:+document.getElementById('prodStock').value, image:document.getElementById('prodImage').value.trim()||'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmM2Y0ZjYiLz48cGF0aCBkPSJNMzAgMzBoNDB2NDBIMzB6IiBmaWxsPSIjZTVlN2ViIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjEwIiBmaWxsPSIjOWNhM2FmIi8+PC9zdmc+', description:document.getElementById('prodDesc').value.trim(), rating:4.5, ulasan_count:0 };
                if (id) { const idx=prods.findIndex(p=>p.id===id); if(idx>-1) prods[idx]={...prods[idx],...data}; }
                else { prods.push({id:'prod_'+Date.now(),...data}); }
                saveProducts(prods);
                showNotification('Sukses', id?'Produk diperbarui!':'Produk baru ditambahkan!');
                modal.style.display='none';
                runDashboardAdmin();
            };
        }
    }

    function drawSalesChart(txs) {
        const canvas = document.getElementById('salesChartCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        // Set canvas pixel size
        canvas.width = canvas.offsetWidth || 600;
        canvas.height = canvas.offsetHeight || 260;
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
        const now = new Date();
        const labels = [];
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
            labels.push(months[d.getMonth()]);
            const monthRevenue = txs.filter(t => { const td=new Date(t.date); return td.getMonth()===d.getMonth()&&td.getFullYear()===d.getFullYear(); }).reduce((s,t)=>s+(t.total||0),0);
            data.push(monthRevenue || (Math.random()*600000+100000));
        }

        const PAD = { top:20, right:20, bottom:40, left:60 };
        const maxVal = Math.max(...data, 1) * 1.2;
        const xStep = (W - PAD.left - PAD.right) / (data.length - 1);

        // Grid lines + Y labels
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
        ctx.font = '11px Inter, sans-serif'; ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const y = PAD.top + ((4-i) / 4) * (H - PAD.top - PAD.bottom);
            ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
            ctx.fillText((maxVal * i / 4 / 1000).toFixed(0) + 'K', PAD.left - 6, y + 4);
        }

        // Gradient fill
        const grad = ctx.createLinearGradient(0, PAD.top, 0, H - PAD.bottom);
        grad.addColorStop(0, 'rgba(16,133,62,0.20)');
        grad.addColorStop(1, 'rgba(16,133,62,0.00)');
        ctx.beginPath();
        data.forEach((val, i) => {
            const x = PAD.left + i * xStep;
            const y = PAD.top + (1 - val / maxVal) * (H - PAD.top - PAD.bottom);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.lineTo(PAD.left + (data.length-1) * xStep, H - PAD.bottom);
        ctx.lineTo(PAD.left, H - PAD.bottom);
        ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

        // Line
        ctx.beginPath(); ctx.strokeStyle = '#10853e'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
        data.forEach((val, i) => {
            const x = PAD.left + i * xStep;
            const y = PAD.top + (1 - val / maxVal) * (H - PAD.top - PAD.bottom);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Dots + X labels
        ctx.textAlign = 'center';
        data.forEach((val, i) => {
            const x = PAD.left + i * xStep;
            const y = PAD.top + (1 - val / maxVal) * (H - PAD.top - PAD.bottom);
            ctx.beginPath(); ctx.arc(x, y, 5, 0, 2*Math.PI);
            ctx.fillStyle = '#fff'; ctx.fill();
            ctx.strokeStyle = '#10853e'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#6b7280'; ctx.font = '11px Inter, sans-serif';
            ctx.fillText(labels[i], x, H - 10);
        });
    }

    // ─── 5. Kelola Produk ─────────────────────────────────────
    function runKelolaProduk() {
        let allProducts = getMockProducts();
        renderProductTable(allProducts);

        // Search
        const searchInput = document.getElementById('searchProduct');
        const filterCat = document.getElementById('filterCategory');
        function applyFilter() {
            const q = (searchInput?.value||'').toLowerCase();
            const cat = filterCat?.value||'';
            const filtered = allProducts.filter(p =>
                (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) &&
                (cat === '' || p.category === cat)
            );
            renderProductTable(filtered);
        }
        if (searchInput) searchInput.addEventListener('input', applyFilter);
        if (filterCat) filterCat.addEventListener('change', applyFilter);

        // Modal
        const btn = document.getElementById('btnOpenAddProductModal');
        const modal = document.getElementById('productModal');
        const closeBtn = document.getElementById('btnCloseProductModal');
        const form = document.getElementById('productForm');
        const deleteModal = document.getElementById('deleteModal');
        let deleteTargetId = null;

        if (btn && modal) btn.onclick = () => { 
            document.getElementById('modalTitle').textContent='Tambah Produk Baru'; 
            document.getElementById('productId').value=''; 
            if(form) form.reset(); 
            const prodImageInput = document.getElementById('prodImage');
            if (prodImageInput) {
                prodImageInput.dataset.base64 = '';
            }
            document.getElementById('uploadPreview')&&(document.getElementById('uploadPreview').style.display='none'); 
            document.getElementById('uploadText')&&(document.getElementById('uploadText').textContent='Klik untuk upload gambar produk (PNG, JPG)'); 
            modal.style.display='flex'; 
        };
        if (closeBtn && modal) closeBtn.onclick = () => modal.style.display='none';

        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                const id = document.getElementById('productId').value;
                const prodImageInput = document.getElementById('prodImage');
                const payload = {
                    name: document.getElementById('prodName').value.trim(),
                    category: document.getElementById('prodCategory').value,
                    price: +document.getElementById('prodPrice').value,
                    stock: +document.getElementById('prodStock').value,
                    image: (prodImageInput && prodImageInput.dataset.base64) || (prodImageInput ? prodImageInput.value.trim() : '') || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmM2Y0ZjYiLz48cGF0aCBkPSJNMzAgMzBoNDB2NDBIMzB6IiBmaWxsPSIjZTVlN2ViIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjEwIiBmaWxsPSIjOWNhM2FmIi8+PC9zdmc+',
                    description: document.getElementById('prodDesc').value.trim()
                };
                if (id) {
                    const idx = allProducts.findIndex(p => p.id === id);
                    if (idx > -1) allProducts[idx] = { ...allProducts[idx], ...payload };
                } else {
                    allProducts.push({ id:'prod_'+Date.now(), rating:4.5, ulasan_count:0, ...payload });
                }
                saveProducts(allProducts);
                showNotification('Sukses', id ? 'Produk berhasil diperbarui!' : 'Produk baru berhasil ditambahkan!');
                modal.style.display = 'none';
                renderProductTable(allProducts);
                setEl('productCount', allProducts.length + ' produk');
            };
        }

        // Confirm delete
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.onclick = function() {
                if (!deleteTargetId) return;
                allProducts = allProducts.filter(p => p.id !== deleteTargetId);
                saveProducts(allProducts);
                showNotification('Sukses', 'Produk berhasil dihapus.');
                deleteModal.style.display = 'none';
                renderProductTable(allProducts);
            };
        }

        function renderProductTable(prods) {
            const tbody = document.getElementById('adminProductsTableBody');
            if (!tbody) return;
            setEl('productCount', prods.length + ' produk');
            if (!prods.length) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-grey);">Tidak ada produk ditemukan.</td></tr>';
                return;
            }
            tbody.innerHTML = prods.map(p => {
                const isLow = p.stock < 5;
                const imgUrl = (p.image && p.image.startsWith('data:')) ? p.image : '../' + p.image;
                return `<tr data-id="${p.id}">
                    <td><img src="${imgUrl}" class="img-preview" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmM2Y0ZjYiLz48cGF0aCBkPSJNMzAgMzBoNDB2NDBIMzB6IiBmaWxsPSIjZTVlN2ViIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjEwIiBmaWxsPSIjOWNhM2FmIi8+PC9zdmc+'"></td>
                    <td><strong>${p.name}</strong>${isLow?'<br><span style="color:#dc2626;font-size:11px;font-weight:700;">⚠ Stok Hampir Habis</span>':''}</td>
                    <td>${p.category}</td>
                    <td>${fmtRp(p.price)}</td>
                    <td><span style="font-weight:700;color:${isLow?'#dc2626':'var(--text-dark)'};">${p.stock}</span></td>
                    <td>${'⭐'.repeat(Math.round(p.rating||0))} <span style="font-size:12px;color:var(--text-grey);">(${p.ulasan_count||0})</span></td>
                    <td style="white-space:nowrap;">
                        <button class="btn-admin secondary edit-prod-btn" style="padding:6px 12px;font-size:12px;">Edit</button>
                        <button class="btn-admin danger delete-prod-btn" style="padding:6px 12px;font-size:12px;margin-left:4px;">Hapus</button>
                    </td>
                </tr>`;
            }).join('');

            // Bind Edit
            tbody.querySelectorAll('.edit-prod-btn').forEach(btn => {
                btn.onclick = function() {
                    const id = this.closest('tr').dataset.id;
                    const p = allProducts.find(x => x.id === id);
                    if (p && modal) {
                        document.getElementById('modalTitle').textContent = 'Edit Produk';
                        document.getElementById('productId').value = p.id;
                        document.getElementById('prodName').value = p.name;
                        document.getElementById('prodCategory').value = p.category;
                        document.getElementById('prodPrice').value = p.price;
                        document.getElementById('prodStock').value = p.stock;
                        document.getElementById('prodDesc').value = p.description||'';
                        
                        const prodImageInput = document.getElementById('prodImage');
                        if (prodImageInput) {
                            prodImageInput.value = p.image||'';
                            prodImageInput.dataset.base64 = p.image.startsWith('data:') ? p.image : '';
                        }

                        // Show image preview in modal
                        const previewImg = document.getElementById('previewImg');
                        const uploadPreview = document.getElementById('uploadPreview');
                        const uploadText = document.getElementById('uploadText');
                        if (previewImg && uploadPreview && p.image) {
                            const imgUrl = p.image.startsWith('data:') ? p.image : '../' + p.image;
                            previewImg.src = imgUrl;
                            uploadPreview.style.display = 'block';
                            if (uploadText) {
                                uploadText.textContent = p.image.startsWith('data:') ? '✓ Gambar Kustom Base64' : '✓ ' + p.image.split('/').pop();
                            }
                        } else {
                            if (uploadPreview) uploadPreview.style.display = 'none';
                            if (uploadText) uploadText.textContent = 'Klik untuk upload gambar produk (PNG, JPG)';
                        }
                        
                        modal.style.display = 'flex';
                    }
                };
            });

            // Bind Delete
            tbody.querySelectorAll('.delete-prod-btn').forEach(btn => {
                btn.onclick = function() {
                    const id = this.closest('tr').dataset.id;
                    const p = allProducts.find(x => x.id === id);
                    deleteTargetId = id;
                    const nameEl = document.getElementById('deleteProductName');
                    if (nameEl) nameEl.textContent = `"${p?.name}" akan dihapus secara permanen.`;
                    if (deleteModal) deleteModal.style.display = 'flex';
                };
            });
        }
    }

    // ─── 6. Kelola Stok ──────────────────────────────────────
    function runKelolaStok() {
        let products = getMockProducts();
        renderStockTable(products);
        bindAddProductModal(products);

        function renderStockTable(prods) {
            const tbody = document.getElementById('adminStockTableBody');
            if (!tbody) return;
            const lowItems = prods.filter(p => p.stock < 5);

            // Banner
            const banner = document.getElementById('stockAlertBanner');
            if (banner) {
                if (lowItems.length > 0) {
                    banner.style.display = 'flex';
                    const detail = document.getElementById('stockAlertDetail');
                    if (detail) detail.textContent = `${lowItems.length} produk (${lowItems.map(p=>p.name).join(', ')}) memiliki stok kurang dari 5 unit. Segera lakukan penambahan stok!`;
                } else {
                    banner.style.display = 'none';
                }
            }

            const countEl = document.getElementById('lowStockCount');
            if (countEl) {
                if (lowItems.length > 0) { countEl.textContent = lowItems.length + ' Stok Kritis'; countEl.style.display='inline-block'; }
                else countEl.style.display = 'none';
            }


            tbody.innerHTML = prods.map(p => {
                const isLow = p.stock < 5;
                const badge = isLow ? `<span class="stock-warning-badge">⚠ Stok Hampir Habis</span>` : '';
                
                // Determine Label Aman, Menipis, Habis
                let statusLabel = 'Aman';
                let statusBadgeCls = 'success';
                if (p.stock === 0) {
                    statusLabel = 'Habis';
                    statusBadgeCls = 'failed';
                } else if (p.stock < 5) {
                    statusLabel = 'Menipis';
                    statusBadgeCls = 'pending';
                }

                const imgUrl = (p.image && p.image.startsWith('data:')) ? p.image : '../' + p.image;
                return `<tr data-id="${p.id}">
                    <td><img src="${imgUrl}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmM2Y0ZjYiLz48cGF0aCBkPSJNMzAgMzBoNDB2NDBIMzB6IiBmaWxsPSIjZTVlN2ViIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjEwIiBmaWxsPSIjOWNhM2FmIi8+PC9zdmc+'"></td>
                    <td><strong>${p.name}</strong> ${badge}</td>
                    <td>${p.category}</td>
                    <td>${fmtRp(p.price)}</td>
                    <td><span class="${isLow?'stock-low':''}" style="font-size:18px;font-weight:800;">${p.stock}</span></td>
                    <td><span class="status-badge ${statusBadgeCls}">${statusLabel}</span></td>
                    <td>
                        <div class="stock-qty-controls">
                            <button class="stock-qty-btn btn-minus" title="Kurangi Stok">−</button>
                            <input type="number" class="stock-input" value="${p.stock}" min="0">
                            <button class="stock-qty-btn btn-plus" title="Tambah Stok">+</button>
                        </div>
                    </td>
                    <td>
                        <button class="btn-admin primary save-stock-btn" style="padding:7px 14px;font-size:12px;">Update</button>
                    </td>
                </tr>`;
            }).join('');

            tbody.querySelectorAll('tr').forEach(row => {
                const input = row.querySelector('.stock-input');
                row.querySelector('.btn-minus')?.addEventListener('click', () => { input.value = Math.max(0, +input.value - 1); });
                row.querySelector('.btn-plus')?.addEventListener('click', () => { input.value = +input.value + 1; });
                row.querySelector('.save-stock-btn')?.addEventListener('click', () => {
                    const id = row.dataset.id;
                    const newStock = +input.value;
                    const idx = products.findIndex(p => p.id === id);
                    if (idx > -1) { products[idx].stock = newStock; saveProducts(products); showNotification('Sukses', `Stok berhasil diupdate menjadi ${newStock}!`); renderStockTable(products); }
                });
            });
        }
    }

    function bindAddProductModal(products) {
        const btn = document.getElementById('btnOpenAddProductModal');
        const modal = document.getElementById('productModal');
        const closeBtn = document.getElementById('btnCloseProductModal');
        const form = document.getElementById('productForm');
        if (btn && modal) btn.onclick = () => { document.getElementById('modalTitle').textContent='Tambah Produk Baru'; document.getElementById('productId').value=''; if(form)form.reset(); modal.style.display='flex'; };
        if (closeBtn) closeBtn.onclick = () => modal.style.display='none';
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                const p = { id:'prod_'+Date.now(), name:document.getElementById('prodName').value.trim(), category:document.getElementById('prodCategory').value, price:+document.getElementById('prodPrice').value, stock:+document.getElementById('prodStock').value, image:document.getElementById('prodImage').value.trim()||'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmM2Y0ZjYiLz48cGF0aCBkPSJNMzAgMzBoNDB2NDBIMzB6IiBmaWxsPSIjZTVlN2ViIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjEwIiBmaWxsPSIjOWNhM2FmIi8+PC9zdmc+', description:document.getElementById('prodDesc').value.trim(), rating:4.5, ulasan_count:0 };
                products.push(p); saveProducts(products);
                showNotification('Sukses', 'Produk baru ditambahkan!');
                modal.style.display='none';
                runKelolaStok();
            };
        }
    }

    // ─── 7. Kelola Transaksi ──────────────────────────────────
    function runKelolaTransaksi() {
        let transactions = getMockTransactions();
        renderTxTable(transactions);

        const searchInput = document.getElementById('searchTx');
        const filterStatus = document.getElementById('filterTxStatus');
        const filterDate = document.getElementById('filterTxDate');
        const clearBtn = document.getElementById('btnClearFilter');

        function applyTxFilter() {
            const q = (searchInput?.value||'').toLowerCase();
            const status = filterStatus?.value||'';
            const date = filterDate?.value||'';
            const filtered = transactions.filter(t => {
                const matchQ = t.id.toLowerCase().includes(q) || (t.username||'').toLowerCase().includes(q);
                const matchStatus = !status || t.payment_status.toLowerCase() === status.toLowerCase();
                const matchDate = !date || t.date?.startsWith(date);
                return matchQ && matchStatus && matchDate;
            });
            renderTxTable(filtered);
        }

        if (searchInput) searchInput.addEventListener('input', applyTxFilter);
        if (filterStatus) filterStatus.addEventListener('change', applyTxFilter);
        if (filterDate) filterDate.addEventListener('change', applyTxFilter);
        if (clearBtn) clearBtn.onclick = () => { if(searchInput)searchInput.value=''; if(filterStatus)filterStatus.value=''; if(filterDate)filterDate.value=''; renderTxTable(transactions); };

        // Ubah Status Modal
        const statusModal = document.getElementById('txStatusModal');
        const confirmStatusBtn = document.getElementById('confirmStatusBtn');
        if (confirmStatusBtn) {
            confirmStatusBtn.onclick = function() {
                const id = document.getElementById('statusTxId').value;
                const newStatus = document.getElementById('newTxStatus').value;
                const idx = transactions.findIndex(t => t.id === id);
                if (idx > -1) { transactions[idx].payment_status = newStatus; saveTransactions(transactions); showNotification('Sukses', `Status diubah menjadi ${newStatus}.`); statusModal.style.display='none'; renderTxTable(transactions); }
            };
        }

        function renderTxTable(txList) {
            const tbody = document.getElementById('adminTxsTableBody');
            if (!tbody) return;
            setEl('txTotalCount', txList.length + ' transaksi');
            const sorted = [...txList].sort((a,b) => new Date(b.date)-new Date(a.date));
            if (!sorted.length) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-grey);">Tidak ada transaksi ditemukan.</td></tr>';
                return;
            }
            tbody.innerHTML = sorted.map(tx => {
                const itemsStr = (tx.items||[]).map(it=>`${it.name} (x${it.quantity})`).join(', ');
                const cls = statusBadgeClass(tx.payment_status);
                return `<tr data-id="${tx.id}">
                    <td><strong>${tx.id}</strong></td>
                    <td>${tx.username||'Guest'}</td>
                    <td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${itemsStr}</td>
                    <td>${fmtRp(tx.total)}</td>
                    <td>${(tx.payment_method||'').toUpperCase()}</td>
                    <td>${fmtDate(tx.date)}</td>
                    <td><span class="status-badge ${cls}">${tx.payment_status||'Pending'}</span></td>
                    <td style="white-space:nowrap;">
                        <button class="btn-admin secondary detail-tx-btn" style="padding:6px 10px;font-size:12px;">Detail</button>
                        <button class="btn-admin primary change-status-btn" style="padding:6px 10px;font-size:12px;margin-left:4px;">Ubah Status</button>
                    </td>
                </tr>`;
            }).join('');

            // Detail
            const detailModal = document.getElementById('txDetailModal');
            tbody.querySelectorAll('.detail-tx-btn').forEach(btn => {
                btn.onclick = function() {
                    const id = this.closest('tr').dataset.id;
                    const tx = transactions.find(t => t.id === id);
                    if (!tx || !detailModal) return;
                    const body = document.getElementById('txDetailBody');
                    body.innerHTML = `
                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-grey);font-weight:600;">No. Transaksi</span><span style="font-weight:700;">${tx.id}</span></div>
                            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-grey);font-weight:600;">Pelanggan</span><span style="font-weight:700;">${tx.username}</span></div>
                            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-grey);font-weight:600;">Tanggal</span><span style="font-weight:700;">${fmtDate(tx.date)}</span></div>
                            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-grey);font-weight:600;">Metode Bayar</span><span style="font-weight:700;">${(tx.payment_method||'').toUpperCase()}</span></div>
                            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-grey);font-weight:600;">Alamat</span><span style="font-weight:700;text-align:right;max-width:240px;">${tx.address||'-'}</span></div>
                            <div style="padding:12px;background:#f8fafc;border-radius:8px;margin-top:4px;">
                                <div style="font-size:12px;font-weight:800;color:var(--text-grey);text-transform:uppercase;margin-bottom:8px;">Item Pesanan</div>
                                ${(tx.items||[]).map(it=>`<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span>${it.name} x${it.quantity}</span><span style="font-weight:700;">${fmtRp(it.price*it.quantity)}</span></div>`).join('')}
                                <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800;border-top:1px solid var(--border-color);padding-top:8px;margin-top:8px;"><span>Total</span><span style="color:var(--primary-green);">${fmtRp(tx.total)}</span></div>
                            </div>
                            <div style="display:flex;justify-content:space-between;padding:8px 0;"><span style="color:var(--text-grey);font-weight:600;">Status</span><span class="status-badge ${statusBadgeClass(tx.payment_status)}">${tx.payment_status}</span></div>
                        </div>`;
                    detailModal.style.display = 'flex';
                };
            });

            // Ubah Status
            tbody.querySelectorAll('.change-status-btn').forEach(btn => {
                btn.onclick = function() {
                    const id = this.closest('tr').dataset.id;
                    const tx = transactions.find(t => t.id === id);
                    if (!tx || !statusModal) return;
                    document.getElementById('statusTxId').value = tx.id;
                    document.getElementById('statusTxIdDisplay').textContent = tx.id;
                    document.getElementById('newTxStatus').value = tx.payment_status;
                    statusModal.style.display = 'flex';
                };
            });
        }
    }

    // ─── 8. Verifikasi Pembayaran ─────────────────────────────
    function runVerifikasiPembayaran() {
        let transactions = getMockTransactions();
        let currentVerifTxId = null;
        renderVerifTable(transactions);

        const searchInput = document.getElementById('searchVerif');
        const filterStatus = document.getElementById('filterVerifStatus');
        if (searchInput) searchInput.addEventListener('input', applyVerifFilter);
        if (filterStatus) filterStatus.addEventListener('change', applyVerifFilter);

        function applyVerifFilter() {
            const q = (searchInput?.value||'').toLowerCase();
            const status = filterStatus?.value||'';
            const filtered = transactions.filter(t => {
                const matchQ = t.id.toLowerCase().includes(q) || (t.username||'').toLowerCase().includes(q);
                const matchStatus = !status || t.payment_status.toLowerCase() === status.toLowerCase();
                return matchQ && matchStatus;
            });
            renderVerifTable(filtered);
        }

        // Approve from preview
        const btnApprove = document.getElementById('btnApproveFromPreview');
        if (btnApprove) btnApprove.onclick = () => doVerifAction(currentVerifTxId, 'Success');
        const btnRejectPreview = document.getElementById('btnRejectFromPreview');
        if (btnRejectPreview) btnRejectPreview.onclick = () => {
            document.getElementById('proofPreviewModal').style.display='none';
            openRejectModal(currentVerifTxId);
        };



        // Confirm reject
        const confirmRejectBtn = document.getElementById('confirmRejectBtn');
        if (confirmRejectBtn) {
            confirmRejectBtn.onclick = function() {
                const id = document.getElementById('rejectTxId').value;
                doVerifAction(id, 'Failed');
                document.getElementById('rejectModal').style.display='none';
            };
        }

        function doVerifAction(id, status) {
            const idx = transactions.findIndex(t => t.id === id);
            if (idx > -1) {
                transactions[idx].payment_status = status;
                saveTransactions(transactions);
                showNotification('Sukses', status==='Success'?'Pembayaran berhasil diterima!':'Pembayaran ditolak.');
                document.getElementById('proofPreviewModal').style.display='none';
                renderVerifTable(transactions);
            }
        }

        function openRejectModal(id) {
            const modal = document.getElementById('rejectModal');
            if (!modal) return;
            document.getElementById('rejectTxId').value = id;
            document.getElementById('rejectTxIdDisplay').textContent = id;
            modal.style.display = 'flex';
        }

        function renderVerifTable(txList) {
            // Count stats
            setEl('verifCountPending', txList.filter(t=>(t.payment_status||'').toLowerCase()==='pending').length);
            setEl('verifCountApproved', txList.filter(t=>(t.payment_status||'').toLowerCase()==='success').length);
            setEl('verifCountRejected', txList.filter(t=>(t.payment_status||'').toLowerCase()==='failed').length);

            const tbody = document.getElementById('adminVerifTableBody');
            if (!tbody) return;
            if (!txList.length) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-grey);">Tidak ada data.</td></tr>';
                return;
            }
            const sorted = [...txList].sort((a,b)=>new Date(b.date)-new Date(a.date));
            tbody.innerHTML = sorted.map(tx => {
                const status = (tx.payment_status||'').toLowerCase();
                let statusLabel = tx.payment_status;
                if (status === 'pending') statusLabel = 'Menunggu Verifikasi';
                if (status === 'success') statusLabel = 'Disetujui';
                if (status === 'failed') statusLabel = 'Ditolak';
                const badgeCls = status==='pending'?'menunggu':(status==='success'?'disetujui':'ditolak');
                const proofHtml = tx.proof_image ? `<a href="#" class="view-proof-btn" data-id="${tx.id}" data-img="${tx.proof_image}" style="color:var(--primary-green);font-weight:700;text-decoration:none;">Lihat Bukti</a>` : '<span style="color:var(--text-grey);font-size:12px;">Tanpa Bukti</span>';
                const actionHtml = status === 'pending' ? `
                    <button class="btn-admin primary verif-approve-btn" data-id="${tx.id}" style="padding:6px 10px;font-size:12px;">Terima</button>
                    <button class="btn-admin danger verif-reject-btn" data-id="${tx.id}" style="padding:6px 10px;font-size:12px;margin-left:4px;">Tolak</button>` : `<span style="font-size:12px;color:var(--text-grey);">—</span>`;
                return `<tr data-id="${tx.id}">
                    <td><strong>${tx.id}</strong></td>
                    <td>${tx.username||'Guest'}</td>
                    <td>${fmtRp(tx.total)}</td>
                    <td>${(tx.payment_method||'').toUpperCase()}</td>
                    <td>${fmtDate(tx.date)}</td>
                    <td>${proofHtml}</td>
                    <td><span class="status-badge ${badgeCls}">${statusLabel}</span></td>
                    <td style="white-space:nowrap;">${actionHtml}</td>
                </tr>`;
            }).join('');

            // Bind actions
            const previewModal = document.getElementById('proofPreviewModal');
            tbody.querySelectorAll('.view-proof-btn').forEach(btn => {
                btn.onclick = function(e) {
                    e.preventDefault();
                    currentVerifTxId = this.dataset.id;
                    const tx = transactions.find(t=>t.id===currentVerifTxId);
                    const img = tx ? tx.proof_image : '';
                    document.getElementById('proofInfoRow').textContent = `Transaksi ${currentVerifTxId} · ${tx?.username||''}`;
                    


                    const imgEl = document.getElementById('proofPreviewImg');
                    imgEl.src = img ? (img.startsWith('data:') ? img : '../'+img) : '';
                    imgEl.style.display = img ? 'block' : 'none';
                    document.getElementById('noProofMsg').style.display = img ? 'none' : 'block';
                    const isPending = (tx?.payment_status||'').toLowerCase() === 'pending';
                    document.getElementById('btnApproveFromPreview').style.display = isPending?'':'none';
                    document.getElementById('btnRejectFromPreview').style.display = isPending?'':'none';
                    if (previewModal) previewModal.style.display = 'flex';
                };
            });
            tbody.querySelectorAll('.verif-approve-btn').forEach(btn => {
                btn.onclick = function() { doVerifAction(this.dataset.id, 'Success'); };
            });
            tbody.querySelectorAll('.verif-reject-btn').forEach(btn => {
                btn.onclick = function() { openRejectModal(this.dataset.id); };
            });
        }
    }

    // ─── 9. Kelola Pelanggan ──────────────────────────────────
    function runKelolaPelanggan() {
        let users = getMockUsers();
        let transactions = getMockTransactions();
        renderCustomerTable(users, transactions);

        const searchInput = document.getElementById('searchCustomer');
        if (searchInput) searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase();
            const filtered = users.filter(u => u.username.toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q));
            renderCustomerTable(filtered, transactions);
        });

        // Add User Modal
        const addBtn = document.getElementById('btnOpenAddUserModal');
        const addModal = document.getElementById('addUserModal');
        const closeAddBtn = document.getElementById('btnCloseAddUserModal');
        const addForm = document.getElementById('addUserForm');
        if (addBtn && addModal) addBtn.onclick = () => { if(addForm)addForm.reset(); addModal.style.display='flex'; };
        if (closeAddBtn) closeAddBtn.onclick = () => addModal.style.display='none';
        if (addForm) {
            addForm.onsubmit = function(e) {
                e.preventDefault();
                const username = document.getElementById('newUsername').value.trim();
                const email = document.getElementById('newEmail').value.trim();
                const role = document.getElementById('newRole').value;
                if (users.find(u=>u.username.toLowerCase()===username.toLowerCase())) { showNotification('Gagal','Username sudah digunakan!','error'); return; }
                users.unshift({ username, email, role, date_registered:new Date().toISOString(), status:'aktif' });
                saveUsers(users);
                showNotification('Sukses','Pelanggan berhasil ditambahkan!');
                addModal.style.display='none';
                renderCustomerTable(users, transactions);
            };
        }

        // Toggle account status
        const detailModal = document.getElementById('customerDetailModal');
        const toggleBtn = document.getElementById('btnToggleAccountStatus');
        let currentCustomerUsername = null;

        if (toggleBtn) {
            toggleBtn.onclick = function() {
                const idx = users.findIndex(u => u.username === currentCustomerUsername);
                if (idx > -1) {
                    users[idx].status = users[idx].status === 'aktif' ? 'nonaktif' : 'aktif';
                    saveUsers(users);
                    showNotification('Sukses', `Akun ${users[idx].status === 'aktif' ? 'diaktifkan' : 'dinonaktifkan'}.`);
                    if (detailModal) detailModal.style.display='none';
                    renderCustomerTable(users, transactions);
                }
            };
        }

        function renderCustomerTable(userList, txList) {
            const tbody = document.getElementById('adminUsersTableBody');
            if (!tbody) return;
            setEl('customerCount', userList.length + ' pelanggan');
            const buyers = userList.filter(u => u.role !== 'admin');
            if (!buyers.length) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-grey);">Tidak ada pelanggan ditemukan.</td></tr>';
                return;
            }
            tbody.innerHTML = buyers.map((u, i) => {
                const userTxs = txList.filter(t=>t.username===u.username);
                const totalBelanja = userTxs.filter(t=>['selesai','success','diproses','dikirim'].includes((t.payment_status||'').toLowerCase().trim())).reduce((s,t)=>s+(t.total||0),0);
                const statusCls = (u.status||'aktif') === 'aktif' ? 'aktif' : 'nonaktif';
                const colors = ['#10853e','#2563eb','#d97706','#7c3aed','#dc2626'];
                const initials = u.username.slice(0,2).toUpperCase();
                // Tampilkan foto avatar jika ada, atau inisial jika tidak ada
                const avatarHtml = u.avatar
                    ? `<img src="${u.avatar}" alt="${u.username}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #e5e7eb;flex-shrink:0;">`
                    : `<div style="width:34px;height:34px;border-radius:50%;background:${colors[i%colors.length]};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;flex-shrink:0;">${initials}</div>`;
                return `<tr data-username="${u.username}">
                    <td>${i+1}</td>
                    <td>
                        <div style="display:flex;align-items:center;gap:10px;">
                            ${avatarHtml}
                            <strong>${u.username}</strong>
                        </div>
                    </td>
                    <td>${u.email||'-'}</td>
                    <td style="font-weight:700;">${userTxs.length}</td>
                    <td style="font-weight:700;color:var(--primary-green);">${fmtRp(totalBelanja)}</td>
                    <td>${fmtDate(u.date_registered)}</td>
                    <td><span class="status-badge ${statusCls}">${(u.status||'aktif').toUpperCase()}</span></td>
                    <td>
                        <button class="btn-admin secondary detail-customer-btn" style="padding:6px 10px;font-size:12px;">Detail</button>
                    </td>
                </tr>`;
            }).join('');


            tbody.querySelectorAll('.detail-customer-btn').forEach(btn => {
                btn.onclick = function() {
                    const username = this.closest('tr').dataset.username;
                    const u = users.find(x => x.username === username);
                    const userTxs = txList.filter(t => t.username === username);
                    const totalBelanja = userTxs.filter(t=>['selesai','success','diproses','dikirim'].includes((t.payment_status||'').toLowerCase().trim())).reduce((s,t)=>s+(t.total||0),0);
                    if (!u || !detailModal) return;
                    currentCustomerUsername = username;

                    const body = document.getElementById('customerDetailBody');
                    body.innerHTML = `
                        <div style="display:flex;flex-direction:column;gap:0;">
                            <div class="detail-section">
                                <div class="detail-section-title" style="font-size:14px;font-weight:800;color:var(--text-dark);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border-color);">Informasi Akun</div>
                                ${[['Username', u.username],['Email', u.email||'-'],['Peran', u.role||'-'],['Bergabung', fmtDate(u.date_registered)],['Status', (u.status||'aktif').toUpperCase()]].map(([label,val])=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;"><span style="color:var(--text-grey);font-weight:600;">${label}</span><span style="font-weight:700;">${val}</span></div>`).join('')}
                            </div>
                            <div style="margin-top:16px;">
                                <div style="font-size:14px;font-weight:800;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border-color);">Riwayat Pembelian (${userTxs.length} transaksi · Total: ${fmtRp(totalBelanja)})</div>
                                ${userTxs.length === 0 ? '<div style="text-align:center;padding:20px;color:var(--text-grey);font-size:13px;">Belum ada transaksi.</div>' :
                                userTxs.map(tx=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;">
                                    <div><strong>${tx.id}</strong><div style="font-size:11px;color:var(--text-grey);margin-top:2px;">${fmtDate(tx.date)}</div></div>
                                    <div style="text-align:right;"><div style="font-weight:700;">${fmtRp(tx.total)}</div><span class="status-badge ${statusBadgeClass(tx.payment_status)}" style="font-size:10px;">${tx.payment_status}</span></div>
                                </div>`).join('')}
                            </div>
                        </div>`;

                    const toggleBtn = document.getElementById('btnToggleAccountStatus');
                    if (toggleBtn) toggleBtn.textContent = (u.status||'aktif') === 'aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun';
                    detailModal.style.display = 'flex';
                };
            });
        }
    }

    // ─── 10. Laporan Penjualan ────────────────────────────────
    function runLaporanPenjualan() {
        const transactions = getMockTransactions();
        let currentPeriod = 'harian';

        renderReport(transactions, currentPeriod);
        renderBestsellers(transactions);
        drawSalesChart(transactions.filter(t=>['selesai','success','diproses','dikirim'].includes((t.payment_status||'').toLowerCase().trim())));

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = function() {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentPeriod = this.dataset.period;
                renderReport(transactions, currentPeriod);
                const periodLabels = { harian:'Harian', bulanan:'Bulanan', tahunan:'Tahunan' };
                setEl('reportPeriodBadge', periodLabels[currentPeriod]);
                setEl('chartPeriodLabel', periodLabels[currentPeriod]);
            };
        });

        // Export PDF
        const pdfBtn = document.getElementById('btnExportPDF');
        if (pdfBtn) pdfBtn.onclick = () => { window.print(); };

        // Export Excel (CSV)
        const excelBtn = document.getElementById('btnExportExcel');
        if (excelBtn) excelBtn.onclick = () => exportCSV(transactions);

        // Print
        const printBtn = document.getElementById('btnPrintReport');
        if (printBtn) printBtn.onclick = () => { window.print(); };

        function renderReport(txList, period) {
            const successTxs = txList.filter(t => ['selesai','success','diproses','dikirim'].includes((t.payment_status||'').toLowerCase().trim()));
            let filtered = successTxs;
            const now = new Date();

            if (period === 'harian') {
                filtered = successTxs.filter(t => {
                    const d = new Date(t.date);
                    return d.getFullYear() === now.getFullYear() &&
                           d.getMonth() === now.getMonth() &&
                           d.getDate() === now.getDate();
                });
                if (!filtered.length) filtered = successTxs; // show all if no today data
            } else if (period === 'bulanan') {
                filtered = successTxs.filter(t => {
                    const d = new Date(t.date);
                    return d.getFullYear() === now.getFullYear() &&
                           d.getMonth() === now.getMonth();
                });
                if (!filtered.length) filtered = successTxs;
            } else if (period === 'tahunan') {
                filtered = successTxs.filter(t => {
                    const d = new Date(t.date);
                    return d.getFullYear() === now.getFullYear();
                });
                if (!filtered.length) filtered = successTxs;
            }

            const totalSales = filtered.reduce((s,t)=>s+(t.subtotal||t.total||0),0);
            const totalDisc = filtered.reduce((s,t)=>s+(t.discount||0),0);
            const netRevenue = filtered.reduce((s,t)=>s+(t.total||0),0);
            setEl('reportTotalSales', fmtRp(totalSales));
            setEl('reportTotalDiscounts', '- ' + fmtRp(totalDisc));
            setEl('reportNetRevenue', fmtRp(netRevenue));

            const tbody = document.getElementById('reportsTableBody');
            if (!tbody) return;
            if (!filtered.length) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-grey);">Belum ada data penjualan.</td></tr>';
                return;
            }
            const rows = [];
            filtered.forEach(tx => {
                (tx.items||[]).forEach(it => {
                    rows.push(`<tr>
                        <td>${fmtDate(tx.date)}</td>
                        <td><strong>${tx.id}</strong></td>
                        <td>${it.name}</td>
                        <td>${it.quantity}</td>
                        <td>${fmtRp(it.price)}</td>
                        <td>${fmtRp(it.price*it.quantity)}</td>
                        <td><span class="status-badge success">Sukses</span></td>
                    </tr>`);
                });
            });
            tbody.innerHTML = rows.join('');
        }

        function renderBestsellers(txList) {
            const el = document.getElementById('bestsellerList');
            if (!el) return;
            const salesMap = {};
            txList.filter(t=>['selesai','success','diproses','dikirim'].includes((t.payment_status||'').toLowerCase().trim())).forEach(tx => {
                (tx.items||[]).forEach(it => { salesMap[it.name] = (salesMap[it.name]||0) + it.quantity; });
            });
            // Add defaults if empty
            if (!Object.keys(salesMap).length) {
                salesMap['Kopi Gayo Arabica 250g'] = 180;
                salesMap['Tas Anyaman Pandan Khas Tasikmalaya'] = 72;
                salesMap['Kain Batik Solo Tulis Premium'] = 45;
                salesMap['Vas Keramik Modern'] = 22;
            }
            const sorted = Object.entries(salesMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
            const max = sorted[0][1];
            const rankClass = ['r1','r2','r3','rn','rn'];
            el.innerHTML = sorted.map(([name, qty], i) => `
                <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-color);">
                    <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;background:${i===0?'#fef3c7':i===1?'#f1f5f9':'#f8fafc'};color:${i===0?'#d97706':i===1?'#475569':'#64748b'};">${i+1}</div>
                    <div style="flex:1;">
                        <div style="font-size:13px;font-weight:700;color:var(--text-dark);margin-bottom:4px;">${name}</div>
                        <div style="height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;"><div style="height:100%;background:var(--primary-green);border-radius:3px;width:${(qty/max*100).toFixed(0)}%;"></div></div>
                    </div>
                    <span style="font-size:12px;color:var(--text-grey);font-weight:600;white-space:nowrap;">${qty} terjual</span>
                </div>`).join('');
        }

        function exportCSV(txList) {
            const rows = [['Tanggal','No. Transaksi','Produk','Qty','Harga','Total','Status']];
            txList.filter(t=>['selesai','success','diproses','dikirim'].includes((t.payment_status||'').toLowerCase().trim())).forEach(tx => {
                (tx.items||[]).forEach(it => {
                    rows.push([fmtDate(tx.date), tx.id, it.name, it.quantity, it.price, it.price*it.quantity, tx.payment_status]);
                });
            });
            const csv = rows.map(r=>r.join(',')).join('\n');
            const blob = new Blob([csv], { type:'text/csv' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'laporan-penjualan.csv'; a.click();
        }
    }

    // ─── 11. Backup & Restore ────────────────────────────────
    function runBackupRestore() {
        const products = getMockProducts();
        const transactions = getMockTransactions();
        const users = getMockUsers();

        // Show info
        setEl('backupProdCount', products.length + ' produk');
        setEl('backupUserCount', users.length + ' pengguna');
        setEl('backupTxCount', transactions.length + ' transaksi');
        setEl('backupTimestamp', new Date().toLocaleString('id-ID'));

        // Load history
        const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
        renderBackupHistory(history);

        // Download Backup
        const dlBtn = document.getElementById('btnDownloadBackup');
        if (dlBtn) {
            dlBtn.onclick = function() {
                const progress = document.getElementById('backupProgress');
                const fill = document.getElementById('backupProgressFill');
                const label = document.getElementById('backupProgressLabel');
                if (progress) progress.style.display='block';
                let pct = 0;
                const iv = setInterval(() => {
                    pct += 20;
                    if (fill) fill.style.width = pct + '%';
                    if (label) label.textContent = 'Memproses backup... ' + pct + '%';
                    if (pct >= 100) {
                        clearInterval(iv);
                        if (label) label.textContent = 'Backup selesai!';
                        // Build data
                        const backupData = { backup_date:new Date().toISOString(), products:getMockProducts(), users:getMockUsers(), transactions:getMockTransactions() };
                        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type:'application/json' });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = `backup-umkm-${new Date().toISOString().slice(0,10)}.json`;
                        a.click();
                        // Save to history
                        const hist = JSON.parse(localStorage.getItem('backupHistory')||'[]');
                        hist.unshift({ date:new Date().toISOString(), size:(blob.size/1024).toFixed(1)+'KB', items:`${products.length} produk, ${transactions.length} transaksi, ${users.length} user` });
                        localStorage.setItem('backupHistory', JSON.stringify(hist.slice(0,5)));
                        renderBackupHistory(hist);
                        showNotification('Sukses', 'Database berhasil diunduh!');
                        setTimeout(() => { if(progress) progress.style.display='none'; fill.style.width='0'; }, 2000);
                    }
                }, 200);
            };
        }

        // Restore
        const restoreForm = document.getElementById('restoreForm');
        if (restoreForm) {
            restoreForm.onsubmit = function(e) {
                e.preventDefault();
                const file = document.getElementById('restoreFile').files[0];
                if (!file) { showNotification('Peringatan','Pilih file backup terlebih dahulu.','error'); return; }
                const reader = new FileReader();
                const progress = document.getElementById('restoreProgress');
                const fill = document.getElementById('restoreProgressFill');
                if (progress) progress.style.display='block';
                let pct = 0;
                const iv = setInterval(() => { pct += 25; if(fill) fill.style.width=pct+'%'; if(pct>=100) clearInterval(iv); }, 150);
                reader.onload = function(ev) {
                    try {
                        const data = JSON.parse(ev.target.result);
                        if (data.products) saveProducts(data.products);
                        if (data.users) saveUsers(data.users);
                        if (data.transactions) saveTransactions(data.transactions);
                        showNotification('Sukses', 'Database berhasil dipulihkan dari backup!');
                        setTimeout(() => { if(progress)progress.style.display='none'; fill.style.width='0'; runBackupRestore(); }, 1500);
                    } catch(err) {
                        showNotification('Gagal','File backup tidak valid atau rusak.','error');
                        if(progress)progress.style.display='none';
                    }
                };
                reader.readAsText(file);
            };
        }

        function renderBackupHistory(hist) {
            const el = document.getElementById('backupHistory');
            if (!el) return;
            if (!hist.length) {
                el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-grey);"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><div style="margin-top:12px;font-size:14px;">Belum ada riwayat backup. Lakukan backup pertama Anda.</div></div>';
                return;
            }
            el.innerHTML = hist.map(h => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--border-color);">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:40px;height:40px;border-radius:10px;background:#f0fdf4;color:var(--primary-green);display:flex;align-items:center;justify-content:center;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                        </div>
                        <div>
                            <div style="font-size:14px;font-weight:700;">backup-umkm-${h.date?.slice(0,10)}.json</div>
                            <div style="font-size:12px;color:var(--text-grey);margin-top:2px;">${h.items} · ${h.size}</div>
                        </div>
                    </div>
                    <div style="font-size:12px;color:var(--text-grey);">${new Date(h.date).toLocaleString('id-ID')}</div>
                </div>`).join('');
        }
    }

    // ─── Helper: showNotification ─────────────────────────────
    function showNotification(title, message, type='success') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(title, message, type);
        } else {
            // Simple fallback
            const div = document.createElement('div');
            div.style.cssText = `position:fixed;top:20px;right:20px;z-index:99999;background:${type==='error'?'#ef4444':'#10853e'};color:#fff;padding:14px 20px;border-radius:10px;font-family:Inter,sans-serif;font-size:14px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.15);max-width:320px;`;
            div.textContent = `${title}: ${message}`;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 3000);
        }
    }

}); // end DOMContentLoaded