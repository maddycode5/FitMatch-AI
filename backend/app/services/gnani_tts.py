import httpx
import logging
from typing import Dict, Any, Optional, Tuple
from app.config import settings
from app.services.gnani_fallback import fallback_manager

logger = logging.getLogger("gnani_tts")

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

    target_voice = voice_id or settings.GNANI_VOICE_CLONE_ID or "tailor_concierge"
    target_lang = lang or settings.GNANI_LANG or "en-IN"

    async with httpx.AsyncClient(timeout=15.0) as client:
        while key:
            headers = fallback_manager.get_auth_headers(key)
            headers["Content-Type"] = "application/json"
            headers["Accept"] = "audio/mpeg, audio/wav, audio/*"

            payload = {
                "text": text.strip(),
                "voice_id": target_voice,
                "lang": target_lang,
                "speed": speed,
                "format": "mp3"
            }

            try:
                logger.info(f"[Gnani TTS] Synthesizing ({len(text)} chars) with {key.label} (Voice: {target_voice})...")
                response = await client.post(
                    settings.GNANI_TTS_ENDPOINT,
                    headers=headers,
                    json=payload
                )

                # Check for quota exhaustion
                if fallback_manager.should_rotate_on_status(response.status_code, response.text):
                    fallback_manager.mark_exhausted(key.key_id, f"HTTP {response.status_code} quota exhausted")
                    key = fallback_manager.get_active_key()
                    continue

                if response.status_code == 200:
                    content_type = response.headers.get("content-type", "audio/mpeg")
                    return response.content, content_type, {
                        "success": True,
                        "key_used": key.key_id,
                        "key_label": key.label,
                        "voice_id": target_voice,
                        "lang": target_lang
                    }

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
