document.addEventListener('DOMContentLoaded', function() {
    // 1. Load dynamic cart and summary data
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const summaryData = JSON.parse(localStorage.getItem('checkoutSummary'));

    if (cart.length === 0 || !summaryData) {
        showNotification('Peringatan', 'Keranjang belanja kosong.', 'error');
        setTimeout(() => {
            window.location.href = 'keranjang.html';
        }, 1500);
        return;
    }

    // Populate Checkout Summary UI
    populateSummary(cart, summaryData);

    // Pre-fill shipping address fields from user profile if available
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        fetch('../api/user/profile')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const fullUserRecord = data.user;
                    const fullNameEl = document.getElementById('fullName');
                    const addressEl = document.getElementById('addressDetails');
                    const phoneEl = document.getElementById('phoneNumber');
                    const postalEl = document.getElementById('postalCode');

                    if (fullNameEl) fullNameEl.value = fullUserRecord.fullName || fullUserRecord.username || '';
                    if (addressEl) addressEl.value = fullUserRecord.address || '';
                    if (phoneEl) phoneEl.value = fullUserRecord.receiverPhone || fullUserRecord.phone || '';
                    if (postalEl) postalEl.value = fullUserRecord.postalCode || '';
                }
            })
            .catch(err => console.error('Error pre-filling profile info:', err));
    }

    // 2. Payment Method Selector Toggle
    const paymentOptions = document.querySelectorAll('.payment-option-row');
    let selectedPayment = 'qris'; // default

    if (paymentOptions.length > 0) {
        paymentOptions.forEach(option => {
            option.addEventListener('click', function() {
                paymentOptions.forEach(opt => {
                    opt.classList.remove('selected');
                    const radioCircle = opt.querySelector('.radio-circle');
                    if (radioCircle) {
                        radioCircle.innerHTML = '';
                    }
                });

                this.classList.add('selected');
                
                const radioCircle = this.querySelector('.radio-circle');
                if (radioCircle) {
                    radioCircle.innerHTML = '<span class="radio-dot"></span>';
                }

                selectedPayment = this.getAttribute('data-value');
                console.log('Payment method selected:', selectedPayment);
            });
        });
    }

    // 3. Submit Checkout Form Action
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value.trim();
            const address = document.getElementById('addressDetails').value.trim();
            const phone = document.getElementById('phoneNumber').value.trim();
            const postal = document.getElementById('postalCode').value.trim();

            if (!fullName || !address || !phone || !postal) {
                showNotification('Error', 'Semua field pengiriman harus diisi.', 'error');
                return;
            }

            // Construct payload
            const payload = {
                items: cart,
                subtotal: summaryData.subtotal,
                shipping_fee: summaryData.shipping,
                service_fee: summaryData.service,
                discount: summaryData.discount,
                total: summaryData.total,
                shipping_address: `${fullName}, ${address}`,
                postal_code: postal,
                phone: phone,
                payment_method: selectedPayment
            };

            // Post transaction to API
            fetch('../api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showNotification('Sukses', 'Pesanan berhasil dibuat!');
                    
                    // Clear cart data
                    localStorage.removeItem('cart');
                    localStorage.removeItem('checkoutSummary');
                    if (typeof updateCartBadge === 'function') {
                        updateCartBadge();
                    }

                    setTimeout(() => {
                        if (selectedPayment === 'qris') {
                            window.location.href = `pembayaran-qris.html?tx_id=${data.transaction_id}&total=${summaryData.total}`;
                        } else {
                            window.location.href = `upload-bukti.html?tx_id=${data.transaction_id}&total=${summaryData.total}`;
                        }
                    }, 1500);
                } else {
                    showNotification('Gagal', data.message || 'Gagal membuat transaksi.', 'error');
                }
            })
            .catch(err => {
                console.error('Error submitting checkout:', err);
                showNotification('Error', 'Gagal memproses transaksi pada server.', 'error');
            });
        });
    }

    function populateSummary(cartItems, summary) {
        const listContainer = document.querySelector('.summary-items-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        cartItems.forEach(item => {
            const imgUrl = (item.image && item.image.startsWith('data:')) ? item.image : '../' + item.image;
            listContainer.innerHTML += `
                <div class="summary-item-row">
                    <div class="summary-item-left">
                        <div class="summary-item-thumb">
                            <img src="${imgUrl}" alt="${item.name}" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmM2Y0ZjYiLz48cGF0aCBkPSJNMzAgMzBoNDB2NDBIMzB6IiBmaWxsPSIjZTVlN2ViIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjEwIiBmaWxsPSIjOWNhM2FmIi8+PC9zdmc+';">
                        </div>
                        <div class="summary-item-info">
                            <h4>${item.name}</h4>
                            <p>Qty: ${item.quantity}</p>
                        </div>
                    </div>
                    <span class="summary-item-price">Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
            `;
        });

        // Set subtotal and fees
        const breakdown = document.querySelector('.pricing-breakdown');
        if (breakdown) {
            let discountHtml = '';
            if (summary.discount > 0) {
                discountHtml = `
                    <div class="pricing-row" style="color:#10853e; font-weight:600;">
                        <span>Discount Promo</span>
                        <span class="price-val">- Rp ${summary.discount.toLocaleString('id-ID')}</span>
                    </div>
                `;
            }

            breakdown.innerHTML = `
                <div class="pricing-row">
                    <span>Subtotal</span>
                    <span class="price-val">Rp ${summary.subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div class="pricing-row">
                    <span>Shipping Fee</span>
                    <span class="price-val">Rp ${summary.shipping.toLocaleString('id-ID')}</span>
                </div>
                <div class="pricing-row">
                    <span>Service Fee</span>
                    <span class="price-val">Rp ${summary.service.toLocaleString('id-ID')}</span>
                </div>
                ${discountHtml}
            `;
        }

        // Total
        const totalVal = document.querySelector('.total-value');
        if (totalVal) {
            totalVal.innerText = `Rp ${summary.total.toLocaleString('id-ID')}`;
        }
    }
});