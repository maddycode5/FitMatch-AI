import io
import wave
import asyncio
import httpx
import logging
from typing import Dict, Any, Optional, Tuple
from app.config import settings
from app.services.gnani_fallback import fallback_manager

logger = logging.getLogger("gnani_tts")

# In-memory TTS cache to deliver repeated or common speech instantly in < 2ms
_TTS_CACHE: Dict[str, Tuple[bytes, str, Dict[str, Any]]] = {}

def _ensure_playable_audio(raw_bytes: bytes, headers: httpx.Headers) -> Tuple[bytes, str]:
    """
    Gnani Timbre returns headerless 16-bit 48kHz PCM (`x-audio-container: raw`, `application/octet-stream`).
    Browser <audio> elements require a valid container header, so wrap raw PCM into a standard RIFF WAV.
    """
    if not raw_bytes:
        return raw_bytes, "audio/wav"

    if raw_bytes[:4] == b"RIFF":
        return raw_bytes, "audio/wav"
    if raw_bytes[:4] == b"OggS":
        return raw_bytes, "audio/ogg"
    if raw_bytes[:3] == b"ID3" or (len(raw_bytes) >= 2 and raw_bytes[0] == 0xFF and (raw_bytes[1] & 0xE0) == 0xE0):
        return raw_bytes, "audio/mpeg"

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(48000)
        wf.writeframes(raw_bytes)
    return buf.getvalue(), "audio/wav"

async def synthesize_speech(
    text: str,
    voice_id: Optional[str] = None,
    lang: Optional[str] = None,
    speed: float = 0.95
) -> Tuple[Optional[bytes], str, Dict[str, Any]]:
    """
    Synthesizes speech via Gnani Timbre TTS with cloned voice & intelligent key rotation.
    Returns: (audio_bytes, content_type, metadata_dict)
    """
    if not text or not text.strip():
        return None, "audio/mpeg", {"success": False, "error_type": "EMPTY_TEXT", "detail": "Text is empty"}

    key = fallback_manager.get_active_key()
    if not key:
        return None, "audio/mpeg", {
            "success": False,
            "error_type": "ALL_KEYS_EXHAUSTED",
            "detail": "All Gnani Cloud API keys have exhausted quota or are unconfigured.",
            "use_local_fallback": True
        }

    chosen_voice = voice_id if voice_id and voice_id not in ("tailor_concierge", "default") else getattr(settings, "GNANI_VOICE", "Vikrant")
    target_lang = lang or settings.GNANI_LANG or "en-IN"

    cache_key = f"{chosen_voice}:{text.strip()}:{speed}"
    if cache_key in _TTS_CACHE:
        c_bytes, c_type, c_meta = _TTS_CACHE[cache_key]
        return c_bytes, c_type, {**c_meta, "from_cache": True}

    # Serialize cloud calls through global Gnani API lock (Gnani allows max 1 concurrent active request)
    async with fallback_manager.api_lock:
        # Re-check cache after acquiring lock (eliminates duplicate StrictMode / burst requests)
        if cache_key in _TTS_CACHE:
            c_bytes, c_type, c_meta = _TTS_CACHE[cache_key]
            return c_bytes, c_type, {**c_meta, "from_cache": True}

        key = fallback_manager.get_active_key()
        async with httpx.AsyncClient(timeout=10.0) as client:
            retries_429 = 0
            while key:
                headers = {
                    "X-API-Key-ID": key.access_key,
                    "x-api-key": key.access_key,
                    "Content-Type": "application/json"
                }

                payload = {
                    "model": getattr(settings, "GNANI_MODEL", "timbre-v2.5"),
                    "voice": chosen_voice,
                    "text": text.strip(),
                    "speed": speed
                }

                try:
                    logger.info(f"[Gnani TTS] Synthesizing ({len(text)} chars) with {key.label} (Voice: {chosen_voice})...")
                    response = await client.post(
                        settings.GNANI_TTS_ENDPOINT,
                        headers=headers,
                        json=payload
                    )

                    # Handle temporary 429 concurrency limit without exhausting keys
                    if response.status_code == 429 and not fallback_manager.should_rotate_on_status(response.status_code, response.text):
                        if retries_429 < 2:
                            retries_429 += 1
                            logger.info(f"[Gnani TTS] Rate limit pause, retrying ({retries_429}/2)...")
                            await asyncio.sleep(0.6)
                            continue
                        return None, "audio/mpeg", {
                            "success": False,
                            "error_type": "RATE_LIMITED",
                            "detail": "Gnani TTS rate limit busy.",
                            "use_local_fallback": True
                        }

                    # Check for quota exhaustion
                    if fallback_manager.should_rotate_on_status(response.status_code, response.text):
                        fallback_manager.mark_exhausted(key.key_id, f"HTTP {response.status_code} quota exhausted")
                        key = fallback_manager.get_active_key()
                        continue

                    if response.status_code == 200:
                        playable_bytes, content_type = _ensure_playable_audio(response.content, response.headers)
                        meta_dict = {
                            "success": True,
                            "key_used": key.key_id,
                            "key_label": key.label,
                            "voice_id": chosen_voice,
                            "lang": target_lang
                        }
                        _TTS_CACHE[cache_key] = (playable_bytes, content_type, meta_dict)
                        return playable_bytes, content_type, meta_dict

                    # Client validation errors: Do NOT rotate keys
                    if response.status_code in (400, 422):
                        logger.warning(f"[Gnani TTS] Validation error {response.status_code}: {response.text}")
                        return None, "audio/mpeg", {
                            "success": False,
                            "error_type": "VALIDATION_ERROR",
                            "detail": f"Gnani TTS validation error: {response.text}",
                            "use_local_fallback": True
                        }

                    logger.error(f"[Gnani TTS] Upstream error {response.status_code}: {response.text}")
                    return None, "audio/mpeg", {
                        "success": False,
                        "error_type": "UPSTREAM_ERROR",
                        "detail": f"Gnani TTS returned HTTP {response.status_code}",
                        "use_local_fallback": True
                    }

                except httpx.TimeoutException:
                    logger.error(f"[Gnani TTS] Request timeout on {key.label}. Avoiding duplicate charge retry.")
                    return None, "audio/mpeg", {
                        "success": False,
                        "error_type": "TIMEOUT",
                        "detail": "TTS request timed out.",
                        "use_local_fallback": True
                    }
                except Exception as e:
                    logger.error(f"[Gnani TTS] Network exception on {key.label}: {e}")
                    return None, "audio/mpeg", {
                        "success": False,
                        "error_type": "NETWORK_ERROR",
                        "detail": f"Gnani TTS connection issue: {str(e)}",
                        "use_local_fallback": True
                    }

    return None, "audio/mpeg", {
        "success": False,
        "error_type": "ALL_KEYS_EXHAUSTED",
        "detail": "All configured Gnani cloud keys are exhausted or unreachable.",
        "use_local_fallback": True
    }
