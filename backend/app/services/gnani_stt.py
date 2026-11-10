import asyncio
import httpx
import logging
from typing import Dict, Any, Optional
from app.config import settings
from app.services.gnani_fallback import fallback_manager

logger = logging.getLogger("gnani_stt")

# Supported audio MIME types for Gnani Prisma STT
SUPPORTED_AUDIO_TYPES = [
    "audio/wav", "audio/x-wav", "audio/wave",
    "audio/webm", "audio/ogg", "audio/mpeg", "audio/mp3", "audio/mp4"
]

async def transcribe_audio(
    audio_bytes: bytes,
    content_type: str = "audio/webm",
    lang: str = "en-IN"
) -> Dict[str, Any]:
    """
    Forwards audio to Gnani Prisma STT with intelligent key rotation & failover.
    Validates audio format and language before dispatching to prevent burning attempts.
    """
    # 1. Validation: Audio presence & format
    if not audio_bytes or len(audio_bytes) < 100:
        return {
            "success": False,
            "error_type": "INVALID_AUDIO",
            "detail": "Audio recording is empty or too short. Please speak clearly.",
            "transcript": ""
        }

    # Normalize content-type
    normalized_ct = content_type.split(";")[0].strip().lower()
    if normalized_ct not in SUPPORTED_AUDIO_TYPES and not normalized_ct.startswith("audio/"):
        return {
            "success": False,
            "error_type": "UNSUPPORTED_MEDIA_TYPE",
            "detail": f"Unsupported audio format '{content_type}'. Expected WAV, WebM, MP3, or OGG.",
            "transcript": ""
        }

    # 2. Key Check
    key = fallback_manager.get_active_key()
    if not key:
        return {
            "success": False,
            "error_type": "ALL_KEYS_EXHAUSTED",
            "detail": "All Gnani Cloud API keys have exhausted quota or are unconfigured.",
            "use_local_fallback": True,
            "transcript": ""
        }

    # 3. Request loop serialized through global lock (Gnani allows max 1 concurrent active request)
    async with fallback_manager.api_lock:
        key = fallback_manager.get_active_key()
        async with httpx.AsyncClient(timeout=5.0) as client:
            retries_429 = 0
            while key:
                headers = {
                    "X-API-Key-ID": key.access_key,
                    "x-api-key": key.access_key
                }

                try:
                    ext = "wav" if "wav" in normalized_ct else ("ogg" if "ogg" in normalized_ct else ("mp3" if "mp3" in normalized_ct else "webm"))
                    files = {
                        "audio_file": (f"recording.{ext}", audio_bytes, normalized_ct)
                    }
                    data = {
                        "language_code": lang or settings.GNANI_LANG or "en-IN"
                    }

                    logger.info(f"[Gnani STT] Sending {ext.upper()} audio ({len(audio_bytes)} bytes) using {key.label}...")
                    response = await client.post(
                        settings.GNANI_STT_ENDPOINT,
                        headers=headers,
                        files=files,
                        data=data
                    )

                    # Handle temporary 429 concurrency limit without exhausting keys
                    if response.status_code == 429 and not fallback_manager.should_rotate_on_status(response.status_code, response.text):
                        if retries_429 < 2:
                            retries_429 += 1
                            logger.info(f"[Gnani STT] Rate limit pause, retrying ({retries_429}/2)...")
                            await asyncio.sleep(0.6)
                            continue
                        return {
                            "success": False,
                            "error_type": "RATE_LIMITED",
                            "detail": "Gnani STT rate limit busy.",
                            "transcript": "",
                            "use_local_fallback": True
                        }

                    # Check for quota exhaustion
                    if fallback_manager.should_rotate_on_status(response.status_code, response.text):
                        fallback_manager.mark_exhausted(key.key_id, f"HTTP {response.status_code} quota exhausted")
                        key = fallback_manager.get_active_key()
                        continue

                    # Client validation errors: Do NOT rotate keys
                    if response.status_code in (400, 415, 422):
                        logger.warning(f"[Gnani STT] Client validation error {response.status_code}: {response.text}")
                        return {
                            "success": False,
                            "error_type": "VALIDATION_ERROR",
                            "detail": f"Gnani STT validation error: {response.text}",
                            "use_local_fallback": True,
                            "transcript": ""
                        }

                    if response.status_code == 200:
                        result = response.json() if "application/json" in response.headers.get("content-type", "") else {"transcript": response.text}
                        transcript = (
                            result.get("transcript") or 
                            result.get("text") or 
                            result.get("result", {}).get("transcript") or 
                            result.get("data", {}).get("transcript") or
                            ""
                        ).strip()

                        return {
                            "success": True,
                            "transcript": transcript,
                            "key_used": key.key_id,
                            "key_label": key.label,
                            "raw_response": result
                        }

                    # Temporary server error (500, 502, 503) -> Log without blind key exhaustion
                    logger.error(f"[Gnani STT] Upstream error {response.status_code}: {response.text}")
                    return {
                        "success": False,
                        "error_type": "UPSTREAM_ERROR",
                        "detail": f"Gnani STT service returned HTTP {response.status_code}",
                        "transcript": "",
                        "use_local_fallback": True
                    }

                except httpx.TimeoutException:
                    # Crucial guideline: Never blindly retry on timeout (request may have processed and charged)
                    logger.error(f"[Gnani STT] Request timeout using {key.label}. Avoiding duplicate charge retry.")
                    return {
                        "success": False,
                        "error_type": "TIMEOUT",
                        "detail": "STT request timed out. Please try speaking again.",
                        "use_local_fallback": True,
                        "transcript": ""
                    }
                except Exception as e:
                    logger.error(f"[Gnani STT] Network exception on {key.label}: {e}")
                    return {
                        "success": False,
                        "error_type": "NETWORK_ERROR",
                        "detail": f"Gnani STT connection issue: {str(e)}",
                        "use_local_fallback": True,
                        "transcript": ""
                    }

    return {
        "success": False,
        "error_type": "ALL_KEYS_EXHAUSTED",
        "detail": "All configured Gnani cloud keys are exhausted or unreachable.",
        "use_local_fallback": True,
        "transcript": ""
    }
