"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/slugify";
import { checkSlugAvailable, createCommunity } from "@/app/create/actions";

const STEPS = ["Основное", "Приватность и цена", "Категории"];
const CURRENCIES = ["TJS", "RUB", "USD"];

interface CategoryDraft {
  name: string;
  emoji: string;
}

export function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const [isPrivate, setIsPrivate] = useState(false);
  const [isFree, setIsFree] = useState(true);
  const [priceMonthly, setPriceMonthly] = useState("");
  const [currency, setCurrency] = useState("TJS");

  const [categories, setCategories] = useState<CategoryDraft[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryEmoji, setCategoryEmoji] = useState("");

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  useEffect(() => {
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const timeout = setTimeout(async () => {
      const { available } = await checkSlugAvailable(slug);
      setSlugStatus(available ? "available" : "taken");
    }, 400);
    return () => clearTimeout(timeout);
  }, [slug]);

  const step1Valid = name.trim().length >= 2 && slug.trim().length >= 2 && slugStatus === "available";
  const step2Valid = isFree || (Number(priceMonthly) > 0 && currency);

  function addCategory() {
    if (!categoryName.trim()) return;
    setCategories((prev) => [...prev, { name: categoryName.trim(), emoji: categoryEmoji.trim() }]);
    setCategoryName("");
    setCategoryEmoji("");
  }

  function removeCategory(index: number) {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const { slug: createdSlug } = await createCommunity({
        name: name.trim(),
        slug: slug.trim(),
        description,
        isPrivate,
        priceMonthly: isFree ? null : Number(priceMonthly),
        currency,
        categories: categories.map((c) => ({ name: c.name, emoji: c.emoji || null })),
      });
      toast.success("Сообщество создано!");
      router.push(`/c/${createdSlug}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось создать сообщество");
    } finally {
      setSubmitting(false);
    }
  }

  const slugHint = useMemo(() => {
    if (!slug) return null;
    if (slugStatus === "checking") return { text: "Проверяем доступность...", tone: "muted" };
    if (slugStatus === "taken") return { text: "Этот адрес уже занят", tone: "error" };
    if (slugStatus === "available") return { text: "Адрес свободен", tone: "success" };
    return null;
  }, [slug, slugStatus]);

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                i <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}
            >
              {i + 1}
            </div>
            {i < STEPS.length - 1 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Шаг {step + 1} из {STEPS.length} · {STEPS[step]}
      </p>

      <div className="space-y-5 rounded-2xl bg-card p-6 shadow-sm">
        {step === 0 && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Название сообщества</label>
              <Input
                placeholder="Например, Школа продаж Б2Б"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Адрес сообщества</label>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>mentra.ai/c/</span>
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                  className="h-8"
                />
              </div>
              {slugHint && (
                <p
                  className={cn(
                    "text-xs",
                    slugHint.tone === "error" && "text-destructive",
                    slugHint.tone === "success" && "text-success",
                    slugHint.tone === "muted" && "text-muted-foreground"
                  )}
                >
                  {slugHint.text}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Описание</label>
              <Textarea
                rows={3}
                placeholder="О чём ваше сообщество?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Доступ</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={cn(
                    "flex-1 rounded-2xl border px-4 py-3 text-left text-sm transition-colors",
                    !isPrivate ? "border-primary bg-primary-light" : "border-border hover:bg-accent"
                  )}
                >
                  <span className="font-semibold">Публичное</span>
                  <p className="text-xs text-muted-foreground">Виден каталог, о сообществе — всем</p>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={cn(
                    "flex-1 rounded-2xl border px-4 py-3 text-left text-sm transition-colors",
                    isPrivate ? "border-primary bg-primary-light" : "border-border hover:bg-accent"
                  )}
                >
                  <span className="font-semibold">Приватное</span>
                  <p className="text-xs text-muted-foreground">Видно только участникам</p>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Стоимость</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsFree(true)}
                  className={cn(
                    "flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors",
                    isFree ? "border-primary bg-primary-light" : "border-border hover:bg-accent"
                  )}
                >
                  Бесплатно
                </button>
                <button
                  type="button"
                  onClick={() => setIsFree(false)}
                  className={cn(
                    "flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors",
                    !isFree ? "border-primary bg-primary-light" : "border-border hover:bg-accent"
                  )}
                >
                  Платная подписка
                </button>
              </div>

              {!isFree && (
                <div className="flex gap-2 pt-1">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Цена в месяц"
                    value={priceMonthly}
                    onChange={(e) => setPriceMonthly(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="rounded-2xl border border-input bg-background px-3 text-sm"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Категории постов (необязательно)</label>
              <p className="text-xs text-muted-foreground">
                Помогают участникам фильтровать ленту. Можно пропустить и добавить позже.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Эмодзи"
                  value={categoryEmoji}
                  onChange={(e) => setCategoryEmoji(e.target.value)}
                  className="w-16"
                  maxLength={2}
                />
                <Input
                  placeholder="Название категории"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addCategory}
                  aria-label="Добавить категорию"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {categories.map((c, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm"
                    >
                      {c.emoji} {c.name}
                      <button type="button" onClick={() => removeCategory(i)}>
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-secondary p-4 text-sm">
              <p className="font-semibold">{name}</p>
              <p className="text-muted-foreground">mentra.ai/c/{slug}</p>
              <p className="mt-1 text-muted-foreground">
                {isPrivate ? "Приватное" : "Публичное"} ·{" "}
                {isFree ? "Бесплатно" : `${priceMonthly || 0} ${currency}/мес`}
              </p>
            </div>
          </>
        )}

        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Назад
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={step === 0 && !step1Valid}
            >
              Далее
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting || !step1Valid || !step2Valid}>
              {submitting ? "Создаём..." : "Создать сообщество"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
