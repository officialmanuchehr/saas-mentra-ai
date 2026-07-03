import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CourseCover } from "@/components/courses/course-cover";
import { ProgressBar } from "@/components/shared/progress-bar";
import type { CourseWithProgress } from "@/components/courses/types";

export function CourseCard({ course, slug }: { course: CourseWithProgress; slug: string }) {
  const pct = course.totalLessons > 0 ? (course.completedLessons / course.totalLessons) * 100 : 0;

  return (
    <Link href={`/c/${slug}/courses/${course.id}`}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <CourseCover courseId={course.id} title={course.title} coverUrl={course.cover_url} className="h-32 w-full" />
        <CardContent className="space-y-3 p-5">
          <h3 className="font-bold leading-tight">{course.title}</h3>
          {course.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
          )}
          <div className="space-y-1.5">
            <ProgressBar value={pct} />
            <p className="text-xs text-muted-foreground">
              {course.completedLessons}/{course.totalLessons} уроков
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
