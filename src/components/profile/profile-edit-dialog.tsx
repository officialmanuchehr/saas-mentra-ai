"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateProfile, uploadAvatar, removeAvatar } from "@/app/u/[id]/actions";
import { compressImage, validateImageFile } from "@/lib/image-compress";

interface ProfileEditDialogProps {
  fullName: string;
  bio: string;
  avatarUrl: string | null;
}

export function ProfileEditDialog({ fullName, bio, avatarUrl }: ProfileEditDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(fullName);
  const [bioText, setBioText] = useState(bio);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initials = (name || "?").slice(0, 2).toUpperCase();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      const blob = await compressImage(file, 512);
      const compressedFile = new File([blob], "avatar.jpg", { type: blob.type });
      setSelectedFile(compressedFile);
      setAvatarRemoved(false);
      setPreview(URL.createObjectURL(compressedFile));
    } catch {
      toast.error("Не удалось обработать изображение.");
    }
  }

  function handleRemovePhoto() {
    setSelectedFile(null);
    setAvatarRemoved(true);
    setPreview(null);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Укажите имя.");
      return;
    }
    setSubmitting(true);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.set("avatar", selectedFile);
        await uploadAvatar(formData);
      } else if (avatarRemoved) {
        await removeAvatar();
      }
      await updateProfile({ fullName: name.trim(), bio: bioText });
      toast.success("Профиль обновлён");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Не удалось сохранить профиль. Попробуйте снова.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Редактировать профиль
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактирование профиля</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={preview ?? undefined} alt={name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Загрузить фото
                </Button>
                {preview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={handleRemovePhoto}
                  >
                    Удалить фото
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Имя
              </label>
              <Input id="fullName" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium">
                О себе
              </label>
              <Textarea
                id="bio"
                rows={4}
                placeholder="Расскажите немного о себе..."
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={handleSave} disabled={submitting}>
              {submitting ? "Сохраняем..." : "Сохранить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
