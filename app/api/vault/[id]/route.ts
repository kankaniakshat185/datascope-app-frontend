import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const datasetId = params.id;

    // Check if dataset belongs to user
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
    });

    if (!dataset || dataset.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.dataset.delete({
      where: { id: datasetId },
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete analysis history" },
      { status: 500 }
    );
  }
}
