export interface RateLimitOptions {
  /**
   * Maximum number of messages allowed per window.
   */
  maxMessages: number;
  /**
   * Time window in milliseconds.
   */
  windowMs: number;
}

/**
 * Timer-based rate limiter — no Date.now() on the hot path.
 *
 * All limiters share a single tick driven by a 100ms global interval.
 * Each limiter holds its own remaining budget and resets when its window expires.
 * This avoids one setInterval per socket — at 10k connections that's 10k fewer timers.
 */
const TICK_MS = 25;
const activeLimiters = new Set<RateLimiter>();
let sharedTimer: Timer | undefined;

function startSharedTimer() {
  if (sharedTimer) return;
  sharedTimer = setInterval(() => {
    const now = Date.now();
    for (const limiter of activeLimiters) {
      if (now >= limiter._nextReset) {
        limiter.remaining = limiter._maxMessages;
        limiter._nextReset = now + limiter._windowMs;
      }
    }
  }, TICK_MS);
  // Allow process to exit even if limiters are still registered (test/cleanup safety).
  sharedTimer.unref?.();
}

function stopSharedTimerIfEmpty() {
  if (activeLimiters.size === 0 && sharedTimer) {
    clearInterval(sharedTimer);
    sharedTimer = undefined;
  }
}

export class RateLimiter {
  /** @internal */ public remaining: number;
  /** @internal */ public readonly _maxMessages: number;
  /** @internal */ public readonly _windowMs: number;
  /** @internal */ public _nextReset: number;

  constructor(opts: RateLimitOptions) {
    this._maxMessages = opts.maxMessages;
    this._windowMs = opts.windowMs;
    this.remaining = opts.maxMessages;
    this._nextReset = Date.now() + opts.windowMs;
    activeLimiters.add(this);
    startSharedTimer();
  }

  /**
   * Attempt to consume one token. Returns `true` if allowed, `false` if rate limited.
   */
  consume(): boolean {
    if (this.remaining <= 0) {
      return false;
    }
    this.remaining--;
    return true;
  }

  /**
   * Unregisters this limiter from the shared timer. Call on socket close.
   */
  destroy() {
    activeLimiters.delete(this);
    stopSharedTimerIfEmpty();
  }
}
