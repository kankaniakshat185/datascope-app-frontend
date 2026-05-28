import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "../../../lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export const maxDuration = 60; 

export async function POST(req: NextRequest) {
  try {
    const authHeaders = await headers();
    const authHeader = authHeaders.get("Authorization");
    
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1].trim();
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { key: token },
        include: { user: true },
      });

      if (!apiKeyRecord) {
        return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
      }
      userId = apiKeyRecord.userId;
    } else {
      const session = await auth.api.getSession({ headers: authHeaders });
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = session.user.id;
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const rules = formData.get("rules") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();

    let targetColumn = null;
    if (file.name.endsWith(".csv")) {
        const text = new TextDecoder().decode(buffer.slice(0, 1024));
        const firstLine = text.split('\n')[0];
        if (firstLine) {
            const headers = firstLine.split(',');
            targetColumn = headers[headers.length - 1].trim();
        }
    }

    // Phase 1 Governance: Create Dataset, Version, and ModelRun
    const dataset = await prisma.dataset.create({
      data: {
        userId: userId,
        filePath: "in-memory",
        fileName: file.name,
      },
    });

    const datasetVersion = await prisma.datasetVersion.create({
      data: {
        datasetId: dataset.id,
        version: 1,
        schemaHash: file.name,
      }
    });

    const modelRun = await prisma.modelRun.create({
      data: {
        datasetVersionId: datasetVersion.id,
        userId: userId,
        status: "QUEUED",
        validationStatus: "QUEUED"
      }
    });

    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";

    const mlFormData = new FormData();
    mlFormData.append("file", new Blob([buffer], { type: file.type }), file.name);
    if (rules) {
        mlFormData.append("rules", rules);
    }
    if (targetColumn) {
        mlFormData.append("target_column", targetColumn);
    }

    // Phase 2 Async Orchestration: Instantly start background job
    const mlResponse = await fetch(`${mlServiceUrl}/analyze_async`, {
      method: "POST",
      body: mlFormData,
    });

    if (!mlResponse.ok) {
      throw new Error(`ML Service error: ${mlResponse.statusText}`);
    }

    const mlData = await mlResponse.json();

    return NextResponse.json({
      datasetId: dataset.id,
      runId: modelRun.id,
      jobId: mlData.job_id
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}