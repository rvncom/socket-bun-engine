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
 * Simple token bucket rate limiter — no timers, lazy window reset.
 */
export class RateLimiter {
  private remaining: number;
  private windowStart: number;
  private readonly opts: RateLimitOptions;

  constructor(opts: RateLimitOptions) {
    this.opts = opts;
    this.remaining = opts.maxMessages;
    this.windowStart = Date.now();
  }

  /**
   * Attempt to consume one token. Returns `true` if allowed, `false` if rate limited.
   */
  consume(): boolean {
    const now = Date.now();
    if (now - this.windowStart >= this.opts.windowMs) {
      this.windowStart = now;
      this.remaining = this.opts.maxMessages;
    }
    if (this.remaining <= 0) {
      return false;
    }
    this.remaining--;
    return true;
  }
}
