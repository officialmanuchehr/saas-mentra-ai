import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingChoice } from "@/components/onboarding/onboarding-choice";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.onboarded_at) {
    redirect("/");
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-12 text-center sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Добро пожаловать{profile?.full_name ? `, ${profile.full_name}` : ""}!
        </h1>
        <p className="mt-2 text-muted-foreground">Расскажите, зачем вы пришли в Mentra AI</p>
      </div>
      <OnboardingChoice />
    </div>
  );
}
