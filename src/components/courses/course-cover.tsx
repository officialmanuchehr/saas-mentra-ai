import Image from "next/image";
import { BookOpen } from "lucide-react";
import { communityGradient } from "@/lib/community-gradient";
import { cn } from "@/lib/utils";

interface CourseCoverProps {
  courseId: string;
  title: string;
  coverUrl?: string | null;
  className?: string;
}

export function CourseCover({ courseId, title, coverUrl, className }: CourseCoverProps) {
  if (coverUrl) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image src={coverUrl} alt={title} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center justify-center overflow-hidden", className)}
      style={{ background: communityGradient(courseId) }}
    >
      <BookOpen className="size-8 text-white/90" strokeWidth={1.5} />
    </div>
  );
}
