import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const referenceFile = formData.get("reference_file") as File;
    const testFile = formData.get("test_file") as File;

    if (!referenceFile || !testFile) {
      return NextResponse.json({ error: "Both Reference File and Test File are required" }, { status: 400 });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";

    const driftFormData = new FormData();
    driftFormData.append("reference_file", referenceFile);
    driftFormData.append("test_file", testFile);

    const res = await fetch(`${mlServiceUrl}/api/v2/analytical-engine/drift`, {
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
