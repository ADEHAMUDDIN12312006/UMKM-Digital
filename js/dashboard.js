document.addEventListener('DOMContentLoaded', function() {
    let currentUser = null;

    // Check user authentication status
    fetch('../api/user/status')
        .then(res => res.json())
        .then(data => {
            if (data.logged_in) {
                currentUser = data.user;
                if (currentUser.role === 'admin') {
                    window.location.href = 'dashboard-admin.html';
                    return;
                }
                setupDashboard();
            } else {
                showNotification('Peringatan', 'Silakan login untuk mengakses dashboard.', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            }
        })
        .catch(err => {
            console.error('Error verifying user status:', err);
            showNotification('Error', 'Gagal memverifikasi status masuk.', 'error');
        });

    function setupDashboard() {
        // Set welcome message username
        const nameEl = document.getElementById('buyerWelcomeName');
        if (nameEl && currentUser) {
            nameEl.innerText = currentUser.username.toUpperCase();
        }

        // Load transaction list
        loadTransactions();

        // Setup Chatbot
        setupChatbot();
    }

    function getTxLink(tx) {
        const paymentMethod = tx.payment_method || 'qris';
        const status = tx.payment_status || 'Pending';
        if (status.toLowerCase() === 'pending') {
            if (paymentMethod === 'qris') {
                return `pembayaran-qris.html?tx_id=${tx.id}&total=${tx.total}`;
            } else {
                return `upload-bukti.html?tx_id=${tx.id}&total=${tx.total}`;
            }
        } else {
            return `verifikasi-pembayaran.html?tx_id=${tx.id}`;
        }
    }

    function loadTransactions() {
        const tbody = document.getElementById('txTableBody');
        if (!tbody) return;

        fetch('../api/transactions')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    tbody.innerHTML = '';
                    if (data.transactions.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-grey); padding:24px;">Belum ada pesanan dibuat.</td></tr>';
                        return;
                    }

                    // Sort newest first
                    const sorted = data.transactions.sort((a,b) => new Date(b.date) - new Date(a.date));

                    sorted.forEach(tx => {
                        const dateStr = new Date(tx.date).toLocaleDateString('id-ID', {
                            year: 'numeric', month: 'short', day: 'numeric'
                        });

                        let statusClass = 'pending';
                        if (tx.payment_status.toLowerCase() === 'selesai' || tx.payment_status.toLowerCase() === 'success') statusClass = 'success';
                        if (tx.payment_status.toLowerCase() === 'dibatalkan' || tx.payment_status.toLowerCase() === 'failed') statusClass = 'failed';

                        const txLink = getTxLink(tx);

                        tbody.innerHTML += `
                            <tr>
                                <td><a href="${txLink}" style="color: #10853e; font-weight: bold; text-decoration: underline;">${tx.id}</a></td>
                                <td>${dateStr}</td>
                                <td>Rp ${tx.total.toLocaleString('id-ID')}</td>
                                <td><span class="status-badge ${statusClass}">${tx.payment_status}</span></td>
                            </tr>
                        `;
                    });
                }
            })
            .catch(err => {
                console.error('Error fetching transactions:', err);
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-grey); padding:24px;">Gagal memuat transaksi dari server.</td></tr>';
            });
    }

    function setupChatbot() {
        const container = document.getElementById('chatMessages');
        const input = document.getElementById('chatInput');
        const sendBtn = document.getElementById('chatSendBtn');

        if (!container || !input || !sendBtn) return;

        // Append initial AI welcome bubble
        appendChatBubble('Halo! Selamat datang di Layanan Pelanggan AI UMKM Digital. Saya siap membantu menjelaskan detail produk, memberikan rekomendasi, atau mengecek status transaksi Anda. Ada yang bisa saya bantu?', 'ai');

        // Submit action
        function submitMessage() {
            const message = input.value.trim();
            if (!message) return;

            // Clear input
            input.value = '';

            // Append user bubble
            appendChatBubble(message, 'user');

            // Send to API
            fetch('../api/tanya-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Simulate chatbot typing delay
                    setTimeout(() => {
                        appendChatBubble(data.response, 'ai');
                    }, 500);
                }
            })
            .catch(err => {
                console.error('Error communicating with AI:', err);
                appendChatBubble('Maaf, sistem AI sedang offline. Silakan coba beberapa saat lagi.', 'ai');
            });
        }

        sendBtn.onclick = submitMessage;
        input.onkeydown = function(e) {
            if (e.key === 'Enter') {
                submitMessage();
            }
        };
    }

    function appendChatBubble(text, sender) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}`;
        
        // Parse basic markdown-like bold text **text** into <strong>text</strong>
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Parse newline characters into <br>
        formattedText = formattedText.replace(/\n/g, '<br>');

        bubble.innerHTML = formattedText;
        container.appendChild(bubble);

        // Scroll container to bottom
        container.scrollTop = container.scrollHeight;
    }
});