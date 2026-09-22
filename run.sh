#!/bin/bash

# Warna untuk output terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Memulai Language Reactor Clone...${NC}"

# Fungsi untuk mematikan semua proses ketika script dihentikan (Ctrl+C)
cleanup() {
    echo -e "\n${YELLOW}Mematikan semua server...${NC}"
    kill 0
    exit 0
}

# Tangkap sinyal interrupt (Ctrl+C) dan jalankan fungsi cleanup
trap cleanup SIGINT SIGTERM

# 1. Jalankan Backend FastAPI di background
echo -e "${BLUE}Menjalankan Backend FastAPI...${NC}"
cd backend || exit
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Beri waktu sebentar agar backend siap
sleep 2

# 2. Jalankan Frontend React/Vite di background
echo -e "${BLUE}Menjalankan Frontend Vite...${NC}"
cd frontend || exit
npm run dev -- --host &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}=======================================${NC}"
echo -e "${GREEN}Semua server berhasil dijalankan!${NC}"
echo -e "${GREEN}Backend: http://localhost:8000${NC}"
echo -e "${GREEN}Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}=======================================${NC}"
echo -e "${YELLOW}Tekan Ctrl+C untuk mematikan semua server.${NC}\n"

# Tunggu sampai salah satu proses selesai (agar script tidak langsung tertutup)
wait
