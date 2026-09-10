import { createClient } from "@/lib/supabase/client";

// Kept as a compatibility export for the public landing.
export const supabase = createClient();
