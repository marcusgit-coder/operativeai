import { db } from "@/lib/db";

export async function logActivity(params: {
  action: string;
  organizationId?: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await db.activityLog.create({
      data: {
        action: params.action,
        organizationId: params.organizationId || null,
        userId: params.userId || null,
        resourceType: params.resourceType || null,
        resourceId: params.resourceId || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw - activity logging should not break the main flow
  }
}
