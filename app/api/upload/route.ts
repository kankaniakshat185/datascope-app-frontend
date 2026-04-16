import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    
    // In dev mode, if not authenticated, maybe mock a user or reject
    if (!session?.user) {
      // For testing without auth, you might want to bypass this.
      // But let's keep it strict.
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Save locally
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Save dataset entry to DB
    const dataset = await prisma.dataset.create({
      data: {
        userId: session.user.id,
        filePath,
        fileName: file.name,
      },
    });

    // Call ML Service (Assuming it exposes POST /analyze endpoint receiving multipart or JSON path)
    // Docker networking: the ML service is at process.env.ML_SERVICE_URL or http://ml_service:8000
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
    
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

    // Store analysis results
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

    return NextResponse.json({ datasetId: dataset.id, issues: mlData.issues });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
