import logging
from typing import Optional, Dict, Any, List, Tuple
from app.config import settings

logger = logging.getLogger("gnani_fallback")
logging.basicConfig(level=logging.INFO)

class KeyProfile:
    def __init__(self, key_id: str, label: str, access_key: str, token: str):
        self.key_id = key_id
        self.label = label
        self.access_key = access_key.strip()
        # Fall back to access_key if unified token format (e.g. vach_...)
        self.token = token.strip() if token.strip() else self.access_key
        self.is_exhausted = False
        self.exhaust_reason: Optional[str] = None

class GnaniFallbackManager:
    """
    Intelligent Multi-Key Credit Rotation & Failover Manager
    Rules:
    - Primary succeeds -> Use primary
    - Quota / Credit Exhaustion (HTTP 402, 429, 403) -> Rotate to next fallback key
    - Client / Validation error (400, 415, 422) -> Do NOT rotate key, return error to client
    - Timeouts -> Do NOT blindly retry (avoids double billing)
    - All keys exhausted -> Return structured exhaustion status
    """
    def __init__(self):
        self.keys: List[KeyProfile] = []
        self._init_keys()

    def _init_keys(self):
        if settings.GNANI_ACCESS_KEY:
            self.keys.append(KeyProfile("primary", "Primary Key", settings.GNANI_ACCESS_KEY, settings.GNANI_TOKEN))
        if settings.GNANI_FALLBACK_ACCESS_KEY:
            self.keys.append(KeyProfile("fallback_1", "Secondary Fallback Key", settings.GNANI_FALLBACK_ACCESS_KEY, settings.GNANI_FALLBACK_TOKEN))
        if settings.GNANI_BACKUP_ACCESS_KEY:
            self.keys.append(KeyProfile("fallback_2", "Tertiary Backup Key", settings.GNANI_BACKUP_ACCESS_KEY, settings.GNANI_BACKUP_TOKEN))

    def get_active_key(self) -> Optional[KeyProfile]:
        for key in self.keys:
            if not key.is_exhausted:
                return key
        return None

    def mark_exhausted(self, key_id: str, reason: str):
        for key in self.keys:
            if key.key_id == key_id and not key.is_exhausted:
                key.is_exhausted = True
                key.exhaust_reason = reason
                logger.warning(f"[Gnani Failover] Key '{key.label}' ({key_id}) marked exhausted: {reason}. Failing over to next key.")

    def should_rotate_on_status(self, status_code: int, response_text: str = "") -> bool:
        """
        Determines if an HTTP status or payload indicates credit/quota depletion.
        Only rotates on true quota exhaustion:
        - 402 Payment Required
        - 429 Quota Exceeded / Too Many Requests
        - 403 Forbidden (when message references quota/credits/expired subscription)
        """
        if status_code in (402, 429):
            return True
        if status_code == 403:
            lower_msg = response_text.lower()
            if any(term in lower_msg for term in ["credit", "quota", "balance", "insufficient", "exhausted", "limit"]):
                return True
        return False

    def get_auth_headers(self, key: KeyProfile) -> Dict[str, str]:
        """
        Generates standard multi-variation headers accepted across Gnani Vach versions:
        - x-access-key / accessKey
        - x-auth-token / token
        - Authorization: Bearer <key>
        """
        return {
            "x-access-key": key.access_key,
            "accessKey": key.access_key,
            "x-auth-token": key.token,
            "token": key.token,
            "Authorization": f"Bearer {key.token}"
        }

    def get_status(self) -> Dict[str, Any]:
        active = self.get_active_key()
        exhausted_count = sum(1 for k in self.keys if k.is_exhausted)
        return {
            "has_keys": len(self.keys) > 0,
            "active_key_id": active.key_id if active else None,
            "active_key_label": active.label if active else "None (Exhausted / Unconfigured)",
            "total_keys": len(self.keys),
            "exhausted_keys_count": exhausted_count,
            "all_exhausted": len(self.keys) > 0 and active is None
        }

fallback_manager = GnaniFallbackManager()

