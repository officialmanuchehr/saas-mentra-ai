import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseViewer } from "@/components/courses/course-viewer";
import type { CourseModule } from "@/components/courses/types";

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string; courseId: string };
}) {
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

  const [{ data: course }, { data: membership }] = await Promise.all([
    supabase
      .from("courses")
      .select(
        "id, title, modules(id, course_id, title, sort_order, lessons(id, module_id, title, video_url, content, duration_min, sort_order))"
      )
      .eq("id", params.courseId)
      .eq("community_id", community.id)
      .single(),
    supabase
      .from("memberships")
      .select("role")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!course) {
    notFound();
  }

  const isAdmin = membership?.role === "owner" || membership?.role === "admin";

  const modules = (course.modules as CourseModule[])
    .map((m) => ({ ...m, lessons: [...m.lessons].sort((a, b) => a.sort_order - b.sort_order) }))
    .sort((a, b) => a.sort_order - b.sort_order);

  const allLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));

  const { data: progress } =
    allLessonIds.length > 0
      ? await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .in("lesson_id", allLessonIds)
      : { data: [] };

  return (
    <CourseViewer
      communityId={community.id}
      courseId={course.id}
      courseTitle={course.title}
      modules={modules}
      initialCompletedLessonIds={(progress ?? []).map((p) => p.lesson_id)}
      isAdmin={isAdmin}
    />
  );
}
