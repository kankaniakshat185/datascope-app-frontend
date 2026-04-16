import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ✅ Read file in memory (NO filesystem)
    const buffer = Buffer.from(await file.arrayBuffer());

    // ✅ Save dataset entry (no real file path anymore)
    const dataset = await prisma.dataset.create({
      data: {
        userId: session.user.id,
        filePath: "in-memory", // placeholder
        fileName: file.name,
      },
    });

    // ✅ ML Service URL (MUST be deployed, not localhost in production)
    const mlServiceUrl =
      process.env.ML_SERVICE_URL || "http://localhost:8000";

    const mlFormData = new FormData();
    const blob = new Blob([buffer], { type: file.type });
    mlFormData.append("file", blob, file.name);

    const mlResponse = await fetch(`${mlServiceUrl}/analyze`, {
      method: "POST",
      body: mlFormData,
    });

    if (!mlResponse.ok) {
      throw new Error(`ML Service error: ${mlResponse.statusText}`);
    }

    const mlData = await mlResponse.json();

    // ✅ Store analysis results
    for (const issue of mlData.issues) {
      await prisma.analysisResult.create({
        data: {
          datasetId: dataset.id,
          issueType: issue.type,
          severity: issue.severity,
          description: issue.description,
          suggestion: issue.suggestion,
          impactScore: issue.impact,
          rawJson: issue,
        },
      });
    }

    return NextResponse.json({
      datasetId: dataset.id,
      issues: mlData.issues,
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}