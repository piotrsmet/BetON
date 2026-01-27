"""
Guardrails - zabezpieczenia przed prompt injection, path traversal i innymi atakami
"""
import re
import json
from typing import Tuple, Optional, Any
from functools import wraps
import asyncio
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
import structlog

from app.config import get_settings, SECURITY_LIMITS

logger = structlog.get_logger()


# =============================================================================
# Prompt Injection Detection
# =============================================================================

INJECTION_PATTERNS = [
    # Bezpośrednie instrukcje
    r"ignore\s+(all|previous|above|prior)\s+instructions?",
    r"disregard\s+(all|previous|above|prior)\s+instructions?",
    r"forget\s+(all|previous|above|everything)",
    
    # Próby wycieku promptów
    r"reveal\s+(system|developer|hidden|secret)\s+prompt",
    r"show\s+(me\s+)?(your|the)\s+(system|original)\s+prompt",
    r"what\s+(is|are)\s+your\s+(instructions|rules|guidelines)",
    r"print\s+(your|the)\s+system\s+prompt",
    
    # Jailbreak
    r"jailbreak",
    r"dan\s+mode",
    r"developer\s+mode",
    r"bypass\s+(safety|filter|restriction)",
    
    # Role-playing attacks
    r"pretend\s+(you\s+are|to\s+be)\s+(a|an)\s+(different|unrestricted)",
    r"act\s+as\s+(if|though)\s+you\s+(have\s+)?no\s+(restrictions|limits)",
    r"you\s+are\s+now\s+(a|an)\s+(unrestricted|unlimited)",
    
    # Override attempts
    r"override\s+.*\s+rules?",
    r"new\s+instructions?\s*:",
    r"system\s*:\s*",
    
    # Encoding attacks
    r"base64\s*:",
    r"decode\s+this",
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]


def detect_prompt_injection(text: str) -> Tuple[bool, Optional[str]]:
    """
    Wykrywa próby prompt injection.
    Zwraca (is_injection, detected_pattern)
    """
    text_lower = text.lower()
    
    for pattern in COMPILED_PATTERNS:
        match = pattern.search(text_lower)
        if match:
            logger.warning(
                "prompt_injection_detected",
                pattern=pattern.pattern,
                matched=match.group()
            )
            return True, pattern.pattern
    
    return False, None


def scrub_input(text: str) -> str:
    """
    Oczyszcza tekst wejściowy z potencjalnie niebezpiecznych fragmentów.
    """
    # Usuwanie wykrytych wzorców
    for pattern in COMPILED_PATTERNS:
        text = pattern.sub("[REMOVED]", text)
    
    # Usuwanie znaków kontrolnych
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    
    return text.strip()


# =============================================================================
# Path Traversal Prevention
# =============================================================================

DANGEROUS_PATH_PATTERNS = [
    r"\.\./",           # ../
    r"\.\.\\",          # ..\
    r"^/etc/",          # /etc/
    r"^/root/",         # /root/
    r"^/home/",         # /home/
    r"^C:\\Windows",    # C:\Windows
    r"^C:\\Users",      # C:\Users
    r"~",               # Home directory
    r"\$\{",            # Variable injection
    r"\$\(",            # Command substitution
]


def sanitize_path(path: str) -> Tuple[bool, str]:
    """
    Sprawdza i oczyszcza ścieżkę.
    Zwraca (is_safe, sanitized_path_or_error)
    """
    if len(path) > SECURITY_LIMITS["max_file_path_length"]:
        return False, "Ścieżka przekracza maksymalną długość"
    
    for pattern in DANGEROUS_PATH_PATTERNS:
        if re.search(pattern, path, re.IGNORECASE):
            logger.warning(
                "path_traversal_attempt",
                pattern=pattern,
                path=path[:100]
            )
            return False, f"Wykryto niebezpieczny wzorzec w ścieżce"
    
    return True, path


def validate_team_name(name: str) -> Tuple[bool, str]:
    """Waliduje nazwę drużyny"""
    if not name or len(name) > 50:
        return False, "Nieprawidłowa długość nazwy drużyny"
    
    # Tylko litery, cyfry, spacje, myślniki i kropki
    if not re.match(r"^[\w\s\-\.]+$", name, re.UNICODE):
        return False, "Nazwa drużyny zawiera niedozwolone znaki"
    
    return True, name.strip()


# =============================================================================
# Output Validation
# =============================================================================

def validate_json_output(output: Any, expected_schema: Optional[dict] = None) -> Tuple[bool, Any]:
    """
    Waliduje wyjście jako poprawny JSON.
    Próbuje naprawić częściowo poprawny JSON.
    """
    if isinstance(output, (dict, list)):
        return True, output
    
    if isinstance(output, str):
        # Próba parsowania jako JSON
        try:
            parsed = json.loads(output)
            return True, parsed
        except json.JSONDecodeError:
            # Próba naprawy - szukanie JSON w tekście
            json_match = re.search(r'\{[\s\S]*\}|\[[\s\S]*\]', output)
            if json_match:
                try:
                    parsed = json.loads(json_match.group())
                    return True, parsed
                except json.JSONDecodeError:
                    pass
            
            logger.warning("json_parse_failed", output_preview=output[:200])
            return False, "Nie udało się sparsować wyjścia jako JSON"
    
    return False, "Nieoczekiwany typ wyjścia"


def sanitize_output(output: dict) -> dict:
    """
    Oczyszcza wyjście z potencjalnie wrażliwych danych.
    """
    sensitive_keys = ["api_key", "password", "secret", "token", "key"]
    
    def _sanitize_recursive(obj):
        if isinstance(obj, dict):
            return {
                k: "[REDACTED]" if any(s in k.lower() for s in sensitive_keys) 
                else _sanitize_recursive(v)
                for k, v in obj.items()
            }
        elif isinstance(obj, list):
            return [_sanitize_recursive(item) for item in obj]
        return obj
    
    return _sanitize_recursive(output)


# =============================================================================
# Timeout Decorator
# =============================================================================

def with_timeout(timeout_seconds: Optional[int] = None):
    """
    Dekorator dodający timeout do funkcji.
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            timeout = timeout_seconds or get_settings().timeout_seconds
            try:
                return await asyncio.wait_for(
                    func(*args, **kwargs),
                    timeout=timeout
                )
            except asyncio.TimeoutError:
                logger.error("function_timeout", function=func.__name__, timeout=timeout)
                raise TimeoutError(f"Operacja przekroczyła limit czasu ({timeout}s)")
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            timeout = timeout_seconds or get_settings().timeout_seconds
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(func, *args, **kwargs)
                try:
                    return future.result(timeout=timeout)
                except FuturesTimeoutError:
                    logger.error("function_timeout", function=func.__name__, timeout=timeout)
                    raise TimeoutError(f"Operacja przekroczyła limit czasu ({timeout}s)")
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# =============================================================================
# Domain/Host Allowlist
# =============================================================================

ALLOWED_DOMAINS = [
    "localhost",
    "127.0.0.1",
    "api.openai.com",
    "generativelanguage.googleapis.com",
]


def validate_url(url: str) -> Tuple[bool, str]:
    """
    Sprawdza czy URL jest na liście dozwolonych.
    """
    from urllib.parse import urlparse
    
    try:
        parsed = urlparse(url)
        host = parsed.hostname or ""
        
        if host in ALLOWED_DOMAINS:
            return True, url
        
        # Sprawdzenie subdomen
        for allowed in ALLOWED_DOMAINS:
            if host.endswith(f".{allowed}"):
                return True, url
        
        logger.warning("blocked_domain", url=url[:100], host=host)
        return False, f"Domena {host} nie jest dozwolona"
    
    except Exception as e:
        return False, f"Nieprawidłowy URL: {str(e)}"


# =============================================================================
# Request Rate Limiting (simple in-memory)
# =============================================================================

from collections import defaultdict
from datetime import datetime, timedelta

_request_counts: dict = defaultdict(list)
RATE_LIMIT = 100  # requests per minute
RATE_WINDOW = 60  # seconds


def check_rate_limit(client_id: str) -> Tuple[bool, int]:
    """
    Sprawdza limit zapytań.
    Zwraca (is_allowed, remaining_requests)
    """
    now = datetime.now()
    window_start = now - timedelta(seconds=RATE_WINDOW)
    
    # Filtrowanie starych requestów
    _request_counts[client_id] = [
        ts for ts in _request_counts[client_id]
        if ts > window_start
    ]
    
    count = len(_request_counts[client_id])
    
    if count >= RATE_LIMIT:
        return False, 0
    
    _request_counts[client_id].append(now)
    return True, RATE_LIMIT - count - 1


# =============================================================================
# Combined Input Validation
# =============================================================================

def validate_request(
    text: str,
    check_injection: bool = True,
    max_length: Optional[int] = None
) -> Tuple[bool, str, Optional[str]]:
    """
    Kompletna walidacja tekstu wejściowego.
    Zwraca (is_valid, sanitized_text, error_message)
    """
    settings = get_settings()
    max_len = max_length or settings.max_input_length
    
    # Sprawdzenie długości
    if len(text) > max_len:
        return False, "", f"Tekst przekracza maksymalną długość ({max_len} znaków)"
    
    # Wykrycie injection
    if check_injection:
        is_injection, pattern = detect_prompt_injection(text)
        if is_injection:
            return False, "", "Wykryto próbę prompt injection"
    
    # Sanityzacja
    sanitized = scrub_input(text)
    
    return True, sanitized, None
