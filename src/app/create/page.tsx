import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateWizard } from "@/components/create/create-wizard";

export default async function CreatePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/create");
  }

  return <CreateWizard />;
}
