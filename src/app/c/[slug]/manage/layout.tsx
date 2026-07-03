import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ManageNav } from "@/components/manage/manage-nav";

export default async function ManageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/c/${params.slug}/manage`);
  }

  const { data: community } = await supabase
    .from("communities")
    .select("id, slug, name")
    .eq("slug", params.slug)
    .single();
  if (!community) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = membership?.role === "owner" || membership?.role === "admin";
  if (!isAdmin) {
    redirect(`/c/${params.slug}`);
  }

  return (
    <div>
      <div className="border-b border-border/60 bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <Link
            href={`/c/${community.slug}`}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> Назад к сообществу
          </Link>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight">
            Управление · {community.name}
          </h1>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:flex-row sm:px-6">
        <ManageNav slug={community.slug} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
