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
    const rules = formData.get("rules") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file in memory
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Attempt to extract target column from CSV header safely (just read first 1024 bytes)
    let targetColumn = "target";
    if (file.name.endsWith('.csv')) {
        const textChunk = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('utf-8');
        const firstLine = textChunk.split('\n')[0];
        const headers = firstLine.split(',');
        if (headers.length > 0) {
            targetColumn = headers[headers.length - 1].trim();
        }
    }

    // Create dataset entry
    const dataset = await prisma.dataset.create({
      data: {
        userId: session.user.id,
        filePath: "in-memory",
        fileName: file.name,
      },
    });

    // ML Service URL
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";

    // Prepare requests
    const mlFormData = new FormData();
    mlFormData.append("file", new Blob([buffer], { type: file.type }), file.name);
    if (rules) {
        mlFormData.append("rules", rules);
    }

    const layer1FormData = new FormData();
    layer1FormData.append("file", new Blob([buffer], { type: file.type }), file.name);

    const dictFormData = new FormData();
    dictFormData.append("file", new Blob([buffer], { type: file.type }), file.name);

    const edaFormData = new FormData();
    edaFormData.append("file", new Blob([buffer], { type: file.type }), file.name);

    const shapFormData = new FormData();
    shapFormData.append("file", new Blob([buffer], { type: file.type }), file.name);

    // Add timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const [mlResponse, layer1Response, dictResponse, edaResponse, shapResponse] = await Promise.all([
      fetch(`${mlServiceUrl}/analyze`, {
        method: "POST",
        body: mlFormData,
        signal: controller.signal,
      }),
      fetch(`${mlServiceUrl}/api/v2/analytical-engine/full-analysis?target_column=${encodeURIComponent(targetColumn)}`, {
        method: "POST",
        body: layer1FormData,
        signal: controller.signal,
      }),
      fetch(`${mlServiceUrl}/data-dictionary`, {
        method: "POST",
        body: dictFormData,
        signal: controller.signal,
      }),
      fetch(`${mlServiceUrl}/eda`, {
        method: "POST",
        body: edaFormData,
        signal: controller.signal,
      }),
      fetch(`${mlServiceUrl}/shap`, {
        method: "POST",
        body: shapFormData,
        signal: controller.signal,
      })
    ]);

    clearTimeout(timeout);

    if (!mlResponse.ok) {
      throw new Error(`ML Service error: ${mlResponse.statusText}`);
    }

    const mlData = await mlResponse.json();
    const layer1Data = layer1Response.ok ? await layer1Response.json() : null;
    const dictData = dictResponse.ok ? await dictResponse.json() : null;
    const edaData = edaResponse.ok ? await edaResponse.json() : null;
    const shapData = shapResponse.ok ? await shapResponse.json() : null;

    if (!mlData?.issues || !Array.isArray(mlData.issues)) {
      throw new Error("Invalid ML response format");
    }

    // Store old issues
    for (const issue of mlData.issues) {
      const numericImpact =
        typeof issue.impact === "number"
          ? issue.impact
          : parseFloat(issue.impact || 0);

      await prisma.analysisResult.create({
        data: {
          datasetId: dataset.id,
          issueType: issue.type || "UNKNOWN",
          severity: issue.severity || "INFO",
          description: issue.description || "No description provided.",
          suggestion: issue.suggestion || "No suggestion available.",
          impactScore: issue.impact_display || `+${numericImpact.toFixed(2)}%`,
          rawJson: issue || {},
        },
      });
    }

    // Store Layer 1 Data
    if (layer1Data) {
      await prisma.analysisResult.create({
        data: {
          datasetId: dataset.id,
          issueType: "LAYER1_ENGINE",
          severity: "INFO",
          description: "Layer 1 Advanced Analytical Engine",
          suggestion: "",
          impactScore: "0%",
          rawJson: layer1Data || {},
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

    if (edaData) {
      await prisma.analysisResult.create({
        data: {
          datasetId: dataset.id,
          issueType: "EDA_DATA",
          severity: "INFO",
          description: "Exploratory Data Analysis",
          suggestion: "",
          impactScore: "0%",
          rawJson: edaData,
        },
      });
    }

    if (shapData && !shapData.error) {
      await prisma.analysisResult.create({
        data: {
          datasetId: dataset.id,
          issueType: "SHAP_DATA",
          severity: "INFO",
          description: "Feature Importance & SHAP Values",
          suggestion: "",
          impactScore: "0%",
          rawJson: shapData,
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