/**
 * Anti-abuse pipeline.
 *
 * Orchestrates the four checks in the right order:
 *   1. Geofence (cheap, no DB) — reject if outside VE.
 *   2. Rate limit (DB lock) — reject if exceeded.
 *   3. Reputation (DB read) — reject if blocked.
 *   4. Dedup (DB read) — collapse if duplicate.
 *
 * Returns either:
 *   - { kind: "accept", signature, fuzzedPoint } → create new report.
 *   - { kind: "merge", reportId, signature } → attach as evidence to existing.
 *   - { kind: "reject", reason } → 429 / 403 / 422 depending on reason.
 *
 * Every outcome (accept/merge/reject) is recorded in the audit log by the
 * caller — this service stays focused and does not import AuditLogService
 * to keep the dependency graph one-way.
 */

import type { PrismaClient } from "../../generated/prisma";
import { geofenceVenezuela, fuzzLocation, type LatLng } from "./geofence";
import {
  RateLimiter,
  RATE_LIMITS,
  type RateLimitConfig,
} from "./rate-limit";
import { ReputationService } from "./reputation";
import { buildSignature, type DedupInput } from "./dedup";

export interface AntiAbuseInput {
  type: string;
  text: string;
  point: LatLng;
  timestamp: Date;
  deviceKey: string;
  ip: string;
}

export type AntiAbuseOutcome =
  | {
      kind: "accept";
      signature: string;
      fuzzedPoint: LatLng;
      reputationBand: "high" | "normal" | "low";
    }
  | {
      kind: "merge";
      signature: string;
      existingReportId: string;
      newCount: number;
    }
  | {
      kind: "reject";
      reason:
        | "outside_venezuela"
        | "rate_limited_ip"
        | "rate_limited_device"
        | "reporter_blocked";
      retryAfterSec?: number;
      detail?: string;
    };

export class AntiAbusePipeline {
  private readonly rateLimiter: RateLimiter;
  private readonly reputation: ReputationService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly config: {
      reportSubmit?: RateLimitConfig;
    } = {},
  ) {
    this.rateLimiter = new RateLimiter(prisma);
    this.reputation = new ReputationService(prisma);
  }

  async checkReport(input: AntiAbuseInput): Promise<AntiAbuseOutcome> {
    // 1) Geofence
    const geo = geofenceVenezuela(input.point);
    if (!geo.allowed) {
      return {
        kind: "reject",
        reason: "outside_venezuela",
        detail: geo.reason,
      };
    }

    // 2) Rate limit — IP first (cheapest broad signal), then device
    const cfg = this.config.reportSubmit ?? RATE_LIMITS.reportSubmit;
    const ipResult = await this.rateLimiter.consume(`ip:${input.ip}`, cfg);
    if (!ipResult.allowed) {
      return {
        kind: "reject",
        reason: "rate_limited_ip",
        retryAfterSec: ipResult.retryAfterSec,
      };
    }
    const deviceResult = await this.rateLimiter.consume(
      `device:${input.deviceKey}`,
      cfg,
    );
    if (!deviceResult.allowed) {
      return {
        kind: "reject",
        reason: "rate_limited_device",
        retryAfterSec: deviceResult.retryAfterSec,
      };
    }

    // 3) Reputation
    const rep = await this.reputation.get(input.deviceKey);
    if (rep.blocked) {
      return {
        kind: "reject",
        reason: "reporter_blocked",
        detail: rep.blockedReason ?? undefined,
      };
    }
    const band = ReputationService.band(rep);
    if (band === "blocked") {
      return { kind: "reject", reason: "reporter_blocked" };
    }

    // 4) Dedup
    const dedupInput: DedupInput = {
      type: input.type,
      text: input.text,
      point: input.point,
      timestamp: input.timestamp,
    };
    const signature = buildSignature(dedupInput);
    const existing = await this.prisma.dedupSignature.findUnique({
      where: { signature },
    });

    if (existing) {
      const updated = await this.prisma.dedupSignature.update({
        where: { signature },
        data: { count: { increment: 1 }, lastSeen: new Date() },
      });
      return {
        kind: "merge",
        signature,
        existingReportId: existing.reportId,
        newCount: updated.count,
      };
    }

    // 5) Fuzz location server-side before persistence
    const fuzzed = fuzzLocation(input.point, 200);

    return {
      kind: "accept",
      signature,
      fuzzedPoint: fuzzed,
      reputationBand: band,
    };
  }

  /** Convenience accessor for callers that need reputation effects post-accept. */
  get reputationService(): ReputationService {
    return this.reputation;
  }
}
