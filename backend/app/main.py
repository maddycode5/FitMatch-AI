import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes.voice import router as voice_router

app = FastAPI(
    title="FitMatch AI - Voice & Biometric Backend",
    description="Secure proxy & orchestration engine for Gnani Prisma STT, Timbre TTS, and Physiological Biometric Extraction",
    version="2.0.0"
)

# CORS Middleware allowing React frontend to communicate securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Voice & Biometrics Router
app.include_router(voice_router)

@app.get("/")
async def root():
    return {
        "engine": "FitMatch AI Biometrics & Voice Engine",
        "version": "2.0.0",
        "status": "active",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )

