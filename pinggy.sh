#!/bin/bash

# Warna untuk output terminal
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Memulai Pinggy Tunnel untuk port 5173 (Frontend)...${NC}"
echo -e "${BLUE}Mohon tunggu sebentar, link publik Anda akan segera muncul di bawah ini.${NC}"
echo -e "${BLUE}(Ingat: Link versi gratis akan kedaluwarsa dalam 60 menit)${NC}"
echo -e "========================================================\n"

# Menjalankan SSH pinggy
ssh -o StrictHostKeyChecking=no -p 443 -R0:localhost:5173 a.pinggy.io
