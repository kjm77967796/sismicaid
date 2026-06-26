/**
 * Rate limiter — token bucket, DB-backed.
 *
 * Why DB-backed (not in-memory): the API runs on multiple workers in prod
 * (PM2 cluster mode or k8s replicas); per-process buckets would be unfair.
 *
 * Sprint 2 swaps the backend to Redis with atomic Lua script. Until then,
 * this implementation uses Postgres row-level locking which is fine for
 * the request volume of MVP.
 *
 * Buckets per endpoint:
 *   POST /reports:        capacity 5, refill 0.05/s (3/min, burst 5)
 *   POST /push/subscribe: capacity 3, refill 0.01/s (~36/h, burst 3)
 *   GET  /sismos:         no limit (CDN handles it)
 *
 * Buckets per key:
 *   ip:<ipv4 or ipv6>:    primary defense
 *   device:<sha256>:      complementary, prevents IP rotation evasion
 */

import { type PrismaClient, Prisma } from "../../generated/prisma";

export interface RateLimitConfig {
  capacity: number;
  refillRatePerSec: number;
}

export const RATE_LIMITS = {
  reportSubmit: { capacity: 5, refillRatePerSec: 0.05 } as RateLimitConfig,
  pushSubscribe: { capacity: 3, refillRatePerSec: 0.01 } as RateLimitConfig,
  safetyCheck: { capacity: 3, refillRatePerSec: 0.02 } as RateLimitConfig,
} as const;

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSec: number };

export class RateLimiter {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Atomically consume one token. Returns whether request is allowed.
   *
   * Algorithm:
   *   1. Upsert bucket row.
   *   2. Inside same transaction with row lock:
   *      - refill tokens based on elapsed time.
   *      - if tokens >= 1: deduct, return allowed.
   *      - else: return retry_after.
   */
  async consume(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient): Promise<RateLimitResult> => {
      const now = new Date();

      // SELECT FOR UPDATE — row-level lock ensures sequential reads on this key.
      const rows = await tx.$queryRawUnsafe<
        Array<{ tokens: number; capacity: number; refill_rate: number; updated_at: Date }>
      >(
        `SELECT tokens, capacity, refill_rate, updated_at
           FROM rate_limit_bucket
           WHERE key = $1
           FOR UPDATE`,
        key,
      );

      let tokens: number;
      const existing = rows[0];
      if (existing) {
        const elapsedSec = (now.getTime() - existing.updated_at.getTime()) / 1000;
        const refilled = Math.min(
          existing.capacity,
          existing.tokens + elapsedSec * existing.refill_rate,
        );
        tokens = refilled;
      } else {
        tokens = config.capacity; // new bucket starts full
      }

      if (tokens < 1) {
        const deficit = 1 - tokens;
        const retryAfterSec = Math.ceil(deficit / config.refillRatePerSec);
        // Persist refill progress so next call sees up-to-date tokens.
        await tx.rateLimitBucket.upsert({
          where: { key },
          create: {
            key,
            tokens,
            capacity: config.capacity,
            refillRate: config.refillRatePerSec,
            updatedAt: now,
          },
          update: { tokens, updatedAt: now },
        });
        return { allowed: false, retryAfterSec };
      }

      const remaining = tokens - 1;
      await tx.rateLimitBucket.upsert({
        where: { key },
        create: {
          key,
          tokens: remaining,
          capacity: config.capacity,
          refillRate: config.refillRatePerSec,
          updatedAt: now,
        },
        update: { tokens: remaining, updatedAt: now },
      });

      return { allowed: true, remaining };
    });
  }
}
