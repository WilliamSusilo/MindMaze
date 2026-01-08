<img width="1536" height="226" alt="image" src="https://github.com/user-attachments/assets/eda89caf-1af9-4fbe-9b8b-07422a41a1f1" />

**Selamat datang di MindMaze. Sebuah game strategi berbasis web yang dibangun menggunakan TypeScript dan Python.**

# MindMaze

MindMaze adalah sebuah game strategi berbasis web yang berfokus pada tantangan logika dan pemecahan masalah. Game ini dirancang untuk melatih kemampuan berpikir, analisis, dan pengambilan keputusan pemain melalui sistem puzzle yang progresif.

## Tentang Proyek
MindMaze dikembangkan menggunakan arsitektur frontend dan backend yang terpisah untuk menjaga struktur proyek tetap modular, mudah dikembangkan, dan scalable.
MindMaze bertujuan untuk menjadi game puzzle yang tidak hanya menantang, tetapi juga stabil secara teknis dan mudah diperluas. Setiap mekanisme permainan dibangun di atas logika yang jelas dan terstruktur, sehingga memungkinkan penambahan fitur baru tanpa merusak sistem yang sudah ada.

Proyek ini masih dalam tahap pengembangan dan terbuka untuk kontribusi.


<img width="2559" height="1234" alt="image" src="https://github.com/user-attachments/assets/d5f3dba7-649a-49da-9b21-5d7f270ccc25" />

### Backend
- Python
- FastAPI
- Uvicorn (ASGI server)

### Frontend
- React
- Vite
- TypeScript
- HTML dan CSS


MindMaze/
```bash
├── Backend/ # Server, API, dan logika game
├── Frontend/ # Client, UI, dan tampilan game
├── .gitignore
├── LICENSE
└── README.md
```

## Getting Started

Ikuti langkah-langkah berikut untuk menjalankan MindMaze di lingkungan lokal.

Pastikan Anda sudah menginstal:
- Python 3.x
- Node.js dan npm

---

## Menjalankan Backend


1. Masuk ke folder Backend:
```bash
cd Backend
```
2. (Opsional) Install dependency jika belum:

```bash
pip install -r requirements.txt
```
3. Jalankan server backend:
```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Backend akan berjalan di:
```bash
http://127.0.0.1:8000
```

## Menjalankan Frontend
1. Masuk ke folder Frontend:
```bash
cd Frontend
```
2. Install dependency:
```bash
npm install
```

3. Jalankan development server:
```bash
npm run dev
```
Frontend akan berjalan pada alamat yang ditampilkan oleh Vite di terminal.

## Alur Pengembangan

Backend dan frontend dijalankan secara terpisah pada terminal masing-masing.
Frontend akan berkomunikasi dengan backend melalui API yang disediakan oleh FastAPI.

Disarankan untuk:

- Menjalankan backend terlebih dahulu
- Memastikan endpoint API dapat diakses
- Baru kemudian menjalankan frontend

## Debugging

Untuk debugging:

- Backend dapat di-debug langsung melalui log FastAPI dan Uvicorn

- Frontend dapat di-debug melalui browser DevTools dan output Vite

Struktur proyek dirancang agar debugging dapat dilakukan secara terpisah antara client dan server.
