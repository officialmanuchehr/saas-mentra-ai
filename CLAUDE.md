# Mentra AI — контекст проекта

## Что мы строим

Mentra AI — русскоязычная платформа сообществ для коучей и образователей в Центральной Азии (аналог Skool). Сообщество = лента постов + курсы (LMS) + геймификация (очки, уровни, лидерборд) + платная подписка.

Это MVP для демонстрации инвесторам. Приоритет: скорость, визуальное качество, работающий happy path. Не переусложняй — никаких преждевременных оптимизаций, микросервисов, избыточных абстракций.

**Весь UI-текст — только на русском языке.** Никакого английского в интерфейсе. Плейсхолдеры, ошибки, кнопки, пустые состояния — всё на русском.

## Стек (не менять)

- Next.js 14+ (App Router, Server Components где возможно), TypeScript
- Tailwind CSS + shadcn/ui
- Supabase: Auth, Postgres (RLS), Storage, Realtime
- Иконки: lucide-react
- Деплой: Vercel

Отдельного бэкенда нет — вся логика через Supabase (RLS, триггеры, RPC-функции) и Server Actions.

## Дизайн-система

Стиль: чистый, светлый, современный tech — уровень Notion/Linear. Много воздуха, минимум шума. Дружелюбный, но не детский.

**Цвета (в tailwind.config / CSS-переменных):**
- `primary`: #5B6EF5 (кобальтово-синий из логотипа)
- `primary-light`: #5B6EF5 с opacity 15% — фоны бейджей, hover, активные состояния
- Текст основной: #0A0A0A, вторичный: #6B7280
- Фон: #FFFFFF, секции/подложки: #F7F8FC
- Успех: #10B981, ошибка: #EF4444

**Типографика:** Manrope (Google Fonts, поддержка кириллицы обязательна). Заголовки 700–800.

**Форма:** большие радиусы скругления — карточки rounded-2xl (16–24px), кнопки и бейджи полностью круглые (rounded-full). Мягкие тени (shadow-sm/md) вместо жёстких границ. Капсульные формы — ключевой мотив бренда (из логотипа с наклонными скруглёнными штрихами).

**Логотип:** файл public/logo.png. Буква M из синих капсул + текст.

## Схема БД (Supabase)

```sql
profiles: id (uuid, FK auth.users), full_name, avatar_url, bio, created_at

communities: id, slug, name, description, cover_url, owner_id (FK profiles),
  is_private, price_monthly (numeric, null = бесплатно), currency, created_at

memberships: id, community_id, user_id, role (owner|admin|member),
  points (int default 0), joined_at
  UNIQUE(community_id, user_id)

post_categories: id, community_id, name, emoji, sort_order

posts: id, community_id, author_id, category_id, title, content,
  is_pinned, likes_count, comments_count, created_at

comments: id, post_id, author_id, parent_id (nullable), content, created_at

likes: id, user_id, target_type (post|comment), target_id
  UNIQUE(user_id, target_type, target_id)

courses: id, community_id, title, description, cover_url, sort_order, is_published
modules: id, course_id, title, sort_order
lessons: id, module_id, title, video_url, content, duration_min, sort_order
lesson_progress: id, user_id, lesson_id, completed_at
  UNIQUE(user_id, lesson_id)

points_events: id, membership_id, event_type
  (post_created|comment_created|like_received|lesson_completed|daily_login),
  points, created_at
-- триггер: insert в points_events -> обновляет memberships.points

subscriptions: id, community_id, user_id, status (active|canceled|past_due),
  amount, currency, started_at, expires_at
```

**RLS:** контент приватного/платного сообщества видят только члены (EXISTS по memberships). Бесплатные открытые — все авторизованные. Писать посты — члены, модерация (закреп, удаление чужого) — owner/admin.

**Уровни:** функция от очков, не хранить. Пороги: L1=0, L2=5, L3=20, L4=65, L5=155, L6=515, L7=2015, L8=8015, L9=33015.

**Начисление очков:** пост +2, комментарий +1, полученный лайк +1, завершённый урок +3.

## Правила работы

1. Работаем строго по фазам. Делай ТОЛЬКО текущую фазу, не забегай вперёд.
2. В конце фазы: краткое резюме что сделано + как проверить руками (какие страницы открыть, что кликнуть).
3. Все миграции БД — отдельными SQL-файлами в /supabase/migrations, с комментариями.
4. Seed-данные — реалистичный русский контент, никаких lorem ipsum.
5. Компоненты переиспользуемые, но без over-engineering. Файлы до ~200 строк, дальше — разбивай.
6. Мобильная адаптивность обязательна (инвестор может открыть с телефона).
7. Если что-то неясно — спроси, не выдумывай требования.
