import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[860px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "linear-gradient(135deg, #5B6EF5 0%, #818CF8 100%)" }}
      />
      <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Платформа для сообществ и онлайн-школ в Центральной Азии
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Запустите своё сообщество за 5 минут: лента, курсы, геймификация и приём
          платежей — всё в одном месте, без десятка разрозненных сервисов.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/register">Начать бесплатно</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Смотреть сообщества</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
