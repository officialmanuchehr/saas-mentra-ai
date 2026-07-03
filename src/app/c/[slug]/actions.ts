"use server";

import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnthropicClient } from "@/lib/anthropic";
import { POINTS } from "@/lib/points";

export async function completeCheckout(
  communityId: string,
  slug: string,
  input: { amount: number; currency: string }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Требуется вход");

  const { error: membershipError } = await supabase
    .from("memberships")
    .insert({ community_id: communityId, user_id: user.id });
  if (membershipError && membershipError.code !== "23505") {
    throw new Error(membershipError.message);
  }

  const { error: subscriptionError } = await supabase.from("subscriptions").insert({
    community_id: communityId,
    user_id: user.id,
    status: "active",
    amount: input.amount,
    currency: input.currency,
  });
  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }
}

async function getMembershipId(
  supabase: ReturnType<typeof createClient>,
  communityId: string,
  userId: string
) {
  const { data } = await supabase
    .from("memberships")
    .select("id")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .single();
  return data?.id ?? null;
}

export async function uploadPostImage(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Требуется вход");

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) throw new Error("Файл не выбран");

  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("post-images").upload(path, file);
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("post-images").getPublicUrl(path);

  return { url: publicUrl };
}

export async function createPost(
  communityId: string,
  input: { title: string; content: string; categoryId: string | null; imageUrls?: string[] }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Требуется вход");

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      community_id: communityId,
      author_id: user.id,
      category_id: input.categoryId,
      title: input.title,
      content: input.content,
    })
    .select("*, profiles(full_name, avatar_url)")
    .single();

  if (error || !post) throw new Error(error?.message ?? "Не удалось создать пост");

  if (input.imageUrls && input.imageUrls.length > 0) {
    await supabase.from("post_images").insert(
      input.imageUrls.map((url, index) => ({ post_id: post.id, url, sort_order: index }))
    );
  }

  const { data: postImages } = await supabase
    .from("post_images")
    .select("id, url, sort_order")
    .eq("post_id", post.id)
    .order("sort_order");

  const membershipId = await getMembershipId(supabase, communityId, user.id);
  if (membershipId) {
    await supabase.from("points_events").insert({
      membership_id: membershipId,
      event_type: "post_created",
      points: POINTS.post_created,
    });
  }

  return { post: { ...post, post_images: postImages ?? [] }, pointsAwarded: POINTS.post_created };
}

export async function createComment(
  postId: string,
  communityId: string,
  input: { content: string; parentId?: string | null }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Требуется вход");

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      parent_id: input.parentId ?? null,
      content: input.content,
    })
    .select("*, profiles(full_name, avatar_url)")
    .single();

  if (error || !comment) throw new Error(error?.message ?? "Не удалось добавить комментарий");

  const membershipId = await getMembershipId(supabase, communityId, user.id);
  if (membershipId) {
    await supabase.from("points_events").insert({
      membership_id: membershipId,
      event_type: "comment_created",
      points: POINTS.comment_created,
    });
  }

  return { comment, pointsAwarded: POINTS.comment_created };
}

export async function toggleLike(
  targetType: "post" | "comment",
  targetId: string,
  authorId: string,
  communityId: string
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Требуется вход");

  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
    return { liked: false };
  }

  await supabase.from("likes").insert({
    user_id: user.id,
    target_type: targetType,
    target_id: targetId,
  });

  // Очки получает автор поста/комментария, а не тот, кто поставил лайк.
  const authorMembershipId = await getMembershipId(supabase, communityId, authorId);
  if (authorMembershipId) {
    await supabase.from("points_events").insert({
      membership_id: authorMembershipId,
      event_type: "like_received",
      points: POINTS.like_received,
    });
  }

  return { liked: true };
}

export async function completeLesson(lessonId: string, communityId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Требуется вход");

  const { error: insertError } = await supabase
    .from("lesson_progress")
    .insert({ user_id: user.id, lesson_id: lessonId });

  const alreadyCompleted = insertError?.code === "23505";
  if (insertError && !alreadyCompleted) {
    throw new Error(insertError.message);
  }

  if (!alreadyCompleted) {
    const membershipId = await getMembershipId(supabase, communityId, user.id);
    if (membershipId) {
      await supabase.from("points_events").insert({
        membership_id: membershipId,
        event_type: "lesson_completed",
        points: POINTS.lesson_completed,
      });
    }
  }

  // Находим следующий урок по порядку модулей/уроков в этом же курсе.
  const { data: lesson } = await supabase
    .from("lessons")
    .select("module_id")
    .eq("id", lessonId)
    .single();

  let nextLessonId: string | null = null;
  if (lesson) {
    const { data: module } = await supabase
      .from("modules")
      .select("course_id")
      .eq("id", lesson.module_id)
      .single();

    if (module) {
      const { data: modules } = await supabase
        .from("modules")
        .select("id, lessons(id, sort_order)")
        .eq("course_id", module.course_id)
        .order("sort_order");

      const orderedLessonIds = (modules ?? []).flatMap((m) =>
        (m.lessons as { id: string; sort_order: number }[])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((l) => l.id)
      );
      const currentIndex = orderedLessonIds.indexOf(lessonId);
      nextLessonId = orderedLessonIds[currentIndex + 1] ?? null;
    }
  }

  return {
    alreadyCompleted,
    pointsAwarded: alreadyCompleted ? 0 : POINTS.lesson_completed,
    nextLessonId,
  };
}

const MENTRA_AI_BOT_NAME = "Mentra AI";

export async function generateWeeklySummary(communityId: string, communityName: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Требуется вход");

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    throw new Error("Только владелец или админ может генерировать итоги недели");
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: posts } = await supabase
    .from("posts")
    .select("title, content, likes_count, comments_count, created_at, profiles(full_name)")
    .eq("community_id", communityId)
    .gte("created_at", weekAgo.toISOString())
    .order("created_at", { ascending: true });

  if (!posts || posts.length === 0) {
    throw new Error("За последние 7 дней постов не было — нечего суммировать");
  }

  const { data: postIdsRows } = await supabase
    .from("posts")
    .select("id")
    .eq("community_id", communityId)
    .gte("created_at", weekAgo.toISOString());
  const postIds = (postIdsRows ?? []).map((p) => p.id);

  const { data: comments } =
    postIds.length > 0
      ? await supabase
          .from("comments")
          .select("content, profiles(full_name)")
          .in("post_id", postIds)
          .gte("created_at", weekAgo.toISOString())
      : { data: [] };

  const postsText = posts
    .map((p) => {
      const author = (p.profiles as unknown as { full_name: string | null } | null)?.full_name;
      return `Пост «${p.title}» (автор: ${author ?? "неизвестен"}, лайков: ${p.likes_count}, комментариев: ${p.comments_count}):\n${p.content}`;
    })
    .join("\n\n");

  const commentsText = (comments ?? [])
    .map((c) => {
      const author = (c.profiles as unknown as { full_name: string | null } | null)?.full_name;
      return `Комментарий от ${author ?? "неизвестен"}: ${c.content}`;
    })
    .join("\n");

  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system:
      "Ты — ассистент сообщества Mentra AI. Пишешь короткие еженедельные дайджесты для участников сообщества на русском языке. Пиши обычным текстом без markdown-разметки (без **, ##, - списков через дефис — если нужен список, используй эмодзи или нумерацию словами). Тон дружелюбный и живой, без канцелярита.",
    messages: [
      {
        role: "user",
        content: `Вот активность в сообществе «${communityName}» за последние 7 дней.\n\nПосты:\n${postsText}\n\nКомментарии:\n${commentsText || "(комментариев не было)"}\n\nНапиши итоги недели с тремя разделами: 1) Главные обсуждения — о чём говорили; 2) Топ-посты — какие посты набрали больше всего внимания и почему это интересно; 3) Самые активные участники — кто больше всего писал и комментировал. Будь конкретным, ссылайся на реальные темы и имена из данных выше. Объём — 150-250 слов.`,
      },
    ],
  });

  const summaryText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!summaryText) {
    throw new Error("Claude не вернул текст итогов");
  }

  const admin = createAdminClient();

  let { data: bot } = await admin
    .from("profiles")
    .select("id")
    .eq("full_name", MENTRA_AI_BOT_NAME)
    .maybeSingle();

  if (!bot) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: `mentra-ai-bot-${Date.now()}@mentra.internal`,
      email_confirm: true,
      user_metadata: { full_name: MENTRA_AI_BOT_NAME },
    });
    if (createError || !created.user) {
      throw new Error(`Не удалось создать системный профиль: ${createError?.message}`);
    }
    bot = { id: created.user.id };
  }

  const today = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  const { data: post, error: postError } = await admin
    .from("posts")
    .insert({
      community_id: communityId,
      author_id: bot.id,
      title: `Итоги недели — ${today}`,
      content: summaryText,
      is_pinned: true,
    })
    .select("*, profiles(full_name, avatar_url)")
    .single();

  if (postError || !post) {
    throw new Error(postError?.message ?? "Не удалось опубликовать итоги недели");
  }

  return { post };
}
