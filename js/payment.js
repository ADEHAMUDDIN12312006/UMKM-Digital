document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const txId = params.get('tx_id') || 'TX-1001';
    const totalAmount = parseInt(params.get('total')) || 250000;

    // Populate TX ID & Amount
    const txEl = document.getElementById('paymentTxId');
    if (txEl) txEl.innerText = txId;

    const amountEl = document.getElementById('paymentAmount');
    if (amountEl) amountEl.innerText = `Rp ${totalAmount.toLocaleString('id-ID')}`;

    // Timer Countdown Logic (15 Minutes)
    let timeRemaining = 15 * 60; // 900 seconds
    const timerDisplay = document.getElementById('countdownTimer');

    if (timerDisplay) {
        const interval = setInterval(function() {
            let minutes = Math.floor(timeRemaining / 60);
            let seconds = timeRemaining % 60;

            minutes = minutes < 10 ? '0' + minutes : minutes;
            seconds = seconds < 10 ? '0' + seconds : seconds;

            timerDisplay.innerText = `${minutes}:${seconds}`;

            if (timeRemaining <= 0) {
                clearInterval(interval);
                timerDisplay.innerText = "KADALUARSA";
                showNotification('Peringatan', 'Waktu pembayaran Anda telah habis.', 'error');
            }
            timeRemaining--;
        }, 1000);
    }

    // File Upload Handlers
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('paymentProofFile');
    const preview = document.getElementById('uploadPreview');
    let hasUploadedFile = false;
    let uploadedFileBase64 = "";
    let isProcessingFile = false;

    function handleFileSelected(file) {
        if (!file) return;
        isProcessingFile = true;
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const max_size = 800; // max width/height to keep size low
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                uploadedFileBase64 = canvas.toDataURL('image/jpeg', 0.75); // compress to JPEG
                isProcessingFile = false;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    if (uploadZone && fileInput) {
        uploadZone.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const name = file.name;
                if (preview) preview.innerText = `Terpilih: ${name}`;
                hasUploadedFile = true;
                handleFileSelected(file);
                showNotification('Sukses', 'Bukti transfer berhasil dipilih.');
            }
        });

        // Drag and Drop simulation
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--primary-green)';
            uploadZone.style.background = '#f0fdf4';
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.style.borderColor = 'var(--text-light-grey)';
            uploadZone.style.background = 'var(--bg-light)';
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--text-light-grey)';
            uploadZone.style.background = 'var(--bg-light)';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                const name = file.name;
                if (preview) preview.innerText = `Terpilih: ${name}`;
                hasUploadedFile = true;
                handleFileSelected(file);
                showNotification('Sukses', 'Bukti transfer berhasil diletakkan.');
            }
        });
    }

    // Confirm Payment
    const confirmForm = document.getElementById('paymentConfirmForm');
    if (confirmForm) {
        confirmForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const isQrisPage = window.location.pathname.includes('pembayaran-qris');
            const isUploadPage = window.location.pathname.includes('upload-bukti');

            // For upload-bukti page, require proof upload
            if (isUploadPage && !hasUploadedFile) {
                showNotification('Peringatan', 'Harap unggah foto bukti transfer terlebih dahulu.', 'error');
                return;
            }

            if (isProcessingFile) {
                showNotification('Informasi', 'Sedang memproses gambar, silakan tunggu sebentar...', 'info');
                return;
            }

            const proofImgPath = hasUploadedFile 
                ? (uploadedFileBase64 || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmOGZhZmMiLz48cmVjdCB4PSI0MCIgeT0iMzAiIHdpZHRoPSIxMjAiIGhlaWdodD0iMTQwIiByeD0iOCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI2UyZThmMCIgc3Ryb2tlLXdpZHRoPSI0Ii8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iODAiIHI9IjIwIiBmaWxsPSIjMTA4NTNlIiBvcGFjaXR5PSIwLjgiLz48cGF0aCBkPSJNNzUgMTIwaDUwIE03NSAxNDBoMzUiIHN0cm9rZT0iI2NiZDVlMSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=") 
                : "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmMGZkZjQiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSIjMTA4NTNlIi8+PHBhdGggZD0iTTg1IDEwMGwxMCAxMCAyMC0yMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=";

            // Submit proof path to backend
            fetch(`../api/transactions/${txId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    proof_image: proofImgPath,
                    payment_status: "Pending"
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if (isQrisPage) {
                        showNotification('Sukses', 'Pembayaran QRIS dikonfirmasi! Lanjutkan unggah bukti pembayaran.');
                        setTimeout(() => {
                            window.location.href = `upload-bukti.html?tx_id=${txId}&total=${totalAmount}`;
                        }, 1200);
                    } else if (isUploadPage) {
                        showNotification('Sukses', 'Bukti pembayaran berhasil dikirim! Cek notifikasi Anda.');
                        setTimeout(() => {
                            window.location.href = `notifikasi.html`;
                        }, 1200);
                    } else {
                        showNotification('Sukses', 'Pembayaran berhasil dikonfirmasi.');
                        setTimeout(() => {
                            window.location.href = `verifikasi-pembayaran.html?tx_id=${txId}`;
                        }, 1200);
                    }
                } else {
                    showNotification('Gagal', data.message || 'Gagal mengirim konfirmasi.', 'error');
                }
            })
            .catch(err => {
                console.error('Error confirming payment:', err);
                showNotification('Error', 'Gagal menghubungkan ke server untuk melakukan konfirmasi.', 'error');
            });
        });
    }
});