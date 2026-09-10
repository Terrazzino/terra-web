import { createClient } from "@/lib/supabase/server";
import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let authorized = false;
  let authorizationError = "";

  if (user) {
    const { data, error } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    authorized = Boolean(data);
    if (error) authorizationError = error.message;
  }

  return (
    <AdminPanel
      initialUser={user ? { id: user.id, email: user.email } : null}
      authorized={authorized}
      authorizationError={authorizationError}
    />
  );
}
