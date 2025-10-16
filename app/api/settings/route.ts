import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create organization settings
    let settings = await db.organizationSettings.findUnique({
      where: { organizationId: session.user.organizationId },
    });

    if (!settings) {
      // Create default settings if none exist
      settings = await db.organizationSettings.create({
        data: {
          organizationId: session.user.organizationId,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Update or create organization settings
    const settings = await db.organizationSettings.upsert({
      where: { organizationId: session.user.organizationId },
      update: {
        emailIntegrated: data.emailIntegrated,
        emailProvider: data.emailProvider || null,
        emailAddress: data.emailAddress || null,
        autoApproveThreshold: data.autoApproveThreshold
          ? parseFloat(data.autoApproveThreshold)
          : null,
        escalationKeywords: data.escalationKeywords || null,
        notifyOnEscalation: data.notifyOnEscalation,
        dailyDigest: data.dailyDigest,
      },
      create: {
        organizationId: session.user.organizationId,
        emailIntegrated: data.emailIntegrated,
        emailProvider: data.emailProvider || null,
        emailAddress: data.emailAddress || null,
        autoApproveThreshold: data.autoApproveThreshold
          ? parseFloat(data.autoApproveThreshold)
          : null,
        escalationKeywords: data.escalationKeywords || null,
        notifyOnEscalation: data.notifyOnEscalation,
        dailyDigest: data.dailyDigest,
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
