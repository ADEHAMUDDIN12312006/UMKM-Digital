document.addEventListener('DOMContentLoaded', function() {
    let currentProduct = null;
    let maxStock = 15;

    // Parse product ID from URL
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('id') || 'prod_1';

    // Fetch products and find correct one
    fetch('../api/products')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentProduct = data.products.find(p => p.id === prodId);
                if (currentProduct) {
                    populateProductDetails(currentProduct);
                    populateRecommendations(data.products, prodId);
                } else {
                    showNotification('Error', 'Produk tidak ditemukan.', 'error');
                }
            }
        })
        .catch(err => {
            console.error('Error fetching product details:', err);
            showNotification('Error', 'Gagal memuat detail produk dari server.', 'error');
        });

    // Handle Kunjungi Toko Button
    const btnVisitStore = document.querySelector('.btn-visit-store');
    if (btnVisitStore) {
        btnVisitStore.onclick = function(e) {
            e.preventDefault();
            showNotification('Toko Mitra', 'Menghubungkan ke toko Artisan Borneo... Profil toko akan segera hadir!', 'success');
        };
    }

    function populateRecommendations(products, currentId) {
        const grid = document.querySelector('.recommendation-grid');
        if (!grid) return;

        // Get up to 4 other products
        const recommendations = products.filter(p => p.id !== currentId).slice(0, 4);

        grid.innerHTML = '';
        recommendations.forEach(p => {
            const imgUrl = (p.image && p.image.startsWith('data:')) ? p.image : '../' + p.image;
            grid.innerHTML += `
                <article class="product-card">
                    <div class="card-img-wrapper">
                        <img src="${imgUrl}" alt="${p.name}" class="product-card-img" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmM2Y0ZjYiLz48cGF0aCBkPSJNMzAgMzBoNDB2NDBIMzB6IiBmaWxsPSIjZTVlN2ViIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjEwIiBmaWxsPSIjOWNhM2FmIi8+PC9zdmc+';" style="width: 100%; height: 100%; object-fit: cover;">
                        <button class="btn-wishlist" aria-label="Tambah ke wishlist" onclick="toggleWishlistInline(event, this)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="card-content">
                        <span class="card-category">${p.category}</span>
                        <h3 class="card-title">${p.name.length > 25 ? p.name.substring(0, 25) + '...' : p.name}</h3>
                        <div class="card-price">Rp ${p.price.toLocaleString('id-ID')}</div>
                        <a href="detail-produk.html?id=${p.id}" class="btn-card-detail">Lihat Detail</a>
                    </div>
                </article>
            `;
        });
    }

    window.toggleWishlistInline = function(event, btn) {
        event.preventDefault();
        event.stopPropagation();
        const svg = btn.querySelector('svg');
        const isFilled = svg.getAttribute('fill') === '#ef4444';
        if (isFilled) {
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            btn.style.color = 'var(--text-grey)';
            showNotification('Wishlist', 'Produk dihapus dari wishlist.');
        } else {
            svg.setAttribute('fill', '#ef4444');
            svg.setAttribute('stroke', '#ef4444');
            btn.style.color = '#ef4444';
            showNotification('Wishlist', 'Produk ditambahkan ke wishlist.');
        }
    };

    function populateProductDetails(p) {
        maxStock = p.stock;
        
        // Update texts
        document.title = `${p.name} - UMKM Digital`;
        const titleEl = document.querySelector('.product-title');
        if (titleEl) titleEl.innerText = p.name;
        
        const catEl = document.querySelector('.category-badge');
        if (catEl) catEl.innerText = p.category;

        const ratingValEl = document.querySelector('.rating-stars strong');
        if (ratingValEl) ratingValEl.innerText = p.rating || 5.0;

        const reviewCountEl = document.querySelector('.rating-stars span');
        if (reviewCountEl) reviewCountEl.innerText = `(${p.ulasan_count || 0} Ulasan)`;

        const stockEl = document.querySelector('.stock-count');
        if (stockEl) {
            stockEl.innerText = `${p.stock} tersedia`;
            if (p.stock === 0) {
                stockEl.innerText = 'Habis';
                stockEl.style.color = '#ef4444';
            }
        }

        const priceEl = document.querySelector('.product-price-box span');
        if (priceEl) priceEl.innerText = `Rp ${p.price.toLocaleString('id-ID')}`;

        const descEl = document.querySelector('.details-description');
        if (descEl) descEl.innerText = p.description || '';

        const imgUrl = (p.image && p.image.startsWith('data:')) ? p.image : '../' + p.image;

        // Update image
        const mainImg = document.getElementById('mainProductImg');
        if (mainImg) {
            mainImg.src = imgUrl;
            mainImg.alt = p.name;
        }

        // Setup thumbnails
        const thumbImgs = document.querySelectorAll('.thumbnail-card img');
        if (thumbImgs.length > 0 && thumbImgs[0]) {
            thumbImgs[0].src = imgUrl;
            thumbImgs[0].alt = p.name;
        }
        const firstThumb = document.querySelector('.thumbnail-card');
        if (firstThumb && mainImg) {
            // Force reset main image to correct source
            const mainImgInWrapper = document.querySelector('.main-image-box img');
            if (mainImgInWrapper) mainImgInWrapper.src = imgUrl;
        }
    }

    // 1. Quantity Selector Functionality
    const qtyInput = document.getElementById('qtyInput');
    const btnMinus = document.getElementById('btnMinus');
    const btnPlus = document.getElementById('btnPlus');

    if (qtyInput && btnMinus && btnPlus) {
        btnMinus.addEventListener('click', function() {
            let currentVal = parseInt(qtyInput.value) || 1;
            if (currentVal > 1) {
                qtyInput.value = currentVal - 1;
            }
        });

        btnPlus.addEventListener('click', function() {
            let currentVal = parseInt(qtyInput.value) || 1;
            if (currentVal < maxStock) {
                qtyInput.value = currentVal + 1;
            }
        });

        qtyInput.addEventListener('change', function() {
            let val = parseInt(qtyInput.value);
            if (isNaN(val) || val < 1) {
                qtyInput.value = 1;
            } else if (val > maxStock) {
                qtyInput.value = maxStock;
            }
        });
    }

    // 2. Thumbnail Switcher Functionality
    const mainImg = document.getElementById('mainProductImg');
    const thumbnails = document.querySelectorAll('.thumbnail-card');

    if (mainImg && thumbnails.length > 0) {
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', function() {
                // Remove active class from all thumbnails
                thumbnails.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked thumbnail
                this.classList.add('active');

                // Determine what content is in the thumbnail
                const img = this.querySelector('img');
                const svg = this.querySelector('svg');

                // Clear main image container children or update image src
                const imgContainer = document.querySelector('.main-image-box');
                
                if (img) {
                    const newSrc = img.getAttribute('src');
                    const newAlt = img.getAttribute('alt');
                    
                    imgContainer.innerHTML = `
                        <img id="mainProductImg" src="${newSrc}" alt="${newAlt}">
                        <div class="gallery-actions">
                            <button class="gallery-action-btn btn-wishlist-gallery" aria-label="Tambah ke wishlist" id="btnWishlist">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            </button>
                            <button class="gallery-action-btn btn-share-gallery" aria-label="Bagikan produk">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="18" cy="5" r="3"></circle>
                                    <circle cx="6" cy="12" r="3"></circle>
                                    <circle cx="18" cy="19" r="3"></circle>
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                </svg>
                            </button>
                        </div>
                    `;
                    bindWishlistEvent();
                } else if (svg) {
                    const svgClone = svg.cloneNode(true);
                    svgClone.setAttribute('width', '100%');
                    svgClone.setAttribute('height', '100%');
                    
                    imgContainer.innerHTML = '';
                    imgContainer.appendChild(svgClone);
                    
                    const actionDiv = document.createElement('div');
                    actionDiv.className = 'gallery-actions';
                    actionDiv.innerHTML = `
                        <button class="gallery-action-btn btn-wishlist-gallery" aria-label="Tambah ke wishlist" id="btnWishlist">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                        <button class="gallery-action-btn btn-share-gallery" aria-label="Bagikan produk">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                        </button>
                    `;
                    imgContainer.appendChild(actionDiv);
                    bindWishlistEvent();
                }
            });
        });
    }

    // 3. Wishlist Heart Button Event Binding
    function bindWishlistEvent() {
        const btnWishlist = document.getElementById('btnWishlist');
        if (btnWishlist) {
            btnWishlist.addEventListener('click', function() {
                const svg = this.querySelector('svg');
                if (svg.getAttribute('fill') === 'none' || !svg.getAttribute('fill')) {
                    svg.setAttribute('fill', '#ef4444');
                    svg.setAttribute('stroke', '#ef4444');
                    this.style.color = '#ef4444';
                    showNotification('Wishlist', 'Produk ditambahkan ke wishlist.');
                } else {
                    svg.setAttribute('fill', 'none');
                    svg.setAttribute('stroke', 'currentColor');
                    this.style.color = 'var(--text-dark)';
                    showNotification('Wishlist', 'Produk dihapus dari wishlist.');
                }
            });
        }
    }
    
    // Initialize wishlist binding
    bindWishlistEvent();

    // 4. Cart Operations
    const btnAddToCart = document.querySelector('.btn-add-to-cart');
    const btnBuyNow = document.querySelector('.btn-buy-now');

    if (btnAddToCart) {
        btnAddToCart.addEventListener('click', function() {
            if (!currentProduct) return;
            const qty = parseInt(qtyInput.value) || 1;
            addToCart(currentProduct, qty);
            showNotification('Sukses', 'Produk ditambahkan ke keranjang belanja.');
        });
    }

    if (btnBuyNow) {
        btnBuyNow.addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentProduct) return;
            const qty = parseInt(qtyInput.value) || 1;

            function proceedToBuyNow() {
                addToCart(currentProduct, qty);

                const shippingFee = 15000;
                const serviceFee = 2000;
                
                // Construct checkout summary for this transaction
                let currentCart = JSON.parse(localStorage.getItem('cart')) || [];
                const subtotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const total = subtotal + shippingFee + serviceFee;

                const summaryData = {
                    subtotal: subtotal,
                    shipping: shippingFee,
                    service: serviceFee,
                    discount: 0,
                    total: total,
                    promoCode: ""
                };

                localStorage.setItem('checkoutSummary', JSON.stringify(summaryData));
                window.location.href = 'checkout.html';
            }

            fetch('../api/user/status')
                .then(res => res.json())
                .then(data => {
                    if (data.logged_in) {
                        proceedToBuyNow();
                    } else {
                        showNotification('Peringatan', 'Anda harus masuk/login terlebih dahulu untuk checkout.', 'error');
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 1500);
                    }
                })
                .catch(err => {
                    console.log('Error verifying status:', err);
                    showNotification('Error', 'Gagal memverifikasi status login.', 'error');
                });
        });
    }

    function addToCart(product, qty) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingIdx = cart.findIndex(item => item.id === product.id);

        if (existingIdx > -1) {
            cart[existingIdx].quantity = Math.min(product.stock, cart[existingIdx].quantity + qty);
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: qty
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        // Trigger updateCartBadge if function exists globally
        if (typeof updateCartBadge === 'function') {
            updateCartBadge();
        }
    }

    // ─── Ulasan (Reviews) System ──────────────────────────────────
    let reviews = [];

    function fetchAndRenderReviews() {
        fetch(`../api/reviews/${prodId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    reviews = data.reviews;
                    renderReviewsList();
                }
            })
            .catch(err => console.error('Error fetching reviews:', err));
    }

    fetchAndRenderReviews();
    initReviewForm();

    function renderReviewsList() {
        const reviewsContainer = document.getElementById('reviewsList');
        if (!reviewsContainer) return;

        if (reviews.length === 0) {
            reviewsContainer.innerHTML = `<div class="empty-reviews-state">Belum ada ulasan untuk produk ini. Jadilah yang pertama memberikan ulasan!</div>`;
            updateReviewsSummary(0, 0, {1:0, 2:0, 3:0, 4:0, 5:0});
            return;
        }

        // Sort reviews descending by date
        const sortedReviews = [...reviews].sort((a,b) => new Date(b.date) - new Date(a.date));

        reviewsContainer.innerHTML = sortedReviews.map(r => {
            const dateStr = new Date(r.date).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });
            const initial = r.author.slice(0, 1).toUpperCase();
            
            // Create star icons
            let starsHtml = '';
            for(let i=1; i<=5; i++) {
                const fill = i <= r.rating ? '#fbbf24' : 'none';
                const stroke = i <= r.rating ? '#fbbf24' : '#cbd5e1';
                starsHtml += `
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                `;
            }

            return `
                <div class="review-item-card">
                    <div class="review-header">
                        <div class="review-author-info">
                            <div class="review-avatar">${initial}</div>
                            <div>
                                <div class="review-author-name">${r.author}</div>
                                <div class="review-stars">${starsHtml}</div>
                            </div>
                        </div>
                        <span class="review-date">${dateStr}</span>
                    </div>
                    <p class="review-text">${r.content}</p>
                </div>
            `;
        }).join('');

        // Calculate summary
        const total = reviews.length;
        const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
        const avg = (sum / total).toFixed(1);

        const dist = {1:0, 2:0, 3:0, 4:0, 5:0};
        reviews.forEach(r => {
            if (dist[r.rating] !== undefined) dist[r.rating]++;
        });

        updateReviewsSummary(avg, total, dist);
    }

    function updateReviewsSummary(avg, total, dist) {
        // Set numbers
        const avgNumEl = document.getElementById('avgRatingNum');
        if (avgNumEl) avgNumEl.innerText = avg;

        const countEl = document.getElementById('totalReviewsCount');
        if (countEl) countEl.innerText = `Berdasarkan ${total} ulasan`;

        // Update main product details page rating and review counts dynamically!
        const productRatingEl = document.querySelector('.rating-stars strong');
        if (productRatingEl) productRatingEl.innerText = avg > 0 ? avg : '0';

        const productReviewsCountEl = document.querySelector('.rating-stars span');
        if (productReviewsCountEl) productReviewsCountEl.innerText = `(${total} Ulasan)`;

        // Update rating summary big stars
        const avgStarsContainer = document.getElementById('avgRatingStars');
        if (avgStarsContainer) {
            let starsHtml = '';
            const roundedAvg = Math.round(avg);
            for(let i=1; i<=5; i++) {
                const fill = i <= roundedAvg ? '#fbbf24' : 'none';
                const stroke = i <= roundedAvg ? '#fbbf24' : '#cbd5e1';
                starsHtml += `
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                `;
            }
            avgStarsContainer.innerHTML = starsHtml;
        }

        // Render progress bars
        const barsContainer = document.getElementById('ratingBarsContainer');
        if (barsContainer) {
            let barsHtml = '';
            for(let i=5; i>=1; i--) {
                const count = dist[i] || 0;
                const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                barsHtml += `
                    <div class="rating-bar-row">
                        <span>${i}★</span>
                        <div class="rating-bar-track">
                            <div class="rating-bar-fill" style="width: ${pct}%;"></div>
                        </div>
                        <span style="width: 24px; color: var(--text-grey); font-weight: 500;">${count}</span>
                    </div>
                `;
            }
            barsContainer.innerHTML = barsHtml;
        }
    }

    function initReviewForm() {
        const form = document.getElementById('addReviewForm');
        const starsBtns = document.querySelectorAll('#starRatingSelector button');
        const authorInput = document.getElementById('reviewAuthor');
        const contentInput = document.getElementById('reviewContent');
        
        let selectedRating = 5;

        // Pre-fill name if logged in
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser && authorInput) {
            authorInput.value = currentUser.username;
        }

        // Rating selector interaction
        starsBtns.forEach(btn => {
            btn.onclick = function() {
                const val = parseInt(this.dataset.val);
                selectedRating = val;
                
                // Highlight active stars
                starsBtns.forEach(b => {
                    const bVal = parseInt(b.dataset.val);
                    if (bVal <= val) {
                        b.classList.add('active');
                    } else {
                        b.classList.remove('active');
                    }
                });
            };
        });

        // Set initial 5-star highlight
        starsBtns.forEach(b => {
            if (parseInt(b.dataset.val) <= selectedRating) {
                b.classList.add('active');
            }
        });

        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                
                const newReview = {
                    author: authorInput.value.trim(),
                    rating: selectedRating,
                    content: contentInput.value.trim()
                };

                fetch(`../api/reviews/${prodId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newReview)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        contentInput.value = '';
                        selectedRating = 5;
                        starsBtns.forEach(b => b.classList.add('active'));
                        showNotification('Sukses', 'Ulasan Anda berhasil dikirim!');
                        fetchAndRenderReviews();
                    } else {
                        showNotification('Gagal', data.message || 'Gagal mengirim ulasan.', 'error');
                    }
                })
                .catch(err => {
                    console.error('Error posting review:', err);
                    showNotification('Error', 'Gagal mengirim ulasan ke server.', 'error');
                });
            };
        }
    }
});
