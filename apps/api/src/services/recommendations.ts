import type { RecommendationContext, RecommendationDTO } from "@sismicaid/shared";
import { RECOMMENDATION_CONTEXT } from "@sismicaid/shared";
import { prisma } from "../db";

export function isRecommendationContext(v: string): v is RecommendationContext {
  return (RECOMMENDATION_CONTEXT as readonly string[]).includes(v);
}

export async function listRecommendations(context?: RecommendationContext): Promise<RecommendationDTO[]> {
  const recs = await prisma.safetyRecommendation.findMany({
    where: { isActive: true, ...(context ? { context } : {}) },
    orderBy: [{ priority: "asc" }, { title: "asc" }],
  });
  return recs.map((r) => ({ id: r.id, context: r.context, title: r.title, body: r.body, priority: r.priority }));
}
