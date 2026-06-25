document.addEventListener('DOMContentLoaded', function() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let discount = 0;
    const shippingFee = 15000;
    const serviceFee = 2000;
    let promoCodeApplied = localStorage.getItem('claimedPromoCode') || "";

    const cartContainer = document.querySelector('.cart-container');
    
    // Check if the page is keranjang.html
    if (cartContainer) {
        renderCart();
    }

    function renderCart() {
        const cartMain = document.querySelector('.cart-main');
        const summaryBlock = document.getElementById('cartSummaryContainer');
        
        if (cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-cart-state" style="width:100%;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <h3>Keranjang Belanja Kosong</h3>
                    <p>Anda belum menambahkan produk unggulan lokal apapun.</p>
                    <a href="../index.html" class="btn-hero" style="font-size:14px; padding:10px 20px;">Belanja Sekarang</a>
                </div>
            `;
            return;
        }

        // Render Table
        let tableHtml = `
            <table class="cart-table">
                <thead>
                    <tr>
                        <th>Produk</th>
                        <th>Harga</th>
                        <th>Jumlah</th>
                        <th>Subtotal</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
        `;

        cart.forEach((item, index) => {
            const itemSubtotal = item.price * item.quantity;
            const imgUrl = (item.image && item.image.startsWith('data:')) ? item.image : '../' + item.image;
            tableHtml += `
                <tr data-index="${index}">
                    <td>
                        <div class="cart-item-info">
                            <img src="${imgUrl}" alt="${item.name}" class="cart-item-img" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmM2Y0ZjYiLz48cGF0aCBkPSJNMzAgMzBoNDB2NDBIMzB6IiBmaWxsPSIjZTVlN2ViIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjEwIiBmaWxsPSIjOWNhM2FmIi8+PC9zdmc+';">
                            <div class="cart-item-details">
                                <h4>${item.name}</h4>
                            </div>
                        </div>
                    </td>
                    <td>Rp ${item.price.toLocaleString('id-ID')}</td>
                    <td>
                        <div class="qty-control">
                            <button class="qty-btn-cart btn-minus-cart">−</button>
                            <input type="text" class="qty-input-cart" value="${item.quantity}" readonly>
                            <button class="qty-btn-cart btn-plus-cart">+</button>
                        </div>
                    </td>
                    <td>Rp ${itemSubtotal.toLocaleString('id-ID')}</td>
                    <td>
                        <button class="btn-remove-item" aria-label="Hapus produk">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        });

        tableHtml += `
                </tbody>
            </table>
        `;

        cartMain.innerHTML = `
            <h1 class="cart-title">Keranjang Belanja</h1>
            ${tableHtml}
        `;

        // Bind events on elements
        bindCartEvents();
        updateSummary();
    }

    function bindCartEvents() {
        const rows = document.querySelectorAll('.cart-table tbody tr');
        rows.forEach(row => {
            const idx = parseInt(row.getAttribute('data-index'));
            const btnMinus = row.querySelector('.btn-minus-cart');
            const btnPlus = row.querySelector('.btn-plus-cart');
            const btnRemove = row.querySelector('.btn-remove-item');

            btnMinus.onclick = function() {
                if (cart[idx].quantity > 1) {
                    cart[idx].quantity -= 1;
                    saveCart();
                }
            };

            btnPlus.onclick = function() {
                cart[idx].quantity += 1;
                saveCart();
            };

            btnRemove.onclick = function() {
                cart.splice(idx, 1);
                saveCart();
                showNotification('Sukses', 'Produk dihapus dari keranjang.');
            };
        });

        // Promo apply action
        const btnPromo = document.getElementById('btnPromoApply');
        const promoInput = document.getElementById('promoInput');
        
        if (btnPromo && promoInput) {
            if (promoCodeApplied === 'MULAIDIGITAL') {
                promoInput.value = 'MULAIDIGITAL';
            }
            btnPromo.onclick = function() {
                const code = promoInput.value.trim().toUpperCase();
                if (code === 'MULAIDIGITAL') {
                    promoCodeApplied = code;
                    localStorage.setItem('claimedPromoCode', code);
                    showNotification('Sukses', 'Kode promo berhasil digunakan! Diskon 50% diterapkan.');
                    updateSummary();
                } else if (code === "") {
                    promoCodeApplied = "";
                    localStorage.removeItem('claimedPromoCode');
                    showNotification('Peringatan', 'Masukkan kode promo terlebih dahulu.', 'error');
                    updateSummary();
                } else {
                    showNotification('Gagal', 'Kode promo tidak valid.', 'error');
                }
            };
        }

        // Checkout Button Action
        const btnCheckout = document.getElementById('btnCheckoutCart');
        if (btnCheckout) {
            btnCheckout.onclick = function(e) {
                e.preventDefault();
                
                function proceedToCheckout() {
                    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    const total = subtotal + shippingFee + serviceFee - discount;
                    
                    const summaryData = {
                        subtotal: subtotal,
                        shipping: shippingFee,
                        service: serviceFee,
                        discount: discount,
                        total: total,
                        promoCode: promoCodeApplied
                    };

                    localStorage.setItem('checkoutSummary', JSON.stringify(summaryData));
                    window.location.href = 'checkout.html';
                }

                fetch('../api/user/status')
                    .then(res => res.json())
                    .then(data => {
                        if (data.logged_in) {
                            proceedToCheckout();
                        } else {
                            showNotification('Peringatan', 'Anda harus masuk/login terlebih dahulu untuk checkout.', 'error');
                            setTimeout(() => {
                                window.location.href = 'login.html';
                            }, 1500);
                        }
                    })
                    .catch(err => {
                        console.log('Error verifying login:', err);
                        showNotification('Error', 'Gagal memverifikasi status login.', 'error');
                    });
            };
        }
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        if (typeof updateCartBadge === 'function') {
            updateCartBadge();
        }
    }

    function updateSummary() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Calculate Discount
        if (promoCodeApplied === 'MULAIDIGITAL') {
            discount = Math.min(50000, subtotal * 0.5); // 50% discount capped at Rp 50.000
        } else {
            discount = 0;
        }

        const total = subtotal + shippingFee + serviceFee - discount;

        document.getElementById('sumSubtotal').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
        document.getElementById('sumShipping').innerText = `Rp ${shippingFee.toLocaleString('id-ID')}`;
        document.getElementById('sumService').innerText = `Rp ${serviceFee.toLocaleString('id-ID')}`;
        
        const discountRow = document.getElementById('sumDiscountRow');
        const discountVal = document.getElementById('sumDiscount');
        if (discount > 0) {
            discountRow.style.display = 'flex';
            discountVal.innerText = `- Rp ${discount.toLocaleString('id-ID')}`;
        } else {
            discountRow.style.display = 'none';
        }

        document.getElementById('sumTotal').innerText = `Rp ${total.toLocaleString('id-ID')}`;
    }
});
