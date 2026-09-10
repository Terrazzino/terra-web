import { NextResponse } from "next/server";
import { RECOVERY_COOKIE, UPDATE_PASSWORD_PATH } from "@/lib/auth/recovery";

export async function POST() {
  const response = NextResponse.json({ cleared: true });
  response.cookies.set(RECOVERY_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: UPDATE_PASSWORD_PATH,
  });
  return response;
}
