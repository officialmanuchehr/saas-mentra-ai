import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Готовы запустить своё сообщество?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Присоединяйтесь бесплатно — карта не нужна.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/register">Начать бесплатно</Link>
        </Button>
      </div>
    </section>
  );
}
