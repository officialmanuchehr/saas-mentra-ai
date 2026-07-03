// Детерминированный градиент-плейсхолдер обложки сообщества в стилистике
// бренда (используется, пока нет загруженного cover_url). Тон всегда
// в диапазоне около primary hue (233), чтобы карточки выглядели как одна
// система, но каждое сообщество получало свой оттенок.

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function communityGradient(seed: string): string {
  const hash = hashString(seed);
  const hueA = 233 + (hash % 50) - 25;
  const hueB = hueA + 35 + (hash % 20);
  const angle = 120 + (hash % 60);

  return `linear-gradient(${angle}deg, hsl(${hueA} 85% 62%) 0%, hsl(${hueB} 80% 48%) 100%)`;
}

// Готовые градиенты для ручного выбора обложки в Настройках сообщества
// (альтернатива загрузке своего изображения) — фиксированный набор, а не
// сгенерированный по хэшу, чтобы владелец мог выбрать конкретный вариант.

export const COVER_GRADIENT_PRESETS = [
  { key: "cobalt", label: "Кобальт", css: "linear-gradient(135deg, hsl(233 85% 62%) 0%, hsl(268 80% 48%) 100%)" },
  { key: "violet", label: "Фиолет", css: "linear-gradient(135deg, hsl(258 85% 65%) 0%, hsl(320 75% 55%) 100%)" },
  { key: "ocean", label: "Океан", css: "linear-gradient(135deg, hsl(200 85% 55%) 0%, hsl(233 80% 55%) 100%)" },
  { key: "sunset", label: "Закат", css: "linear-gradient(135deg, hsl(280 75% 60%) 0%, hsl(340 80% 60%) 100%)" },
  { key: "mint", label: "Мята", css: "linear-gradient(135deg, hsl(160 70% 45%) 0%, hsl(200 80% 50%) 100%)" },
  { key: "amber", label: "Янтарь", css: "linear-gradient(135deg, hsl(30 85% 55%) 0%, hsl(340 75% 55%) 100%)" },
] as const;

export const COVER_GRADIENT_PREFIX = "gradient:";

export function coverGradientCss(coverUrl: string): string | null {
  if (!coverUrl.startsWith(COVER_GRADIENT_PREFIX)) return null;
  const key = coverUrl.slice(COVER_GRADIENT_PREFIX.length);
  return COVER_GRADIENT_PRESETS.find((p) => p.key === key)?.css ?? null;
}
