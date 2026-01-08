MindMaze

MindMaze adalah game strategi maze berbasis web. Pemain harus menemukan jalan keluar dari labirin, mengumpulkan item, memecahkan puzzle, dan menghindari jebakan sampai mencapai titik exit.

Fitur

Maze / labirin

Puzzle sederhana

Sistem item dan kunci

Timer permainan

Kondisi menang dan kalah

Level kesulitan (easy, medium, hard)

Teknologi yang digunakan

Frontend:

React + Vite

TypeScript

Tailwind CSS

Backend:

Python

FastAPI

Uvicorn

Cara menjalankan
Menjalankan backend

Buka folder Backend

Install dependencies:

pip install -r requirements.txt


Jalankan server:

uvicorn main:app --reload


Backend akan berjalan di:

http://localhost:8000

Menjalankan frontend

Buka folder Frontend

Install dependencies:

npm install


Jalankan aplikasi:

npm run dev


Frontend akan berjalan di:

http://localhost:5173

Cara bermain

Pilih tingkat kesulitan

Masuk ke maze

Kumpulkan item atau kunci jika diperlukan

Hindari trap

Cari jalan menuju exit

Selesaikan sebelum waktu habis

Struktur folder
MindMaze/
 ├── Frontend/
 └── Backend/


Backend game logic berada di folder:

Backend/game/
