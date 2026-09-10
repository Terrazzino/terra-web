import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE, UPDATE_PASSWORD_PATH } from "@/lib/auth/recovery";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") ?? "/admin";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${requestUrl.origin}${next}`);
      if (next === UPDATE_PASSWORD_PATH) {
        response.cookies.set(RECOVERY_COOKIE, "pending", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 15 * 60,
          path: UPDATE_PASSWORD_PATH,
        });
      }
      return response;
    }
  }

  if (next === UPDATE_PASSWORD_PATH) {
    return NextResponse.redirect(`${requestUrl.origin}${UPDATE_PASSWORD_PATH}?error=invalid`);
  }

  return NextResponse.redirect(`${requestUrl.origin}/admin?auth_error=callback`);
}
