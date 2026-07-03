import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppHomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Layout и page рендерятся параллельно, поэтому редирект из layout.tsx
  // не гарантирует, что здесь user уже определён — проверяем ещё раз.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight">
        Добро пожаловать, {profile?.full_name || user.email}!
      </h1>
      <p className="mt-2 text-muted-foreground">
        Это защищённая часть приложения — сюда попадают только авторизованные
        пользователи.
      </p>
    </div>
  );
}
