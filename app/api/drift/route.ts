import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("test_file") as File;
    const trainDistributions = formData.get("train_distributions") as string;

    if (!file || !trainDistributions) {
      return NextResponse.json({ error: "File and train distributions required" }, { status: 400 });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";

    const driftFormData = new FormData();
    driftFormData.append("test_file", file);
    driftFormData.append("train_distributions", trainDistributions);

    const res = await fetch(`${mlServiceUrl}/drift`, {
      method: "POST",
      body: driftFormData,
    });

    if (!res.ok) {
      throw new Error(`ML Service error: ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Drift error:", error);
    return NextResponse.json(
      { error: error.message || "Drift analysis failed" },
      { status: 500 }
    );
  }
}
