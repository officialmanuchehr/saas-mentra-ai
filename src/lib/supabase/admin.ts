import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

// Service-role клиент — обходит RLS. Использовать ТОЛЬКО в server-only коде
// (Server Actions/Route Handlers) для узких, явно проверенных сценариев
// (например, публикация постов от системного профиля "Mentra AI"), где
// обычный cookie-based клиент не может выполнить действие из-за RLS.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY не задан в .env.local");
  }
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
