"""Rate limiting in-memory (sliding window per key) — stdlib only, tanpa dependency tambahan."""
from collections import defaultdict
from threading import Lock
import time


class RateLimiter:
    """Sliding-window rate limiter per key, aman multi-thread via Lock.

    Setelah `max_attempts` dalam `window_seconds` detik, key di-lockout
    selama `lockout_seconds`. Entri kadaluarsa diprune saat diakses agar
    memori tidak bocor.
    """

    def __init__(
        self,
        max_attempts: int = 5,
        window_seconds: int = 60,
        lockout_seconds: int = 900,
    ) -> None:
        self._max = max_attempts
        self._window = window_seconds
        self._lockout = lockout_seconds
        self._failures: dict[str, list[float]] = defaultdict(list)
        self._lockout_until: dict[str, float] = {}
        self._lock = Lock()

    def _prune(self, now: float) -> None:
        """Buang entri yang sudah lewat window / lockout."""
        for key in list(self._failures):
            stamps = self._failures[key]
            while stamps and stamps[0] <= now - self._window:
                stamps.pop(0)
            if not stamps:
                del self._failures[key]
        for key in list(self._lockout_until):
            if self._lockout_until[key] <= now:
                del self._lockout_until[key]

    def _sisa_lockout(self, now: float, key: str) -> int:
        """retry_after dalam detik, 0 kalau tidak ter-lockout."""
        until = self._lockout_until.get(key, 0.0)
        return int(until - now) + 1 if now < until else 0

    def check(self, key: str) -> tuple[bool, int]:
        """(allowed, retry_after) — inspeksi saja, tidak mencatat kegagalan."""
        with self._lock:
            now = time.monotonic()
            self._prune(now)
            retry = self._sisa_lockout(now, key)
            return retry == 0, retry

    def record_failure(self, key: str) -> tuple[bool, int]:
        """Catat satu kegagalan. Return (allowed, retry_after); False = baru ter-lockout."""
        with self._lock:
            now = time.monotonic()
            self._prune(now)
            retry = self._sisa_lockout(now, key)
            if retry:
                return False, retry
            stamps = self._failures[key]
            stamps.append(now)
            while stamps and stamps[0] <= now - self._window:
                stamps.pop(0)
            if len(stamps) >= self._max:
                self._lockout_until[key] = now + self._lockout
                del self._failures[key]
                return False, self._lockout
            return True, 0

    def hit(self, key: str) -> tuple[bool, int]:
        """Catat satu request (untuk limiter per-request umum). (allowed, retry_after)."""
        with self._lock:
            now = time.monotonic()
            self._prune(now)
            retry = self._sisa_lockout(now, key)
            if retry:
                return False, retry
            stamps = self._failures[key]
            stamps.append(now)
            while stamps and stamps[0] <= now - self._window:
                stamps.pop(0)
            if len(stamps) > self._max:
                self._lockout_until[key] = now + self._lockout
                del self._failures[key]
                return False, self._lockout
            return True, 0

    def reset(self, key: str) -> None:
        """Bersihkan riwayat key (mis. setelah login sukses)."""
        with self._lock:
            self._failures.pop(key, None)
            self._lockout_until.pop(key, None)
