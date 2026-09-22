from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from routers import process, realtime
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Language Reactor API",
    description="Backend for processing Mandarin videos and audio.",
    version="1.0.0"
)

# Setup CORS to allow local frontend to communicate with backend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"  # Allows pinggy/localtunnel for mobile testing
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("temp", exist_ok=True)
app.mount("/media", StaticFiles(directory="temp"), name="media")

@app.get("/")
def read_root():
    return {"message": "Welcome to Language Reactor API"}

app.include_router(process.router)
app.include_router(realtime.router)
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
