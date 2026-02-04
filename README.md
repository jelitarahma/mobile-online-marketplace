# Online Marketplace Mobile App 📱

Aplikasi mobile **Online Marketplace**, dibangun menggunakan **React Native** dan **Expo**. Aplikasi ini terintegrasi dengan backend API secara real-time untuk memberikan pengalaman belanja yang mulus di perangkat Android dan iOS.

## 🚀 Fitur Utama

- **Daftar Produk**: Menampilkan katalog produk terbaru dari server.
- **Detail Produk**: Informasi lengkap produk termasuk harga, deskripsi, dan gambar.
- **Autentikasi User**: Fitur Login dan Register dengan keamanan token JWT.
- **Manajemen Keranjang**: Menambah dan mengelola item belanja.
- **Riwayat Pesanan**: Melihat status dan detail transaksi sebelumnya.
- **Mode Admin**: Akses khusus untuk mengelola produk dan pesanan langsung dari aplikasi.

## 🛠️ Teknologi yang Digunakan

- **React Native & Expo**: Framework utama aplikasi.
- **Axios**: Library untuk komunikasi data dengan API.
- **Expo Secure Store**: Penyimpanan token JWT secara aman di perangkat.
- **React Navigation**: Navigasi antar layar dalam aplikasi.
- **Context API**: Manajemen state global (Auth & Cart).

## 📦 Persyaratan Sistem

- **Node.js**: Versi 18 atau lebih baru.
- **Expo Go App**: Terinstal di HP (Android/iOS) untuk pengujian.
- **EAS CLI**: (Opsional) Untuk publikasi cloud.

## ⚙️ Cara Clone & Instalasi

Ikuti langkah-langkah berikut untuk menjalankan project ini di komputer lokal Anda:

1. **Clone Repository**:
   ```bash
   git clone https://github.com/jelitarahma/mobile-online-marketplace.git
   cd mobile-online-marketplace
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Konfigurasi API**:
   Buka file `src/services/api.js` dan pastikan `BASE_URL` mengarah ke backend deployment.
   ```javascript
   const BASE_URL = 'https://backend-online-marketplace.vercel.app';
   ```

3. **Jalankan Project**:
   ```bash
   npx expo start
   ```

4. **Scan QR Code**:
   Buka aplikasi **Expo Go** di HP Anda dan scan QR Code yang muncul di terminal.

## ☁️ Akses Publik (Tanpa Laptop Menyala)

Aplikasi ini telah dipublikasikan menggunakan **Expo EAS Update**. Anda dapat mencobanya kapan saja tanpa perlu menjalankan server lokal.

1. Install **Expo Go** di HP Anda.
2. Scan QR Code publik yang tersedia di dokumentasi pdf dokumentasi.
![alt text](image-2.png)
3. Aplikasi akan otomatis terbuka di perangkat Anda.

## 💡 Troubleshooting
Jika Anda menemui error **"The connection appears to be offline"** atau HP tidak bisa connect saat scan QR code:

1. **Gunakan Mode Tunnel**: Jika laptop dan HP di jaringan Wi-Fi berbeda (atau Wi-Fi publik), jalankan expo dengan flag tunnel:
   ```bash
   npx expo start --tunnel
   ```
2. **Wi-Fi yang Sama**: Pastikan Laptop dan HP di Wi-Fi yang sama.
3. **Firewall**: Matikan Firewall Windows atau izinkan port `8081`.

---
