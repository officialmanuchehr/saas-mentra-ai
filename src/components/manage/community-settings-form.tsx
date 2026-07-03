"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageDropzone } from "@/components/shared/image-dropzone";
import { CommunityCover } from "@/components/communities/community-cover";
import { cn } from "@/lib/utils";
import { COVER_GRADIENT_PRESETS } from "@/lib/community-gradient";
import { uploadCommunityImage, setCommunityCoverGradient } from "@/app/c/[slug]/manage/actions";

interface CommunitySettingsFormProps {
  communityId: string;
  slug: string;
  name: string;
  avatarUrl: string | null;
  coverUrl: string | null;
}

export function CommunitySettingsForm({
  communityId,
  slug,
  name,
  avatarUrl,
  coverUrl,
}: CommunitySettingsFormProps) {
  const router = useRouter();
  const [gradientBusy, setGradientBusy] = useState(false);

  async function uploadAvatar(file: File) {
    const fd = new FormData();
    fd.set("image", file);
    const { url } = await uploadCommunityImage(communityId, "avatar", fd);
    return url;
  }

  async function uploadCover(file: File) {
    const fd = new FormData();
    fd.set("image", file);
    const { url } = await uploadCommunityImage(communityId, "cover", fd);
    return url;
  }

  function handleUploaded(label: string) {
    toast.success(`${label} обновлена`);
    router.refresh();
  }

  async function handlePickGradient(key: string) {
    setGradientBusy(true);
    try {
      await setCommunityCoverGradient(communityId, key);
      toast.success("Обложка обновлена");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось обновить обложку");
    } finally {
      setGradientBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium">Аватар сообщества</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Квадратное изображение — логотип сообщества в каталоге и шапке.
        </p>
        <div className="w-24">
          <ImageDropzone
            label="Аватар сообщества"
            currentUrl={avatarUrl}
            maxDimension={512}
            shape="square"
            upload={uploadAvatar}
            onUploaded={() => handleUploaded("Аватар")}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium">Обложка</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Широкое изображение сверху страницы сообщества. Рекомендуемое соотношение сторон — 3:1.
        </p>
        <ImageDropzone
          label="Обложка сообщества"
          currentUrl={coverUrl?.startsWith("gradient:") ? null : coverUrl}
          maxDimension={1600}
          shape="wide"
          upload={uploadCover}
          onUploaded={() => handleUploaded("Обложка")}
        />

        <p className="mb-2 mt-4 text-sm font-medium">Или выберите готовый градиент</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {COVER_GRADIENT_PRESETS.map((preset) => {
            const isActive = coverUrl === `gradient:${preset.key}`;
            return (
              <button
                key={preset.key}
                type="button"
                disabled={gradientBusy}
                onClick={() => handlePickGradient(preset.key)}
                className={cn(
                  "aspect-square overflow-hidden rounded-2xl ring-offset-2 transition-all hover:opacity-90",
                  isActive && "ring-2 ring-primary"
                )}
                style={{ background: preset.css }}
                aria-label={preset.label}
              />
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Предпросмотр</p>
        <CommunityCover
          slug={slug}
          name={name}
          coverUrl={coverUrl}
          className="h-32 w-full max-w-md rounded-2xl sm:h-40"
        />
      </div>
    </div>
  );
}
