import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "../../../lib/auth";

const prisma = new PrismaClient();

export const maxDuration = 60; // Max allowed for hobby plan

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const { searchParams } = new URL(req.url);
    const fastApiJobId = searchParams.get("fastApiJobId");

    if (!fastApiJobId) {
      return NextResponse.json({ error: "Missing fastApiJobId" }, { status: 400 });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
    
    // Poll the FastAPI Job Manager
    const pollRes = await fetch(`${mlServiceUrl}/job/${fastApiJobId}`);
    if (!pollRes.ok) {
      throw new Error("Failed to poll ML service");
    }

    const jobData = await pollRes.json();

    if (jobData.status === "COMPLETED") {
      const modelRun = await prisma.modelRun.findUnique({
        where: { id: runId },
        include: { DatasetVersion: { include: { dataset: true } } }
      });

      if (!modelRun) throw new Error("ModelRun not found");
      const datasetId = modelRun.DatasetVersion.datasetId;

      const { issues, dictData, edaData, shapData, layer1Data } = jobData.result;

      // Filter out raw outliers from generic ML checks to avoid duplicate display
      const filteredIssues = issues.filter((i: any) => i.type !== "OUTLIERS" && i.type !== "OUTLIER_CAPPING");

      for (const issue of filteredIssues) {
        const numericImpact = typeof issue.impact === "number" ? issue.impact : parseFloat(issue.impact || 0);
        await prisma.analysisResult.create({
          data: {
            datasetId,
            issueType: issue.type || "UNKNOWN",
            severity: issue.severity || "INFO",
            description: issue.description || "No description provided.",
            suggestion: issue.suggestion || "No suggestion available.",
            impactScore: issue.impact_display || `+${numericImpact.toFixed(2)}%`,
            rawJson: issue || {},
          },
        });
      }

      if (layer1Data) {
        await prisma.analysisResult.create({
          data: {
            datasetId,
            issueType: "LAYER1_ENGINE",
            severity: "INFO",
            description: "Layer 1 Advanced Analytical Engine",
            suggestion: "",
            impactScore: "0%",
            rawJson: layer1Data || {},
          },
        });

        if (layer1Data.outlier_analysis?.summary?.percentage_flagged > 0) {
          const pct = layer1Data.outlier_analysis.summary.percentage_flagged;
          await prisma.analysisResult.create({
              data: {
                datasetId,
                issueType: "OUTLIERS_CONSENSUS",
                severity: pct > 5 ? "HIGH" : "MEDIUM",
                description: `Advanced Consensus Engine flagged ${pct.toFixed(1)}% of your rows as severe anomalies.`,
                suggestion: "Use the Pipeline Builder to drop rows with an ensemble consensus score > 0.6.",
                impactScore: `-${(pct * 0.5).toFixed(1)}%`,
                rawJson: layer1Data.outlier_analysis || {},
              }
          });
        }
      }

      if (dictData) {
        await prisma.analysisResult.create({
          data: { datasetId, issueType: "DATA_DICTIONARY", severity: "INFO", description: "Dataset Summary & Dictionary", suggestion: "", impactScore: "0%", rawJson: dictData }
        });
      }

      if (edaData) {
        await prisma.analysisResult.create({
          data: { datasetId, issueType: "EDA_DATA", severity: "INFO", description: "Exploratory Data Analysis", suggestion: "", impactScore: "0%", rawJson: edaData }
        });
      }

      if (shapData && !shapData.error) {
        await prisma.analysisResult.create({
          data: { datasetId, issueType: "SEGMENTED_SHAP_DATA", severity: "INFO", description: "Cluster-based Feature Importance", suggestion: "", impactScore: "0%", rawJson: shapData || {} }
        });
      }

      // Transition State Machine
      await prisma.modelRun.update({
        where: { id: runId },
        data: {
          status: "AWAITING_REVIEW",
          validationStatus: "PASSED"
        }
      });

      return NextResponse.json({ status: "COMPLETED", datasetId, progress: 100, stage: "Analysis complete." });
    }

    // Return the current progress state
    return NextResponse.json({
      status: jobData.status,
      progress: jobData.progress,
      stage: jobData.stage,
      error: jobData.error
    });

  } catch (error: any) {
    console.error("Polling error:", error);
    return NextResponse.json({ error: error.message || "Failed to poll job" }, { status: 500 });
  }
}
