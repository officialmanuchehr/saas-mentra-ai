import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Обрабатывает редирект после Google OAuth и после подтверждения email:
// обменивает code на сессию и отправляет пользователя в приложение.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let destination = next;
      if (next === "/" && data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarded_at")
          .eq("id", data.user.id)
          .single();
        if (!profile?.onboarded_at) destination = "/onboarding";
      }
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
