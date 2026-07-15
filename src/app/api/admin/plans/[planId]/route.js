import { requireSuperAdminContext } from "@/features/admin/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";
import { normalizePlanInput } from "@/features/admin/plan-input";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { isValidMongoObjectId } from "@/lib/mongodb";

export const runtime = "nodejs";

async function resolvePlanId(params) {
  const resolved = await params;
  const planId = typeof resolved?.planId === "string" ? resolved.planId.trim() : "";
  if (!isValidMongoObjectId(planId)) throw new AppError("Invalid plan identifier.", 400);
  return planId;
}

export async function PATCH(request, { params }) {
  try {
    await requireSuperAdminContext();
    const planId = await resolvePlanId(params);
    const plan = await prisma.platformPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundError("Plan not found.");
    const input = await request.json();
    const data = normalizePlanInput(input, plan);
    delete data.code;
    let updated;
    try { updated = await prisma.platformPlan.update({ where: { id: plan.id }, data }); }
    catch (error) { if (error?.code === "P2025") throw new NotFoundError("Plan not found."); throw error; }
    return ok({ plan: updated });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request, { params }) {
  try {
    await requireSuperAdminContext();
    const planId = await resolvePlanId(params);
    const plan = await prisma.platformPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundError("Plan not found.");
    const usage = await prisma.subscription.count({
      where: { OR: [{ platformPlanId: plan.id }, { planCode: plan.code }] }
    });
    if (usage > 0) {
      const archived = await prisma.platformPlan.update({ where: { id: plan.id }, data: { status: "ARCHIVED" } });
      return ok({ plan: archived, archived: true, message: "Plan is in use and was archived instead of deleted." });
    }
    try { await prisma.platformPlan.delete({ where: { id: plan.id } }); }
    catch (error) {
      if (error?.code === "P2025") throw new NotFoundError("Plan not found.");
      // A subscription can be created after the usage check. Respect the
      // schema's Restrict relation and archive rather than returning a 500.
      if (error?.code === "P2003") {
        const archived = await prisma.platformPlan.update({ where: { id: plan.id }, data: { status: "ARCHIVED" } });
        return ok({ plan: archived, archived: true, message: "Plan is in use and was archived instead of deleted." });
      }
      throw error;
    }
    return ok({ deleted: true });
  } catch (error) { return handleApiError(error); }
}
