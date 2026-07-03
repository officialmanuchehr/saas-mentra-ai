import { notFound, redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CourseCard } from "@/components/courses/course-card";
import type { CourseWithProgress } from "@/components/courses/types";

export default async function CommunityCoursesPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/c/${params.slug}/about`);
  }

  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", params.slug)
    .single();
  if (!community) {
    notFound();
  }

  const { data: courses } = await supabase
    .from("courses")
    .select("id, community_id, title, description, cover_url, modules(id, lessons(id))")
    .eq("community_id", community.id)
    .eq("is_published", true)
    .order("sort_order");

  const allLessonIds = (courses ?? []).flatMap((c) =>
    (c.modules as { lessons: { id: string }[] }[]).flatMap((m) => m.lessons.map((l) => l.id))
  );

  const { data: progress } =
    allLessonIds.length > 0
      ? await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .in("lesson_id", allLessonIds)
      : { data: [] };

  const completedSet = new Set((progress ?? []).map((p) => p.lesson_id));

  const coursesWithProgress: CourseWithProgress[] = (courses ?? []).map((c) => {
    const lessonIds = (c.modules as { lessons: { id: string }[] }[]).flatMap((m) =>
      m.lessons.map((l) => l.id)
    );
    return {
      id: c.id,
      community_id: c.community_id,
      title: c.title,
      description: c.description,
      cover_url: c.cover_url,
      totalLessons: lessonIds.length,
      completedLessons: lessonIds.filter((id) => completedSet.has(id)).length,
    };
  });

  if (coursesWithProgress.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-card py-16 text-center shadow-sm">
        <BookOpen className="size-10 text-muted-foreground" strokeWidth={1.5} />
        <p className="font-semibold">В этом сообществе пока нет курсов</p>
        <p className="text-sm text-muted-foreground">Загляните позже.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {coursesWithProgress.map((course) => (
        <CourseCard key={course.id} course={course} slug={params.slug} />
      ))}
    </div>
  );
}
