import io
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from pydantic import BaseModel
from app.services.gnani_stt import transcribe_audio
from app.services.gnani_tts import synthesize_speech
from app.services.measurement_extractor import extract_measurements
from app.services.gnani_fallback import fallback_manager
from app.config import settings

router = APIRouter(prefix="/api/voice", tags=["Voice Engine"])

class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None
    lang: Optional[str] = None
    speed: Optional[float] = 0.95

class ExtractRequest(BaseModel):
    transcript: str
    default_dimension: Optional[str] = "chest_cm"

@router.post("/stt")
async def speech_to_text(
    file: Optional[UploadFile] = File(None),
    active_dimension: str = Form("chest_cm"),
    lang: str = Form("en-IN"),
    text_fallback: Optional[str] = Form(None)
):
    """
    STT Endpoint:
    Receives recorded audio from React frontend, forwards to Gnani Prisma,
    extracts biometric measurements, validates physiological bounds,
    and returns a structured confirmation payload.
    """
    transcript = ""
    stt_meta = {}

    if file:
        audio_bytes = await file.read()
        content_type = file.content_type or "audio/webm"
        stt_result = await transcribe_audio(audio_bytes, content_type=content_type, lang=lang)
        stt_meta = stt_result

        if stt_result.get("success"):
            transcript = stt_result.get("transcript", "")
        else:
            # If Gnani returns error or local fallback is requested, allow text_fallback if supplied
            if text_fallback:
                transcript = text_fallback
            else:
                return {
                    "success": False,
                    "error_type": stt_result.get("error_type", "STT_FAILED"),
                    "detail": stt_result.get("detail", "Speech recognition failed."),
                    "use_local_fallback": stt_result.get("use_local_fallback", True),
                    "transcript": "",
                    "measurements": []
                }
    elif text_fallback:
        transcript = text_fallback
    else:
        raise HTTPException(status_code=400, detail="Either 'file' audio upload or 'text_fallback' is required.")

    # Numerical Biometric Extraction & Physiological Validation in Backend
    extraction = extract_measurements(transcript, default_dimension=active_dimension)

    return {
        "success": True,
        "transcript": transcript,
        "intent": extraction["intent"],
        "measurements": extraction["measurements"],
        "primaryMeasurement": extraction["primaryMeasurement"],
        "confirmationPrompt": extraction["confirmationPrompt"],
        "keyStatus": fallback_manager.get_status(),
        "sttMeta": {
            "key_used": stt_meta.get("key_used"),
            "key_label": stt_meta.get("key_label")
        }
    }

@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    """
    TTS Endpoint:
    Receives tailoring guidance text, calls Gnani Timbre with configured Voice Clone ID,
    and returns binary audio stream.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    audio_bytes, content_type, meta = await synthesize_speech(
        text=req.text,
        voice_id=req.voice_id or settings.GNANI_VOICE_CLONE_ID,
        lang=req.lang or settings.GNANI_LANG,
        speed=req.speed or 0.95
    )

    if not meta.get("success") or not audio_bytes:
        return Response(
            content=b"",
            status_code=502 if meta.get("use_local_fallback") else 400,
            headers={
                "X-Voice-Fallback": "true",
                "X-Voice-Error": meta.get("detail", "TTS failed")
            }
        )

    return Response(
        content=audio_bytes,
        media_type=content_type,
        headers={
            "X-Voice-Key-Used": str(meta.get("key_used", "")),
            "X-Voice-ID": str(meta.get("voice_id", "")),
            "Cache-Control": "public, max-age=3600"
        }
    )

@router.post("/extract")
async def extract_only(req: ExtractRequest):
    """Direct measurement extraction testing endpoint."""
    return extract_measurements(req.transcript, default_dimension=req.default_dimension or "chest_cm")

@router.get("/status")
async def get_status():
    """Returns key pool failover health and configuration."""
    return {
        "status": "online",
        "gnaniConfig": {
            "voiceCloneId": settings.GNANI_VOICE_CLONE_ID,
            "lang": settings.GNANI_LANG,
            "ttsEndpoint": settings.GNANI_TTS_ENDPOINT,
            "sttEndpoint": settings.GNANI_STT_ENDPOINT
        },
        "keyPool": fallback_manager.get_status()
    }

