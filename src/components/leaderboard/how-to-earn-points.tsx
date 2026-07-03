import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POINTS } from "@/lib/points";

const ITEMS = [
  { label: "Новый пост", points: POINTS.post_created },
  { label: "Комментарий", points: POINTS.comment_created },
  { label: "Получить лайк", points: POINTS.like_received },
  { label: "Пройти урок", points: POINTS.lesson_completed },
];

export function HowToEarnPoints() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Как заработать очки</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ITEMS.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-foreground/80">{item.label}</span>
            <span className="font-semibold text-primary">+{item.points}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
