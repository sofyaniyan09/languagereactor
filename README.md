# Mandarin Video Learning (Language Reactor Clone)

Proyek ini terdiri dari dua bagian utama: **Backend** (FastAPI) dan **Frontend** (React/Vite). Ikuti langkah-langkah di bawah ini untuk menjalankan proyek secara lokal dari terminal Anda.

---

## 1. Menjalankan Backend (FastAPI)

Buka terminal baru, lalu jalankan perintah berikut secara berurutan:

```bash
# 1. Masuk ke folder backend
cd ~/Documents/languagereactor/backend

# 2. Aktifkan virtual environment
source venv/bin/activate

# 3. Jalankan server FastAPI (dengan auto-reload)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
> **Catatan:** Backend akan berjalan di `http://localhost:8000`. Biarkan terminal ini tetap terbuka.

---

## 2. Menjalankan Frontend (React + Vite)

Buka **jendela terminal baru** (biarkan terminal backend tetap menyala), lalu jalankan perintah berikut:

```bash
# 1. Masuk ke folder frontend
cd ~/Documents/languagereactor/frontend

# 2. Jalankan server Vite
npm run dev -- --host
```
> **Catatan:** Frontend akan berjalan di `http://localhost:5173`. Flag `--host` digunakan agar frontend bisa diakses melalui jaringan lokal (HP/Mobile).

---

## 3. (Opsional) Menjalankan Pinggy untuk Testing di iPhone/Mobile

Jika Anda ingin menguji fitur mikrofon di HP (membutuhkan koneksi HTTPS yang aman), Anda bisa menggunakan layanan tunneling seperti Pinggy.

Buka **jendela terminal baru**, lalu jalankan:

```bash
ssh -o StrictHostKeyChecking=no -p 443 -R0:localhost:5173 a.pinggy.io
```

Setelah perintah dijalankan, Anda akan mendapatkan URL publik (contoh: `https://xxxx-xxx.free.pinggy.net`). Buka URL tersebut di Safari iPhone Anda. (Ingat, link Pinggy gratis akan kedaluwarsa setiap 60 menit).

---

## Prasyarat Lingkungan
Pastikan Anda memiliki file `.env` di dalam folder `backend/` yang berisi kunci API berikut:
```env
# Groq API (Untuk Transkripsi Audio/Whisper & Terjemahan)
GROQ_API_KEY=your_groq_key_here

# (Opsional) Gemini API 
GEMINI_API_KEY=your_gemini_key_here
```
