import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";

    const cleanFormData = new FormData();
    cleanFormData.append("file", file);

    const res = await fetch(`${mlServiceUrl}/clean`, {
      method: "POST",
      body: cleanFormData,
    });

    if (!res.ok) {
      throw new Error(`ML Service error: ${res.statusText}`);
    }

    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "text/csv",
      },
    });

  } catch (error: any) {
    console.error("Clean error:", error);
    return NextResponse.json(
      { error: error.message || "Clean failed" },
      { status: 500 }
    );
  }
}
