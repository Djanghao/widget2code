# -----------------------------------------------------------------------------
# Rate Limiter - Token Bucket Algorithm for Global LLM API Rate Limiting
# -----------------------------------------------------------------------------

import asyncio
import time
import threading
from typing import Optional, Dict
from datetime import datetime
import weakref


class TokenBucketRateLimiter:
    """
    Token Bucket algorithm for rate limiting LLM API calls.

    This is a global singleton that controls the rate of API requests across
    all OpenAIProvider instances.

    Features:
    - Smooth token refill: tokens_per_second = requests_per_minute / 60
    - Bucket capacity: max_tokens = requests_per_minute
    - Auto-wait: blocks until tokens are available
    - Thread-safe and async-safe
    - Can be disabled by setting requests_per_minute=0
    - Logs wait times for observability
    - IMMUTABLE: Configuration cannot be changed after initialization
    - Multi-event-loop support: Each event loop gets its own async lock

    Example:
        >>> limiter = TokenBucketRateLimiter(requests_per_minute=60)
        >>> await limiter.acquire()  # Async acquire
        >>> limiter.acquire_sync()   # Sync acquire
    """

    _instance: Optional['TokenBucketRateLimiter'] = None
    _instance_lock = threading.Lock()
    _instance_rpm: Optional[int] = None  # Track what RPM the instance was created with

    def __new__(cls, requests_per_minute: int = 60):
        """
        Singleton pattern: ensure only one instance exists globally.

        If called with different requests_per_minute, raises error to prevent
        configuration conflicts.
        """
        with cls._instance_lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
                cls._instance_rpm = requests_per_minute
            elif cls._instance_rpm != requests_per_minute:
                raise ValueError(
                    f"TokenBucketRateLimiter already initialized with "
                    f"{cls._instance_rpm} req/min, cannot reinitialize with "
                    f"{requests_per_minute} req/min. Use get_rate_limiter() instead."
                )
            return cls._instance

    def __init__(self, requests_per_minute: int = 60):
        """
        Initialize the rate limiter.

        Args:
            requests_per_minute: Maximum requests per minute (0 to disable)

        Raises:
            TypeError: If requests_per_minute is not an integer
            ValueError: If requests_per_minute is negative or too large
        """
        # Thread-safe initialization check
        with type(self)._instance_lock:
            if self._initialized:
                return

            # Input validation
            if not isinstance(requests_per_minute, int):
                raise TypeError(f"requests_per_minute must be int, got {type(requests_per_minute)}")
            if requests_per_minute < 0:
                raise ValueError(f"requests_per_minute must be non-negative, got {requests_per_minute}")
            if requests_per_minute > 1_000_000:
                raise ValueError(f"requests_per_minute too large (max 1,000,000), got {requests_per_minute}")

            self.requests_per_minute = requests_per_minute
            self.enabled = requests_per_minute > 0

            # Thread lock for sync operations (never recreated)
            self._state_lock = threading.Lock()

            # Per-event-loop async locks (lazy initialized)
            self._async_locks: Dict[int, asyncio.Lock] = {}
            self._async_locks_lock = threading.Lock()

            if self.enabled:
                # Token bucket parameters (immutable)
                self.max_tokens = float(requests_per_minute)
                self.tokens_per_second = requests_per_minute / 60.0
                self.tokens = self.max_tokens  # Start with full bucket
                self.last_refill_time = time.monotonic()

                # Statistics
                self.total_waits = 0
                self.total_wait_time = 0.0

                print(f"[RateLimiter] Initialized: {requests_per_minute} req/min "
                      f"({self.tokens_per_second:.2f} tokens/sec)")
            else:
                print("[RateLimiter] Disabled (requests_per_minute=0)")

            self._initialized = True

    def _get_async_lock(self) -> asyncio.Lock:
        """
        Get async lock for the current event loop (lazy initialization).

        Creates a separate lock for each event loop to support multi-loop usage.
        Uses weak references to clean up locks when event loops are destroyed.

        Returns:
            asyncio.Lock for the current event loop

        Raises:
            RuntimeError: If called outside async context
        """
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            raise RuntimeError("acquire() must be called from within async context (event loop)")

        loop_id = id(loop)

        # Double-checked locking for performance
        if loop_id not in self._async_locks:
            with self._async_locks_lock:
                if loop_id not in self._async_locks:
                    self._async_locks[loop_id] = asyncio.Lock()

        return self._async_locks[loop_id]

    def _refill_tokens(self) -> None:
        """
        Refill tokens based on elapsed time since last refill.

        MUST be called with _state_lock held!
        """
        if not self.enabled:
            return

        now = time.monotonic()
        elapsed = now - self.last_refill_time

        # Add tokens based on elapsed time
        new_tokens = elapsed * self.tokens_per_second
        self.tokens = min(self.max_tokens, self.tokens + new_tokens)
        self.last_refill_time = now

    async def acquire(self, tokens: int = 1) -> None:
        """
        Asynchronously acquire tokens (blocks until available).

        Args:
            tokens: Number of tokens to acquire (default: 1)

        Raises:
            TypeError: If tokens is not an integer
            ValueError: If tokens is negative or zero
        """
        # Input validation
        if not isinstance(tokens, int):
            raise TypeError(f"tokens must be int, got {type(tokens)}")
        if tokens <= 0:
            raise ValueError(f"tokens must be positive, got {tokens}")

        if not self.enabled:
            return

        async_lock = self._get_async_lock()

        async with async_lock:
            while True:
                # Refill tokens and check availability (atomic operation)
                with self._state_lock:
                    self._refill_tokens()

                    if self.tokens >= tokens:
                        # Enough tokens available
                        self.tokens -= tokens
                        return

                    # Not enough tokens - calculate wait time
                    tokens_needed = tokens - self.tokens
                    wait_time = tokens_needed / self.tokens_per_second

                    # Update statistics (inside lock for thread safety)
                    self.total_waits += 1
                    self.total_wait_time += wait_time

                # Log wait time (outside lock to minimize lock hold time)
                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                print(f"[{timestamp}] [RateLimiter] Rate limit reached, "
                      f"waiting {wait_time:.2f}s for {tokens} token(s)...")

                # Release lock and sleep
                await asyncio.sleep(wait_time)

                # After sleep, loop back to refill and check again

    def acquire_sync(self, tokens: int = 1) -> None:
        """
        Synchronously acquire tokens (blocks until available).

        Args:
            tokens: Number of tokens to acquire (default: 1)

        Raises:
            TypeError: If tokens is not an integer
            ValueError: If tokens is negative or zero
        """
        # Input validation
        if not isinstance(tokens, int):
            raise TypeError(f"tokens must be int, got {type(tokens)}")
        if tokens <= 0:
            raise ValueError(f"tokens must be positive, got {tokens}")

        if not self.enabled:
            return

        while True:
            with self._state_lock:
                self._refill_tokens()

                if self.tokens >= tokens:
                    # Enough tokens available
                    self.tokens -= tokens
                    return

                # Not enough tokens - calculate wait time
                tokens_needed = tokens - self.tokens
                wait_time = tokens_needed / self.tokens_per_second

                # Update statistics (inside lock for thread safety)
                self.total_waits += 1
                self.total_wait_time += wait_time

            # Log wait time (outside lock)
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            print(f"[{timestamp}] [RateLimiter] Rate limit reached, "
                  f"waiting {wait_time:.2f}s for {tokens} token(s)...")

            # Sleep without holding lock
            time.sleep(wait_time)

            # After sleep, loop back to refill and check again

    def get_stats(self) -> dict:
        """
        Get rate limiter statistics (thread-safe).

        Returns:
            Dictionary with stats: total_waits, total_wait_time, current_tokens
        """
        if not self.enabled:
            return {"enabled": False}

        with self._state_lock:
            self._refill_tokens()
            return {
                "enabled": True,
                "requests_per_minute": self.requests_per_minute,
                "tokens_per_second": self.tokens_per_second,
                "current_tokens": self.tokens,
                "max_tokens": self.max_tokens,
                "total_waits": self.total_waits,
                "total_wait_time": self.total_wait_time,
                "event_loops_tracked": len(self._async_locks),
            }

    def reset(self) -> None:
        """
        Reset the rate limiter (thread-safe, for testing purposes).

        WARNING: Only use in tests. Do not call during normal operation.
        """
        if not self.enabled:
            return

        with self._state_lock:
            self.tokens = self.max_tokens
            self.last_refill_time = time.monotonic()
            self.total_waits = 0
            self.total_wait_time = 0.0


# Global singleton instance (created on first get_rate_limiter call)
_global_rate_limiter: Optional[TokenBucketRateLimiter] = None
_global_lock = threading.Lock()


def get_rate_limiter(requests_per_minute: int = 60) -> TokenBucketRateLimiter:
    """
    Get or create the global rate limiter instance.

    This function ensures only one rate limiter exists globally. If called
    multiple times with different requests_per_minute values, raises an error.

    Args:
        requests_per_minute: RPM value (only used on first call)

    Returns:
        Global TokenBucketRateLimiter instance

    Raises:
        ValueError: If trying to create with different requests_per_minute
    """
    global _global_rate_limiter

    with _global_lock:
        if _global_rate_limiter is None:
            _global_rate_limiter = TokenBucketRateLimiter(requests_per_minute)
        elif _global_rate_limiter.requests_per_minute != requests_per_minute:
            # Allow creating with same RPM (idempotent)
            # But raise error if trying to change configuration
            raise ValueError(
                f"Rate limiter already initialized with "
                f"{_global_rate_limiter.requests_per_minute} req/min, "
                f"cannot change to {requests_per_minute} req/min. "
                f"Configuration is immutable after initialization."
            )

        return _global_rate_limiter


def reset_global_rate_limiter() -> None:
    """
    Reset the global rate limiter singleton (for testing only).

    WARNING: This is NOT thread-safe and should ONLY be used in tests
    between test cases, never in production code.
    """
    global _global_rate_limiter
    _global_rate_limiter = None
    TokenBucketRateLimiter._instance = None
    TokenBucketRateLimiter._instance_rpm = None
