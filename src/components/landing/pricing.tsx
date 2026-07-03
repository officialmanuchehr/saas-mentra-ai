import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Бесплатно",
    price: "0 TJS",
    period: "навсегда",
    description: "Чтобы попробовать платформу и запустить первое сообщество.",
    features: ["1 сообщество", "Лента и участники", "Базовая геймификация"],
    cta: "Начать бесплатно",
    highlighted: false,
  },
  {
    name: "Про",
    price: "299 TJS",
    period: "/мес",
    description: "Для создателей, которые монетизируют сообщество и курсы.",
    features: [
      "Неограниченно сообществ",
      "Курсы и уроки",
      "Приём платных подписок",
      "Итоги недели от AI",
    ],
    cta: "Попробовать Про",
    highlighted: true,
  },
  {
    name: "Бизнес",
    price: "По запросу",
    period: "",
    description: "Для крупных школ и организаций с несколькими командами.",
    features: ["Всё из Про", "Персональный менеджер", "Приоритетная поддержка"],
    cta: "Связаться с нами",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section className="bg-secondary py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Простые и понятные цены</h2>
          <p className="mt-3 text-muted-foreground">
            Начните бесплатно и переходите на платный план, когда сообщество начнёт расти.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "flex flex-col rounded-2xl bg-card p-8 shadow-sm",
                plan.highlighted && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{plan.name}</h3>
                {plan.highlighted && <Badge variant="light">Популярный</Badge>}
              </div>
              <p className="mt-4">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button asChild className="mt-6" variant={plan.highlighted ? "default" : "outline"}>
                <Link href="/register">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
