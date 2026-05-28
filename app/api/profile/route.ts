import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; 

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";

    const mlFormData = new FormData();
    mlFormData.append("file", new Blob([buffer], { type: file.type }), file.name);

    const mlResponse = await fetch(`${mlServiceUrl}/profile-dataset`, {
      method: "POST",
      body: mlFormData,
    });

    if (!mlResponse.ok) {
      throw new Error(`ML Service error: ${mlResponse.statusText}`);
    }

    const mlData = await mlResponse.json();

    return NextResponse.json(mlData);

  } catch (error: any) {
    console.error("Profile error:", error);
    return NextResponse.json(
      { error: error.message || "Profiling failed" },
      { status: 500 }
    );
  }
}
