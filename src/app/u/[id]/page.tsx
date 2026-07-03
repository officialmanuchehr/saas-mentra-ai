import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { LevelProgress } from "@/components/shared/level-progress";
import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog";
import { formatRelativeTime } from "@/lib/relative-time";

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/u/${params.id}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio, created_at")
    .eq("id", params.id)
    .single();

  if (!profile) {
    notFound();
  }

  const isOwnProfile = profile.id === user.id;

  const [{ data: memberships }, { data: posts }] = await Promise.all([
    supabase
      .from("memberships")
      .select("points, communities(slug, name)")
      .eq("user_id", profile.id)
      .order("points", { ascending: false }),
    supabase
      .from("posts")
      .select("id, title, content, created_at, communities(slug, name)")
      .eq("author_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const name = profile.full_name || "Без имени";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={name} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">{name}</h1>
          {profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}
          {isOwnProfile && (
            <div className="pt-2">
              <ProfileEditDialog
                fullName={profile.full_name ?? ""}
                bio={profile.bio ?? ""}
                avatarUrl={profile.avatar_url}
              />
            </div>
          )}
        </div>
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="font-bold">Сообщества</h2>
        {memberships && memberships.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {memberships.map((m, i) => {
              const community = m.communities as unknown as { slug: string; name: string } | null;
              if (!community) return null;
              return (
                <Link key={i} href={`/c/${community.slug}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <p className="mb-2 text-sm font-semibold">{community.name}</p>
                      <LevelProgress points={m.points} />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Пока не состоит ни в одном сообществе.</p>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-bold">Последние посты</h2>
        {posts && posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => {
              const community = post.communities as unknown as { slug: string; name: string } | null;
              return (
                <Card key={post.id}>
                  <CardContent className="space-y-1 p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{community?.name}</span>
                      <span>{formatRelativeTime(post.created_at)}</span>
                    </div>
                    <p className="font-semibold">{post.title}</p>
                    <p className="line-clamp-2 text-sm text-foreground/90">{post.content}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Постов пока нет.</p>
        )}
      </section>
    </div>
  );
}
