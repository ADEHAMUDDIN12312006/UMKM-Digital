from flask import Flask, send_from_directory, request, jsonify, session
import os
import uuid
import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "super-secret-key-umkm-12345")

# Initialize Supabase Client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")

if not supabase_url or not supabase_key or "your-project" in supabase_url:
    raise ValueError("Supabase URL and Key are required. Please check your .env file configurations.")

supabase: Client = create_client(supabase_url, supabase_key)

# Helper to check if user is admin
def is_admin():
    return session.get('role') == 'admin'

# Helper to check if logged in
def is_logged_in():
    return 'username' in session


# =========================
# HALAMAN UTAMA & STATIC ROUTING
# =========================

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/pages/<path:filename>')
def pages(filename):
    return send_from_directory('pages', filename)

@app.route('/css/<path:filename>')
def css(filename):
    return send_from_directory('css', filename)

@app.route('/js/<path:filename>')
def js(filename):
    return send_from_directory('js', filename)

@app.route('/image/<path:filename>')
def image(filename):
    return send_from_directory('image', filename)

@app.route('/icons/<path:filename>')
def icons(filename):
    return send_from_directory('icons', filename)

@app.route('/components/<path:filename>')
def components(filename):
    return send_from_directory('components', filename)

@app.route('/login')
def login_route():
    return send_from_directory('pages', 'login.html')

@app.route('/register')
def register_route():
    return send_from_directory('pages', 'register.html')

@app.route('/dashboard-admin')
def dashboard_admin():
    return send_from_directory('pages', 'dashboard-admin.html')

@app.route('/dashboard-pembeli')
def dashboard_pembeli():
    return send_from_directory('pages', 'dashboard-pembeli.html')

@app.route('/management-produk')
def management_produk():
    return send_from_directory('pages', 'management-produk.html')

@app.route('/management-stok')
def management_stok():
    return send_from_directory('pages', 'management-stok.html')

@app.route('/kelola-pelanggan')
def kelola_pelanggan():
    return send_from_directory('pages', 'kelola-pelanggan.html')

@app.route('/kelola-transaksi')
def kelola_transaksi():
    return send_from_directory('pages', 'kelola-transaksi.html')

@app.route('/laporan-penjualan')
def laporan_penjualan():
    return send_from_directory('pages', 'laporan-penjualan.html')

@app.route('/backup-data')
def backup_data():
    return send_from_directory('pages', 'backup-data.html')

@app.route('/detail-produk')
def detail_produk():
    return send_from_directory('pages', 'detail-produk.html')

@app.route('/keranjang')
def keranjang():
    return send_from_directory('pages', 'keranjang.html')

@app.route('/checkout')
def checkout():
    return send_from_directory('pages', 'checkout.html')

@app.route('/pembayaran-qris')
def pembayaran_qris():
    return send_from_directory('pages', 'pembayaran-qris.html')

@app.route('/upload-bukti')
def upload_bukti():
    return send_from_directory('pages', 'upload-bukti.html')

@app.route('/verifikasi-pembayaran')
def verifikasi_pembayaran():
    return send_from_directory('pages', 'verifikasi-pembayaran.html')

@app.route('/riwayat-transaksi')
def riwayat_transaksi():
    return send_from_directory('pages', 'riwayat-transaksi.html')

@app.route('/notifikasi')
def notifikasi():
    return send_from_directory('pages', 'notifikasi.html')


# =========================
# DATABASE REST APIs (SUPABASE EXCLUSIVE)
# =========================

# --- Authentication APIs ---

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json or {}
    username_val = data.get('username', '').strip()
    password_val = data.get('password', '')

    if not username_val or not password_val:
        return jsonify({"success": False, "message": "Username dan password wajib diisi."}), 400

    # Query users
    try:
        # Search by username or email
        response = supabase.table('users').select('*').or_(f"username.eq.{username_val},email.eq.{username_val}").execute()
        users_list = response.data
    except Exception as e:
        return jsonify({"success": False, "message": f"Koneksi database gagal: {str(e)}"}), 500

    if not users_list:
        return jsonify({"success": False, "message": "Username atau email tidak terdaftar."}), 401

    user = users_list[0]
    if user['status'] != 'aktif':
        return jsonify({"success": False, "message": "Akun Anda dinonaktifkan. Silakan hubungi admin."}), 403

    if user['password'] == password_val:
        session['username'] = user['username']
        session['role'] = user['role']
        session['email'] = user['email']
        return jsonify({
            "success": True,
            "user": {
                "username": user['username'],
                "role": user['role'],
                "email": user['email']
            }
        })
    else:
        return jsonify({"success": False, "message": "Kata sandi salah."}), 401


@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.json or {}
    username_val = data.get('username', '').strip()
    email_val = data.get('email', '').strip()
    password_val = data.get('password', '')
    role_val = data.get('role', 'pembeli')

    if not username_val or not email_val or not password_val:
        return jsonify({"success": False, "message": "Semua field wajib diisi."}), 400

    if username_val.lower() == 'admin':
        return jsonify({"success": False, "message": "Username 'admin' tidak tersedia."}), 400

    try:
        # Check existing
        chk_response = supabase.table('users').select('username, email').or_(f"username.eq.{username_val},email.eq.{email_val}").execute()
        if chk_response.data:
            return jsonify({"success": False, "message": "Username atau Email sudah terdaftar."}), 400

        # Insert new user
        new_user = {
            "username": username_val,
            "email": email_val,
            "password": password_val,
            "role": role_val,
            "status": "aktif",
            "date_registered": datetime.datetime.utcnow().isoformat()
        }
        supabase.table('users').insert(new_user).execute()

        # Set session
        session['username'] = username_val
        session['role'] = role_val
        session['email'] = email_val

        # Create welcome notification
        welcome_notif = {
            "id": f"NOTIF-{int(datetime.datetime.utcnow().timestamp() * 1000)}",
            "username": username_val,
            "title": "Selamat Datang di UMKM Digital",
            "desc": "Terima kasih telah bergabung! Jelajahi produk lokal terbaik dari seluruh Indonesia.",
            "category": "sistem",
            "time": "Baru saja",
            "read": False,
            "date": datetime.datetime.utcnow().isoformat(),
            "icon_color": "#3b82f6",
            "icon_svg": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><circle cx="12" cy="11" r="1"></circle><line x1="12" y1="11" x2="12" y2="14"></line>'
        }
        supabase.table('notifications').insert(welcome_notif).execute()

        return jsonify({
            "success": True,
            "user": {
                "username": username_val,
                "role": role_val,
                "email": email_val
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Pendaftaran gagal: {str(e)}"}), 500


@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({"success": True})


@app.route('/api/user/status', methods=['GET'])
def api_user_status():
    if is_logged_in():
        return jsonify({
            "logged_in": True,
            "user": {
                "username": session.get('username'),
                "role": session.get('role'),
                "email": session.get('email')
            }
        })
    return jsonify({"logged_in": False})


@app.route('/api/user/profile', methods=['GET', 'POST', 'PUT'])
def api_user_profile():
    if not is_logged_in():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    username = session.get('username')

    if request.method == 'GET':
        try:
            res = supabase.table('users').select('*').eq('username', username).execute()
            if not res.data:
                return jsonify({"success": False, "message": "Profil tidak ditemukan."}), 404
            
            # Map database keys to frontend field naming
            user_data = res.data[0]
            mapped_user = {
                "username": user_data['username'],
                "email": user_data['email'],
                "role": user_data['role'],
                "status": user_data['status'],
                "fullName": user_data.get('fullname') or "",
                "phone": user_data.get('phone') or "",
                "birthdate": user_data.get('birthdate') or "",
                "address": user_data.get('address') or "",
                "postalCode": user_data.get('postal_code') or "",
                "receiverPhone": user_data.get('receiver_phone') or "",
                "avatar": user_data.get('avatar') or "",
                "lastModified": user_data.get('last_modified') or "",
                "date_registered": user_data.get('date_registered')
            }
            return jsonify({"success": True, "user": mapped_user})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

    # POST or PUT (update profile)
    data = request.json or {}
    
    # Map input frontend keys to database columns
    update_data = {}
    if 'fullName' in data: update_data['fullname'] = data['fullName']
    if 'email' in data: 
        update_data['email'] = data['email']
        session['email'] = data['email'] # sync session
    if 'phone' in data: update_data['phone'] = data['phone']
    if 'birthdate' in data: 
        # Birthdate can be empty string or date format
        val = data['birthdate']
        update_data['birthdate'] = val if val else None
    if 'address' in data: update_data['address'] = data['address']
    if 'postalCode' in data: update_data['postal_code'] = data['postalCode']
    if 'receiverPhone' in data: update_data['receiver_phone'] = data['receiverPhone']
    if 'avatar' in data: update_data['avatar'] = data['avatar']
    if 'password' in data: update_data['password'] = data['password']

    # Update modified timestamp
    date_now = datetime.datetime.now()
    time_str = date_now.strftime('%H:%M')
    date_str = date_now.strftime('%d %b %Y')
    update_data['last_modified'] = f"{date_str} pukul {time_str}"

    try:
        supabase.table('users').update(update_data).eq('username', username).execute()
        return jsonify({"success": True, "message": "Profil berhasil diperbarui."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# --- Products APIs ---

@app.route('/api/products', methods=['GET', 'POST'])
def api_products():
    if request.method == 'GET':
        try:
            res = supabase.table('products').select('*').order('id').execute()
            # Map rating and ulasan_count to floats/ints
            prods = []
            for p in res.data:
                p['price'] = float(p['price'])
                p['rating'] = float(p['rating']) if p.get('rating') else 5.0
                prods.append(p)
            return jsonify({"success": True, "products": prods})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

    # POST (create product)
    data = request.json or {}
    try:
        new_prod = {
            "id": data.get('id') or f"prod_{int(datetime.datetime.utcnow().timestamp())}",
            "name": data.get('name'),
            "description": data.get('description'),
            "price": float(data.get('price', 0)),
            "stock": int(data.get('stock', 0)),
            "category": data.get('category'),
            "rating": float(data.get('rating', 5.0)),
            "ulasan_count": int(data.get('ulasan_count', 0)),
            "image": data.get('image')
        }
        supabase.table('products').insert(new_prod).execute()
        return jsonify({"success": True, "product": new_prod})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/products/<id>', methods=['PUT', 'DELETE'])
def api_product_item(id):
    if request.method == 'PUT':
        data = request.json or {}
        update_fields = {}
        if 'name' in data: update_fields['name'] = data['name']
        if 'description' in data: update_fields['description'] = data['description']
        if 'price' in data: update_fields['price'] = float(data['price'])
        if 'stock' in data: update_fields['stock'] = int(data['stock'])
        if 'category' in data: update_fields['category'] = data['category']
        if 'image' in data: update_fields['image'] = data['image']
        if 'rating' in data: update_fields['rating'] = float(data['rating'])
        if 'ulasan_count' in data: update_fields['ulasan_count'] = int(data['ulasan_count'])

        try:
            supabase.table('products').update(update_fields).eq('id', id).execute()
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

    # DELETE
    try:
        supabase.table('products').delete().eq('id', id).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# --- Transactions APIs ---

@app.route('/api/transactions', methods=['GET', 'POST'])
def api_transactions():
    if not is_logged_in():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    username = session.get('username')
    role = session.get('role')

    if request.method == 'GET':
        try:
            if role == 'admin':
                res = supabase.table('transactions').select('*').order('date', desc=True).execute()
            else:
                res = supabase.table('transactions').select('*').eq('username', username).order('date', desc=True).execute()
            
            txs = []
            for t in res.data:
                t['subtotal'] = float(t['subtotal'])
                t['shipping_fee'] = float(t['shipping_fee'])
                t['service_fee'] = float(t['service_fee'])
                t['discount'] = float(t['discount'])
                t['total'] = float(t['total'])
                txs.append(t)
            return jsonify({"success": True, "transactions": txs})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

    # POST (create transaction)
    data = request.json or {}
    try:
        tx_id = f"TX-{int(datetime.datetime.utcnow().timestamp())}"
        new_tx = {
            "id": tx_id,
            "username": username,
            "items": data.get('items', []),
            "subtotal": float(data.get('subtotal', 0)),
            "shipping_fee": float(data.get('shipping_fee', 0)),
            "service_fee": float(data.get('service_fee', 0)),
            "discount": float(data.get('discount', 0)),
            "total": float(data.get('total', 0)),
            "shipping_address": data.get('shipping_address'),
            "postal_code": data.get('postal_code'),
            "phone": data.get('phone'),
            "payment_method": data.get('payment_method'),
            "payment_status": "Pending",
            "proof_image": "",
            "date": datetime.datetime.utcnow().isoformat()
        }
        supabase.table('transactions').insert(new_tx).execute()

        # Update product stocks
        for item in data.get('items', []):
            prod_id = item.get('id')
            qty = int(item.get('quantity', 0))
            
            # Fetch current stock
            p_res = supabase.table('products').select('stock').eq('id', prod_id).execute()
            if p_res.data:
                curr_stock = int(p_res.data[0]['stock'])
                new_stock = max(0, curr_stock - qty)
                # Update stock
                supabase.table('products').update({"stock": new_stock}).eq('id', prod_id).execute()

        # Create notification for user
        user_notif = {
            "id": f"NOTIF-{int(datetime.datetime.utcnow().timestamp() * 1000)}",
            "username": username,
            "title": "Pesanan Berhasil Dibuat",
            "desc": f"Pesanan {tx_id} dengan total Rp {int(new_tx['total']):,} sedang menunggu pembayaran.",
            "category": "transaksi",
            "time": "Baru saja",
            "read": False,
            "date": datetime.datetime.utcnow().isoformat(),
            "icon_color": "#0f5927",
            "icon_svg": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
        }
        supabase.table('notifications').insert(user_notif).execute()

        return jsonify({"success": True, "transaction_id": tx_id})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/transactions/<id>', methods=['GET', 'PUT'])
def api_transaction_item(id):
    if request.method == 'GET':
        try:
            res = supabase.table('transactions').select('*').eq('id', id).execute()
            if not res.data:
                return jsonify({"success": False, "message": "Transaksi tidak ditemukan."}), 404
            
            t = res.data[0]
            t['subtotal'] = float(t['subtotal'])
            t['shipping_fee'] = float(t['shipping_fee'])
            t['service_fee'] = float(t['service_fee'])
            t['discount'] = float(t['discount'])
            t['total'] = float(t['total'])
            return jsonify({"success": True, "transaction": t})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

    # PUT (update proof image or payment status)
    data = request.json or {}
    update_fields = {}
    if 'proof_image' in data: update_fields['proof_image'] = data['proof_image']
    if 'payment_status' in data: update_fields['payment_status'] = data['payment_status']

    try:
        # Fetch current record for user info
        orig_res = supabase.table('transactions').select('*').eq('id', id).execute()
        if not orig_res.data:
            return jsonify({"success": False, "message": "Transaksi tidak ditemukan."}), 404
        
        orig_tx = orig_res.data[0]
        tx_user = orig_tx['username']
        old_status = orig_tx['payment_status']
        new_status = data.get('payment_status')

        supabase.table('transactions').update(update_fields).eq('id', id).execute()

        # Handle notification alerts dynamically on status changes
        if new_status and new_status != old_status:
            notif_title = ""
            notif_desc = ""
            icon_color = "#3b82f6"
            icon_svg = ""
            
            if new_status == 'Pending' and data.get('proof_image'):
                notif_title = "Menunggu Verifikasi Pembayaran"
                notif_desc = f"Pembayaran untuk pesanan {id} sedang diverifikasi admin."
                icon_color = "#0f5927"
                icon_svg = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
            elif new_status == 'Selesai' or new_status == 'Success':
                notif_title = "Pembayaran Berhasil"
                notif_desc = f"Pembayaran pesanan {id} disetujui! Barang siap diproses."
                icon_color = "#10b981"
                icon_svg = '<polyline points="20 6 9 17 4 12"></polyline>'
            elif new_status == 'Diproses':
                notif_title = "Pesanan Sedang Diproses"
                notif_desc = f"Pesanan {id} sedang dikemas oleh penjual."
                icon_color = "#3b82f6"
                icon_svg = '<path d="M21.5 12H16c-.7 0-1.3-.3-1.7-.8l-2.6-3.4c-.4-.5-1-.8-1.7-.8H2.5"></path><path d="M2.5 12h5.5c.7 0 1.3.3 1.7.8l2.6 3.4c.4.5 1 .8 1.7.8h5.5"></path>'
            elif new_status == 'Dikirim':
                notif_title = "Pesanan Dikirim"
                notif_desc = f"Pesanan {id} telah diserahkan ke kurir pengiriman."
                icon_color = "#8b5cf6"
                icon_svg = '<rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>'
            elif new_status == 'Dibatalkan':
                notif_title = "Pesanan Dibatalkan"
                notif_desc = f"Pesanan {id} telah dibatalkan."
                icon_color = "#ef4444"
                icon_svg = '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'

            if notif_title:
                new_notif = {
                    "id": f"NOTIF-{int(datetime.datetime.utcnow().timestamp() * 1000)}",
                    "username": tx_user,
                    "title": notif_title,
                    "desc": notif_desc,
                    "category": "transaksi",
                    "time": "Baru saja",
                    "read": False,
                    "date": datetime.datetime.utcnow().isoformat(),
                    "icon_color": icon_color,
                    "icon_svg": icon_svg
                }
                supabase.table('notifications').insert(new_notif).execute()

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# --- Reviews APIs ---

@app.route('/api/reviews/<product_id>', methods=['GET', 'POST'])
def api_reviews(product_id):
    if request.method == 'GET':
        try:
            res = supabase.table('reviews').select('*').eq('product_id', product_id).order('date', desc=True).execute()
            return jsonify({"success": True, "reviews": res.data})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

    # POST (create review)
    if not is_logged_in():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.json or {}
    username = session.get('username')
    try:
        new_rev = {
            "product_id": product_id,
            "username": username,
            "author": data.get('author', username),
            "rating": int(data.get('rating', 5)),
            "content": data.get('content', ''),
            "date": datetime.datetime.utcnow().isoformat()
        }
        supabase.table('reviews').insert(new_rev).execute()

        # Recalculate average rating & counts
        revs_res = supabase.table('reviews').select('rating').eq('product_id', product_id).execute()
        if revs_res.data:
            tot = len(revs_res.data)
            s = sum(int(r['rating']) for r in revs_res.data)
            avg = round(s / tot, 1)

            # Update product
            supabase.table('products').update({"rating": avg, "ulasan_count": tot}).eq('id', product_id).execute()

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# --- Notifications APIs ---

@app.route('/api/notifications', methods=['GET'])
def api_notifications():
    if not is_logged_in():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    username = session.get('username')
    role = session.get('role')

    try:
        # Load notifications
        if role == 'admin':
            res = supabase.table('notifications').select('*').order('date', desc=True).execute()
        else:
            res = supabase.table('notifications').select('*').eq('username', username).order('date', desc=True).execute()
        return jsonify({"success": True, "notifications": res.data})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/notifications/<id>', methods=['PUT'])
def api_notification_item(id):
    if not is_logged_in():
        return jsonify({"success": False, "message": "Unauthorized"}), 401
    
    try:
        supabase.table('notifications').update({"read": True}).eq('id', id).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# --- Chatbot API ---

@app.route('/api/tanya-ai', methods=['POST'])
def api_tanya_ai():
    data = request.json or {}
    msg = data.get('message', '').strip().lower()

    if not msg:
        return jsonify({"success": False, "message": "Message is required."}), 400

    # Match keywords to database key
    db_key = ""
    if any(k in msg for k in ["kirim", "ongkir", "sicepat", "jne", "j&t"]):
        db_key = "shipping"
    elif any(k in msg for k in ["bayar", "qris", "transfer", "rekening"]):
        db_key = "payments"
    elif any(k in msg for k in ["promo", "diskon", "voucher"]):
        db_key = "promo"
    elif any(k in msg for k in ["retur", "kembali", "komplain", "rusak"]):
        db_key = "returns"
    elif any(k in msg for k in ["halo", "hi", "pagi", "siang", "sore", "malam"]):
        db_key = "welcome"

    try:
        # If matches, fetch from Supabase
        if db_key:
            res = supabase.table('ai_knowledge').select('value').eq('key', db_key).execute()
            if res.data:
                return jsonify({"success": True, "response": res.data[0]['value']})
        
        # Product recommendations mapping
        if "kopi" in msg or "gayo" in msg:
            res = supabase.table('products').select('name, price').eq('id', 'prod_2').execute()
            if res.data:
                return jsonify({"success": True, "response": f"Kami merekomendasikan **{res.data[0]['name']}**. Kopi Arabika asli dari dataran tinggi Gayo Aceh seharga Rp {int(res.data[0]['price']):,}."})
        elif "tas" in msg or "anyaman" in msg:
            res = supabase.table('products').select('name, price').eq('id', 'prod_1').execute()
            if res.data:
                return jsonify({"success": True, "response": f"Kami merekomendasikan **{res.data[0]['name']}** seharga Rp {int(res.data[0]['price']):,}."})
        elif "batik" in msg or "solo" in msg:
            res = supabase.table('products').select('name, price').eq('id', 'prod_3').execute()
            if res.data:
                return jsonify({"success": True, "response": f"Kami merekomendasikan **{res.data[0]['name']}** seharga Rp {int(res.data[0]['price']):,}."})
        elif "vas" in msg or "keramik" in msg:
            res = supabase.table('products').select('name, price').eq('id', 'prod_4').execute()
            if res.data:
                return jsonify({"success": True, "response": f"Kami merekomendasikan **{res.data[0]['name']}** seharga Rp {int(res.data[0]['price']):,}."})

        # General response
        res = supabase.table('ai_knowledge').select('value').eq('key', 'welcome').execute()
        default_resp = res.data[0]['value'] if res.data else "Maaf, saya kurang mengerti pertanyaan Anda."
        fallback = f"{default_resp} Anda bisa menanyakan tentang produk (tas, kopi, batik, vas), rekomendasi belanja, promo voucher diskon, info pengiriman (ongkir), atau metode pembayaran."
        return jsonify({"success": True, "response": fallback})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# --- Admin Dashboard and Synchronization APIs ---

@app.route('/api/admin/users', methods=['GET'])
def api_admin_users():
    if not is_logged_in() or not is_admin():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    try:
        res = supabase.table('users').select('*').order('username').execute()
        users_list = []
        for u in res.data:
            # Map database keys to frontend naming
            users_list.append({
                "username": u['username'],
                "email": u['email'],
                "role": u['role'],
                "status": u['status'],
                "fullName": u.get('fullname') or "",
                "phone": u.get('phone') or "",
                "birthdate": u.get('birthdate') or "",
                "address": u.get('address') or "",
                "postalCode": u.get('postal_code') or "",
                "receiverPhone": u.get('receiver_phone') or "",
                "avatar": u.get('avatar') or "",
                "lastModified": u.get('last_modified') or "",
                "date_registered": u.get('date_registered')
            })
        return jsonify({"success": True, "users": users_list})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/admin/users/<username>', methods=['PUT'])
def api_admin_user_update(username):
    if not is_logged_in() or not is_admin():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.json or {}
    update_fields = {}
    if 'status' in data: update_fields['status'] = data['status']
    if 'role' in data: update_fields['role'] = data['role']

    try:
        supabase.table('users').update(update_fields).eq('username', username).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/admin/products/sync', methods=['POST'])
def api_admin_products_sync():
    if not is_logged_in() or not is_admin():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.json or {}
    products_list = data.get('products', [])

    try:
        # Get all current product IDs in database
        db_res = supabase.table('products').select('id').execute()
        db_ids = {p['id'] for p in db_res.data}
        incoming_ids = set()

        for p in products_list:
            p_id = p.get('id')
            if not p_id: continue
            incoming_ids.add(p_id)

            prod_row = {
                "id": p_id,
                "name": p.get('name'),
                "description": p.get('description'),
                "price": float(p.get('price', 0)),
                "stock": int(p.get('stock', 0)),
                "category": p.get('category'),
                "rating": float(p.get('rating', 5.0)),
                "ulasan_count": int(p.get('ulasan_count', 0)),
                "image": p.get('image')
            }

            if p_id in db_ids:
                supabase.table('products').update(prod_row).eq('id', p_id).execute()
            else:
                supabase.table('products').insert(prod_row).execute()

        # Delete products not in incoming list
        for d_id in db_ids - incoming_ids:
            supabase.table('products').delete().eq('id', d_id).execute()

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/admin/transactions/sync', methods=['POST'])
def api_admin_transactions_sync():
    if not is_logged_in() or not is_admin():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.json or {}
    transactions_list = data.get('transactions', [])

    try:
        db_res = supabase.table('transactions').select('id').execute()
        db_ids = {t['id'] for t in db_res.data}

        for t in transactions_list:
            t_id = t.get('id')
            if not t_id: continue

            tx_row = {
                "id": t_id,
                "username": t.get('username'),
                "items": t.get('items', []),
                "subtotal": float(t.get('subtotal', 0)),
                "shipping_fee": float(t.get('shipping_fee', 0)),
                "service_fee": float(t.get('service_fee', 0)),
                "discount": float(t.get('discount', 0)),
                "total": float(t.get('total', 0)),
                "shipping_address": t.get('address') or t.get('shipping_address') or "",
                "postal_code": t.get('postal_code') or "10000",
                "phone": t.get('phone') or "",
                "payment_method": t.get('payment_method', 'qris'),
                "payment_status": t.get('payment_status', 'Pending'),
                "proof_image": t.get('proof_image', ''),
                "date": t.get('date') or datetime.datetime.utcnow().isoformat()
            }

            if t_id in db_ids:
                supabase.table('transactions').update(tx_row).eq('id', t_id).execute()
            else:
                supabase.table('transactions').insert(tx_row).execute()

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/admin/users/sync', methods=['POST'])
def api_admin_users_sync():
    if not is_logged_in() or not is_admin():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.json or {}
    users_list = data.get('users', [])

    try:
        db_res = supabase.table('users').select('username').execute()
        db_usernames = {u['username'] for u in db_res.data}

        for u in users_list:
            uname = u.get('username')
            if not uname: continue

            user_row = {
                "username": uname,
                "email": u.get('email'),
                "role": u.get('role', 'pembeli'),
                "status": u.get('status', 'aktif'),
                "fullname": u.get('fullName'),
                "phone": u.get('phone'),
                "birthdate": u.get('birthdate') if u.get('birthdate') else None,
                "address": u.get('address'),
                "postal_code": u.get('postalCode'),
                "receiver_phone": u.get('receiverPhone'),
                "avatar": u.get('avatar'),
                "last_modified": u.get('lastModified')
            }

            if uname in db_usernames:
                # Don't overwrite password if not in sync payload
                if 'password' in u:
                    user_row['password'] = u['password']
                supabase.table('users').update(user_row).eq('username', uname).execute()
            else:
                if 'password' in u:
                    user_row['password'] = u['password']
                else:
                    user_row['password'] = 'user'
                supabase.table('users').insert(user_row).execute()

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)