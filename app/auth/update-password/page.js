import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE } from "@/lib/auth/recovery";
import UpdatePasswordForm from "./UpdatePasswordForm";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage({ searchParams }) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const recoveryPending = cookieStore.get(RECOVERY_COOKIE)?.value === "pending";
  const invalid = searchParams?.error === "invalid" || !user || !recoveryPending;

  return <UpdatePasswordForm validRecovery={!invalid} />;
}
