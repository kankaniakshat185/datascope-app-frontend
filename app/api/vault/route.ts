import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const datasets = await prisma.dataset.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        analysisResults: {
          select: {
            severity: true,
            issueType: true,
          }
        }
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    return NextResponse.json(datasets);

  } catch (error: any) {
    console.error("Vault error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vault datasets" },
      { status: 500 }
    );
  }
}
