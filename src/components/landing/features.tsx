import { BookOpen, CreditCard, Trophy, Users } from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Сообщество",
    description: "Лента, посты, комментарии и лайки — живое общение внутри вашего сообщества.",
  },
  {
    icon: BookOpen,
    title: "Курсы",
    description: "Стройте образовательные программы с модулями, уроками и отслеживанием прогресса.",
  },
  {
    icon: Trophy,
    title: "Геймификация",
    description: "Очки, уровни и лидерборд мотивируют участников быть активными каждый день.",
  },
  {
    icon: CreditCard,
    title: "Приём платежей",
    description: "Монетизируйте сообщество платными подписками — оплата в несколько кликов.",
  },
];

export function Features() {
  return (
    <section className="bg-secondary py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Всё для роста сообщества</h2>
          <p className="mt-3 text-muted-foreground">
            Один продукт вместо связки из чата, LMS и платёжного сервиса.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl bg-card p-6 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-full bg-primary-light">
                <feature.icon className="size-5 text-primary" />
              </div>
              <h3 className="mt-4 font-bold">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
