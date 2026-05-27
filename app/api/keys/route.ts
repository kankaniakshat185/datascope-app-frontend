import { NextRequest, NextResponse } from "next/server";
import { auth, prisma } from "../../../lib/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the user already has an API key
    const existingKey = await prisma.apiKey.findFirst({
      where: { userId: session.user.id }
    });

    if (existingKey) {
      return NextResponse.json({ key: existingKey });
    }

    // Generate a secure random API key
    const rawKey = crypto.randomBytes(32).toString("hex");
    const formattedKey = `ds_${rawKey}`;

    const newKey = await prisma.apiKey.create({
      data: {
        key: formattedKey,
        name: "DataScope SDK Key",
        userId: session.user.id
      }
    });

    return NextResponse.json({ key: newKey });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
