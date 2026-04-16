import { auth } from "@/lib/auth";
import { toNodeHandler } from "better-auth/node";

export const GET = toNodeHandler(auth.handler);
export const POST = toNodeHandler(auth.handler);
