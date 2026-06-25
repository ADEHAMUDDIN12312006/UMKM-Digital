document.addEventListener('DOMContentLoaded', function() {
    // ========== TOGGLE PASSWORD (Login Page) ==========
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            if (type === 'text') {
                togglePassword.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                togglePassword.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    }

    // ========== LOGIN FORM ==========
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const usernameVal = document.getElementById('username').value.trim();
            const passwordVal = document.getElementById('password').value;

            fetch('../api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameVal, password: passwordVal })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    alert('Login berhasil! Menghubungkan...');
                    setTimeout(() => {
                        if (data.user.role === 'admin') {
                            window.location.href = 'dashboard-admin.html';
                        } else {
                            window.location.href = '../index.html';
                        }
                    }, 1000);
                } else {
                    alert(data.message || 'Username/password salah.');
                }
            })
            .catch(err => {
                console.error('Error logging in:', err);
                alert('Gagal menghubungkan ke server.');
            });
        });
    }

    // ========== REGISTER FORM (User biasa / pembeli) ==========
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const usernameVal = document.getElementById('regUsername').value.trim();
            const emailVal = document.getElementById('regEmail').value.trim();
            const passwordVal = document.getElementById('regPassword').value;
            const confirmVal = document.getElementById('regConfirmPassword').value;

            // Validasi password match
            if (passwordVal !== confirmVal) {
                alert('Konfirmasi kata sandi tidak cocok.');
                return;
            }

            // Tidak boleh daftar dengan username 'admin'
            if (usernameVal === 'admin') {
                alert('Username "admin" tidak tersedia.');
                return;
            }

            // Default role: pembeli (user biasa)
            const roleVal = 'pembeli';

            fetch('../api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: usernameVal,
                    email: emailVal,
                    password: passwordVal,
                    role: roleVal
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    localStorage.removeItem('cart');
                    alert('Pendaftaran akun berhasil!');
                    setTimeout(() => {
                        window.location.href = '../index.html';
                    }, 1200);
                } else {
                    alert(data.message || 'Pendaftaran gagal.');
                }
            })
            .catch(err => {
                console.error('Error registering:', err);
                alert('Gagal menghubungkan ke server untuk melakukan pendaftaran.');
            });
        });
    }
});