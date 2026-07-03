import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { CommunitiesShowcase } from "@/components/landing/communities-showcase";
import { Pricing } from "@/components/landing/pricing";
import { Cta } from "@/components/landing/cta";

// Бывшая главная страница (лендинг) — каталог сообществ теперь на "/".
// Не в навигации, доступна напрямую по ссылке.
export default async function AboutPage() {
  const supabase = createClient();
  const { data: communities } = await supabase
    .from("communities")
    .select("*")
    .eq("is_private", false)
    .order("member_count", { ascending: false })
    .limit(3);

  return (
    <div>
      <Hero />
      <Features />
      <CommunitiesShowcase communities={communities ?? []} />
      <Pricing />
      <Cta />
    </div>
  );
}
