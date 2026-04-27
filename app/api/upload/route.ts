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

    // ✅ Read file in memory
    const buffer = Buffer.from(await file.arrayBuffer());

    // ✅ Create dataset entry
    const dataset = await prisma.dataset.create({
      data: {
        userId: session.user.id,
        filePath: "in-memory",
        fileName: file.name,
      },
    });

    // ✅ ML Service URL
    const mlServiceUrl =
      process.env.ML_SERVICE_URL || "http://localhost:8000";

    // ✅ Prepare requests
    const mlFormData = new FormData();
    mlFormData.append("file", new Blob([buffer], { type: file.type }), file.name);

    const dictFormData = new FormData();
    dictFormData.append("file", new Blob([buffer], { type: file.type }), file.name);

    // ✅ Add timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const [mlResponse, dictResponse] = await Promise.all([
      fetch(`${mlServiceUrl}/analyze`, {
        method: "POST",
        body: mlFormData,
        signal: controller.signal,
      }),
      fetch(`${mlServiceUrl}/data-dictionary`, {
        method: "POST",
        body: dictFormData,
        signal: controller.signal,
      })
    ]);

    clearTimeout(timeout);

    if (!mlResponse.ok) {
      throw new Error(`ML Service error: ${mlResponse.statusText}`);
    }

    const mlData = await mlResponse.json();
    const dictData = dictResponse.ok ? await dictResponse.json() : null;

    if (!mlData?.issues || !Array.isArray(mlData.issues)) {
      throw new Error("Invalid ML response format");
    }

    // ✅ Store analysis results safely
    for (const issue of mlData.issues) {
      const numericImpact =
        typeof issue.impact === "number"
          ? issue.impact
          : parseFloat(issue.impact || 0);

      await prisma.analysisResult.create({
        data: {
          datasetId: dataset.id,
          issueType: issue.type,
          severity: issue.severity,
          description: issue.description,
          suggestion: issue.suggestion,
          impactScore:
            issue.impact_display || `+${numericImpact.toFixed(2)}%`,
          rawJson: issue,
        },
      });
    }

    if (dictData) {
      await prisma.analysisResult.create({
        data: {
          datasetId: dataset.id,
          issueType: "DATA_DICTIONARY",
          severity: "INFO",
          description: "Dataset Summary & Dictionary",
          suggestion: "",
          impactScore: "0%",
          rawJson: dictData,
        },
      });
    }

    return NextResponse.json({
      datasetId: dataset.id,
      issues: mlData.issues,
    });

  } catch (error: any) {
    console.error("Upload error:", error);

    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}