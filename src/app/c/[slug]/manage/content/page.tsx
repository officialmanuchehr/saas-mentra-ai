import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContentPostsList } from "@/components/manage/content-posts-list";
import { Badge } from "@/components/ui/badge";

export default async function ManageContentPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/c/${params.slug}/manage`);
  }

  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", params.slug)
    .single();
  if (!community) {
    notFound();
  }

  const { data: myMembership } = await supabase
    .from("memberships")
    .select("role")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const isAdmin = myMembership?.role === "owner" || myMembership?.role === "admin";
  if (!isAdmin) {
    redirect(`/c/${params.slug}`);
  }

  const [{ data: categories }, { data: posts }, { data: courses }] = await Promise.all([
    supabase
      .from("post_categories")
      .select("id, name, emoji")
      .eq("community_id", community.id)
      .order("sort_order"),
    supabase
      .from("posts")
      .select("id, title, category_id, is_pinned, likes_count, comments_count, created_at, profiles(full_name)")
      .eq("community_id", community.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("courses")
      .select("id, title, is_published")
      .eq("community_id", community.id)
      .order("sort_order"),
  ]);

  const contentPosts = (posts ?? []).map((p) => {
    const author = p.profiles as unknown as { full_name: string | null } | null;
    return {
      id: p.id,
      title: p.title,
      category_id: p.category_id,
      is_pinned: p.is_pinned,
      likes_count: p.likes_count,
      comments_count: p.comments_count,
      created_at: p.created_at,
      authorName: author?.full_name || "Без имени",
    };
  });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 font-bold">Посты</h2>
        <ContentPostsList posts={contentPosts} categories={categories ?? []} communityId={community.id} />
      </section>

      <section>
        <h2 className="mb-3 font-bold">Курсы</h2>
        {(courses ?? []).length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
            Курсов пока нет.
          </p>
        ) : (
          <div className="space-y-2">
            {(courses ?? []).map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-sm"
              >
                <span className="font-medium">{course.title}</span>
                <Badge variant={course.is_published ? "light" : "outline"}>
                  {course.is_published ? "Опубликован" : "Черновик"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
