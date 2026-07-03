export interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  video_url: string | null;
  content: string | null;
  duration_min: number | null;
  sort_order: number;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  lessons: CourseLesson[];
}

export interface CourseWithProgress {
  id: string;
  community_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  totalLessons: number;
  completedLessons: number;
}
